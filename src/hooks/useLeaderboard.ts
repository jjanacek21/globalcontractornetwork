import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url?: string;
  company_name?: string;
  total_points: number;
  monthly_points: number;
  current_level: string;
  successful_referrals: number;
  monthly_referrals: number;
}

export interface TeamLeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  company_name: string;
  total_points: number;
  monthly_referrals: number;
  total_referrals: number;
}

export interface CompanyLeaderboardEntry {
  rank: number;
  company_id: string;
  company_name: string;
  logo_url?: string;
  tier: string;
  total_points: number;
  total_referrals: number;
  monthly_referrals: number;
}

export type LeaderboardPeriod = 'monthly' | 'quarterly' | 'all_time';
export type LeaderboardType = 'personal' | 'team' | 'company';

export function useLeaderboard(type: LeaderboardType = 'personal', period: LeaderboardPeriod = 'monthly') {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [teamEntries, setTeamEntries] = useState<TeamLeaderboardEntry[]>([]);
  const [companyEntries, setCompanyEntries] = useState<CompanyLeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPersonalLeaderboard = useCallback(async () => {
    try {
      let query = supabase
        .from('user_gamification')
        .select(`
          user_id,
          total_points,
          monthly_points,
          current_level,
          successful_referrals,
          monthly_referrals
        `)
        .order(period === 'monthly' ? 'monthly_points' : 'total_points', { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      // Fetch user profiles for names (profiles table doesn't have avatar_url)
      const userIds = data?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const { data: contractorProfiles } = await supabase
        .from('contractor_profiles')
        .select('user_id, company_name, logo_url')
        .in('user_id', userIds);

      const profileMap = new Map<string, any>((profiles as any[])?.map((p: any) => [p.id, p]) || []);
      const contractorMap = new Map<string, any>((contractorProfiles as any[])?.map((c: any) => [c.user_id, c]) || []);

      const leaderboard: LeaderboardEntry[] = (data || []).map((entry, index) => {
        const profile = profileMap.get(entry.user_id);
        const contractor = contractorMap.get(entry.user_id);
        return {
          rank: index + 1,
          user_id: entry.user_id,
          name: profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous'
            : 'Anonymous',
          avatar_url: contractor?.logo_url || undefined,
          company_name: contractor?.company_name,
          total_points: entry.total_points || 0,
          monthly_points: entry.monthly_points || 0,
          current_level: entry.current_level || 'new_contractor',
          successful_referrals: entry.successful_referrals || 0,
          monthly_referrals: entry.monthly_referrals || 0,
        };
      });

      setEntries(leaderboard);

      // Get current user's rank
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userEntry = leaderboard.find(e => e.user_id === user.id);
        setUserRank(userEntry?.rank || null);
      }
    } catch (err) {
      console.error('Error in fetchPersonalLeaderboard:', err);
    }
  }, [period]);

  const fetchTeamLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('team_gamification')
        .select(`
          team_id,
          total_points,
          monthly_referrals,
          total_referrals,
          rank_in_company
        `)
        .order(period === 'monthly' ? 'monthly_referrals' : 'total_referrals', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching team leaderboard:', error);
        return;
      }

      // Fetch team and company names
      const teamIds = data?.map(d => d.team_id) || [];
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, company_id')
        .in('id', teamIds);

      const companyIds = teams?.map(t => t.company_id).filter(Boolean) || [];
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      const teamMap = new Map<string, any>((teams as any[])?.map((t: any) => [t.id, t]) || []);
      const companyMap = new Map<string, any>((companies as any[])?.map((c: any) => [c.id, c]) || []);

      const leaderboard: TeamLeaderboardEntry[] = (data || []).map((entry, index) => {
        const team = teamMap.get(entry.team_id);
        const company = team?.company_id ? companyMap.get(team.company_id) : null;
        return {
          rank: index + 1,
          team_id: entry.team_id,
          team_name: team?.name || 'Unknown Team',
          company_name: company?.name || 'Unknown Company',
          total_points: entry.total_points || 0,
          monthly_referrals: entry.monthly_referrals || 0,
          total_referrals: entry.total_referrals || 0,
        };
      });

      setTeamEntries(leaderboard);
    } catch (err) {
      console.error('Error in fetchTeamLeaderboard:', err);
    }
  }, [period]);

  const fetchCompanyLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('company_gamification')
        .select(`
          company_id,
          total_points,
          tier,
          total_referrals,
          monthly_referrals
        `)
        .order(period === 'monthly' ? 'monthly_referrals' : 'total_referrals', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching company leaderboard:', error);
        return;
      }

      // Fetch company details
      const companyIds = data?.map(d => d.company_id) || [];
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .in('id', companyIds);

      const companyMap = new Map<string, any>((companies as any[])?.map((c: any) => [c.id, c]) || []);

      const leaderboard: CompanyLeaderboardEntry[] = (data || []).map((entry, index) => {
        const company = companyMap.get(entry.company_id);
        return {
          rank: index + 1,
          company_id: entry.company_id,
          company_name: company?.name || 'Unknown Company',
          logo_url: company?.logo_url || undefined,
          tier: entry.tier || 'bronze',
          total_points: entry.total_points || 0,
          total_referrals: entry.total_referrals || 0,
          monthly_referrals: entry.monthly_referrals || 0,
        };
      });

      setCompanyEntries(leaderboard);
    } catch (err) {
      console.error('Error in fetchCompanyLeaderboard:', err);
    }
  }, [period]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      if (type === 'personal') {
        await fetchPersonalLeaderboard();
      } else if (type === 'team') {
        await fetchTeamLeaderboard();
      } else if (type === 'company') {
        await fetchCompanyLeaderboard();
      }
      
      setLoading(false);
    };

    loadData();
  }, [type, period, fetchPersonalLeaderboard, fetchTeamLeaderboard, fetchCompanyLeaderboard]);

  return {
    entries,
    teamEntries,
    companyEntries,
    userRank,
    loading,
    refetch: () => {
      if (type === 'personal') fetchPersonalLeaderboard();
      else if (type === 'team') fetchTeamLeaderboard();
      else if (type === 'company') fetchCompanyLeaderboard();
    },
  };
}
