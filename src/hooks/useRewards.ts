import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  reward_value: string;
  quantity_available: number | null;
  is_available: boolean;
  valid_days: number;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  redeemed_at: string;
  expires_at: string | null;
  used_at: string | null;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  reward?: Reward;
}

export function useRewards(userId?: string) {
  const [catalog, setCatalog] = useState<Reward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCatalog = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('is_available', true)
        .order('points_cost', { ascending: true });

      if (error) {
        console.error('Error fetching rewards catalog:', error);
        return;
      }

      setCatalog(data as Reward[]);
    } catch (err) {
      console.error('Error in fetchCatalog:', err);
    }
  }, []);

  const fetchMyRedemptions = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards_catalog(*)
        `)
        .eq('user_id', userId)
        .order('redeemed_at', { ascending: false });

      if (error) {
        console.error('Error fetching redemptions:', error);
        return;
      }

      setMyRedemptions(data as RewardRedemption[]);
    } catch (err) {
      console.error('Error in fetchMyRedemptions:', err);
    }
  }, [userId]);

  const redeemReward = async (rewardId: string, availablePoints: number): Promise<boolean> => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to redeem rewards',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const reward = catalog.find(r => r.id === rewardId);
      if (!reward) {
        toast({
          title: 'Error',
          description: 'Reward not found',
          variant: 'destructive',
        });
        return false;
      }

      if (availablePoints < reward.points_cost) {
        toast({
          title: 'Insufficient Points',
          description: `You need ${reward.points_cost - availablePoints} more points to redeem this reward.`,
          variant: 'destructive',
        });
        return false;
      }

      // Calculate expiration date
      const expiresAt = reward.valid_days 
        ? new Date(Date.now() + reward.valid_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Create redemption record
      const { error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: userId,
          reward_id: rewardId,
          points_spent: reward.points_cost,
          expires_at: expiresAt,
        });

      if (redemptionError) throw redemptionError;

      // Deduct points from user
      const { error: updateError } = await supabase
        .from('user_gamification')
        .update({
          available_points: availablePoints - reward.points_cost,
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Note: points_transactions table uses member_id for store members
      // For gamification rewards, we track deductions in user_gamification directly
      console.log(`Redeemed reward ${reward.name} for ${reward.points_cost} points`);

      toast({
        title: '🎁 Reward Redeemed!',
        description: `You've successfully redeemed "${reward.name}"!`,
      });

      await fetchMyRedemptions();
      return true;
    } catch (err) {
      console.error('Error redeeming reward:', err);
      toast({
        title: 'Error',
        description: 'Failed to redeem reward. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getRewardTypeIcon = (type: string): string => {
    switch (type) {
      case 'visibility_boost': return '📍';
      case 'bonus_payout': return '💰';
      case 'premium_feature': return '⭐';
      case 'merch': return '👕';
      case 'marketing_credit': return '📣';
      case 'priority_support': return '🎯';
      default: return '🎁';
    }
  };

  const getRewardTypeName = (type: string): string => {
    switch (type) {
      case 'visibility_boost': return 'Visibility';
      case 'bonus_payout': return 'Bonus';
      case 'premium_feature': return 'Premium';
      case 'merch': return 'Merchandise';
      case 'marketing_credit': return 'Marketing';
      case 'priority_support': return 'Support';
      default: return 'Reward';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCatalog(),
        fetchMyRedemptions(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchCatalog, fetchMyRedemptions]);

  return {
    catalog,
    myRedemptions,
    loading,
    redeemReward,
    getRewardTypeIcon,
    getRewardTypeName,
    refetch: () => {
      fetchCatalog();
      fetchMyRedemptions();
    },
  };
}
