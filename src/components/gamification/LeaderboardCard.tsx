import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  useLeaderboard, 
  LeaderboardEntry, 
  TeamLeaderboardEntry, 
  CompanyLeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardType 
} from '@/hooks/useLeaderboard';
import { Trophy, Medal, Award, TrendingUp, Users, Building2 } from 'lucide-react';

interface LeaderboardCardProps {
  defaultType?: LeaderboardType;
  defaultPeriod?: LeaderboardPeriod;
  showTypeSelector?: boolean;
  showPeriodSelector?: boolean;
  maxEntries?: number;
  compact?: boolean;
  className?: string;
}

const RANK_ICONS = [
  <Trophy className="h-5 w-5 text-yellow-500" />,
  <Medal className="h-5 w-5 text-gray-400" />,
  <Award className="h-5 w-5 text-amber-600" />,
];

const TIER_COLORS = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-100 text-gray-800',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-purple-100 text-purple-800',
};

export function LeaderboardCard({
  defaultType = 'personal',
  defaultPeriod = 'monthly',
  showTypeSelector = true,
  showPeriodSelector = true,
  maxEntries = 10,
  compact = false,
  className,
}: LeaderboardCardProps) {
  const [type, setType] = useState<LeaderboardType>(defaultType);
  const [period, setPeriod] = useState<LeaderboardPeriod>(defaultPeriod);
  
  const { entries, teamEntries, companyEntries, userRank, loading } = useLeaderboard(type, period);

  const renderPersonalEntry = (entry: LeaderboardEntry, index: number) => (
    <div 
      key={entry.user_id}
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
        index < 3 && "bg-muted/50",
        entry.rank === userRank && "bg-primary/10 border border-primary/20"
      )}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">
        {index < 3 ? RANK_ICONS[index] : (
          <span className="text-sm text-muted-foreground font-medium">#{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-8 w-8">
        <AvatarImage src={entry.avatar_url} />
        <AvatarFallback className="text-xs">
          {entry.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name & Company */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.name}</p>
        {entry.company_name && !compact && (
          <p className="text-xs text-muted-foreground truncate">{entry.company_name}</p>
        )}
      </div>

      {/* Stats */}
      <div className="text-right">
        <p className="text-sm font-semibold">
          {period === 'monthly' ? entry.monthly_points : entry.total_points}
        </p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>
    </div>
  );

  const renderTeamEntry = (entry: TeamLeaderboardEntry, index: number) => (
    <div 
      key={entry.team_id}
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
        index < 3 && "bg-muted/50"
      )}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">
        {index < 3 ? RANK_ICONS[index] : (
          <span className="text-sm text-muted-foreground font-medium">#{entry.rank}</span>
        )}
      </div>

      {/* Team Icon */}
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Users className="h-4 w-4 text-primary" />
      </div>

      {/* Name & Company */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.team_name}</p>
        {!compact && (
          <p className="text-xs text-muted-foreground truncate">{entry.company_name}</p>
        )}
      </div>

      {/* Stats */}
      <div className="text-right">
        <p className="text-sm font-semibold">
          {period === 'monthly' ? entry.monthly_referrals : entry.total_referrals}
        </p>
        <p className="text-xs text-muted-foreground">referrals</p>
      </div>
    </div>
  );

  const renderCompanyEntry = (entry: CompanyLeaderboardEntry, index: number) => (
    <div 
      key={entry.company_id}
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
        index < 3 && "bg-muted/50"
      )}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">
        {index < 3 ? RANK_ICONS[index] : (
          <span className="text-sm text-muted-foreground font-medium">#{entry.rank}</span>
        )}
      </div>

      {/* Company Logo */}
      <Avatar className="h-8 w-8">
        <AvatarImage src={entry.logo_url} />
        <AvatarFallback className="text-xs">
          <Building2 className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      {/* Name & Tier */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.company_name}</p>
        {!compact && (
          <Badge 
            variant="outline" 
            className={cn("text-[10px] capitalize", TIER_COLORS[entry.tier as keyof typeof TIER_COLORS])}
          >
            {entry.tier}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="text-right">
        <p className="text-sm font-semibold">
          {period === 'monthly' ? entry.monthly_referrals : entry.total_referrals}
        </p>
        <p className="text-xs text-muted-foreground">referrals</p>
      </div>
    </div>
  );

  const getEntries = () => {
    switch (type) {
      case 'personal': return entries.slice(0, maxEntries);
      case 'team': return teamEntries.slice(0, maxEntries);
      case 'company': return companyEntries.slice(0, maxEntries);
      default: return [];
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Leaderboard
          </CardTitle>
          
          {userRank && type === 'personal' && (
            <Badge variant="outline" className="bg-primary/10">
              Your Rank: #{userRank}
            </Badge>
          )}
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap gap-2 pt-2">
          {showTypeSelector && (
            <Tabs value={type} onValueChange={(v) => setType(v as LeaderboardType)}>
              <TabsList className="h-8">
                <TabsTrigger value="personal" className="text-xs px-2">Personal</TabsTrigger>
                <TabsTrigger value="team" className="text-xs px-2">Teams</TabsTrigger>
                <TabsTrigger value="company" className="text-xs px-2">Companies</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {showPeriodSelector && (
            <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
              <TabsList className="h-8">
                <TabsTrigger value="monthly" className="text-xs px-2">Monthly</TabsTrigger>
                <TabsTrigger value="all_time" className="text-xs px-2">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))
        ) : getEntries().length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No data yet</p>
            <p className="text-xs mt-1">Be the first to make it on the leaderboard!</p>
          </div>
        ) : (
          <>
            {type === 'personal' && entries.slice(0, maxEntries).map((entry, i) => renderPersonalEntry(entry, i))}
            {type === 'team' && teamEntries.slice(0, maxEntries).map((entry, i) => renderTeamEntry(entry, i))}
            {type === 'company' && companyEntries.slice(0, maxEntries).map((entry, i) => renderCompanyEntry(entry, i))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
