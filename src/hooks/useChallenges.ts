import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  challenge_type: 'individual' | 'team' | 'company';
  target_metric: string;
  target_value: number;
  points_reward: number;
  badge_reward_id: string | null;
  bonus_payout_percent: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  user_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  reward_claimed: boolean;
  joined_at: string;
  challenge?: Challenge;
}

export interface ChallengeWithProgress extends Challenge {
  participation?: ChallengeParticipation;
  progress_percent: number;
  time_remaining: string;
  is_joined: boolean;
}

export function useChallenges(userId?: string) {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [myChallenges, setMyChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const formatTimeRemaining = (endDate: string): string => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  const fetchChallenges = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      
      // Fetch active challenges
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .gte('ends_at', now)
        .order('ends_at', { ascending: true });

      if (error) {
        console.error('Error fetching challenges:', error);
        return;
      }

      // Fetch user's participations if logged in
      let participations: ChallengeParticipation[] = [];
      if (userId) {
        const { data: partData } = await supabase
          .from('challenge_participants')
          .select('*')
          .eq('user_id', userId);
        participations = (partData || []) as ChallengeParticipation[];
      }

      const participationMap = new Map(participations.map(p => [p.challenge_id, p]));

      const enrichedChallenges: ChallengeWithProgress[] = (challengesData || []).map(challenge => {
        const participation = participationMap.get(challenge.id);
        const progressPercent = participation 
          ? Math.min((participation.progress / challenge.target_value) * 100, 100)
          : 0;

        return {
          ...challenge,
          participation,
          progress_percent: progressPercent,
          time_remaining: formatTimeRemaining(challenge.ends_at),
          is_joined: !!participation,
        } as ChallengeWithProgress;
      });

      setChallenges(enrichedChallenges);
      setMyChallenges(enrichedChallenges.filter(c => c.is_joined));
    } catch (err) {
      console.error('Error in fetchChallenges:', err);
    }
  }, [userId]);

  const joinChallenge = async (challengeId: string): Promise<boolean> => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to join challenges',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          progress: 0,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Joined',
            description: 'You have already joined this challenge',
          });
        } else {
          throw error;
        }
        return false;
      }

      toast({
        title: '🎯 Challenge Joined!',
        description: 'Good luck! Track your progress in the Rewards tab.',
      });

      await fetchChallenges();
      return true;
    } catch (err) {
      console.error('Error joining challenge:', err);
      toast({
        title: 'Error',
        description: 'Failed to join challenge. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateProgress = async (challengeId: string, newProgress: number): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Get the challenge to check target
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return false;

      const completed = newProgress >= challenge.target_value;

      const { error } = await supabase
        .from('challenge_participants')
        .update({
          progress: newProgress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) throw error;

      if (completed) {
        toast({
          title: '🏆 Challenge Completed!',
          description: `You've completed "${challenge.name}"! Claim your reward.`,
        });
      }

      await fetchChallenges();
      return true;
    } catch (err) {
      console.error('Error updating progress:', err);
      return false;
    }
  };

  const claimReward = async (challengeId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge || !challenge.participation?.completed) return false;

      const { error } = await supabase
        .from('challenge_participants')
        .update({ reward_claimed: true })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) throw error;

      // Award points would happen via the gamification hook
      toast({
        title: '🎁 Reward Claimed!',
        description: `+${challenge.points_reward} points added to your balance!`,
      });

      await fetchChallenges();
      return true;
    } catch (err) {
      console.error('Error claiming reward:', err);
      return false;
    }
  };

  const getChallengeLeaderboard = async (challengeId: string) => {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          user_id,
          progress,
          completed,
          completed_at
        `)
        .eq('challenge_id', challengeId)
        .order('progress', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch user profiles
      const userIds = data?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const profileMap = new Map<string, any>((profiles as any[])?.map((p: any) => [p.id, p]) || []);

      return (data || []).map((entry, index) => {
        const profile = profileMap.get(entry.user_id);
        return {
          rank: index + 1,
          user_id: entry.user_id,
          name: profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous'
            : 'Anonymous',
          progress: entry.progress,
          completed: entry.completed,
        };
      });
    } catch (err) {
      console.error('Error fetching challenge leaderboard:', err);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchChallenges();
      setLoading(false);
    };

    loadData();
  }, [fetchChallenges]);

  return {
    challenges,
    myChallenges,
    loading,
    joinChallenge,
    updateProgress,
    claimReward,
    getChallengeLeaderboard,
    refetch: fetchChallenges,
  };
}
