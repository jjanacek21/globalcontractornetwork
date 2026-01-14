import { Flame, Coins, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LEVEL_THRESHOLDS, UserGamification } from '@/hooks/useGamification';

interface PointsDisplayProps {
  stats: UserGamification | null;
  compact?: boolean;
  showLevel?: boolean;
  showStreak?: boolean;
  className?: string;
}

const LEVEL_COLORS = {
  new_contractor: 'bg-muted text-muted-foreground',
  rising_star: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  network_pro: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  master_referrer: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  legend: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30',
};

const LEVEL_ICONS: Record<string, string> = {
  new_contractor: '🌱',
  rising_star: '⭐',
  network_pro: '💼',
  master_referrer: '👑',
  legend: '🏆',
};

export function PointsDisplay({ 
  stats, 
  compact = false, 
  showLevel = true,
  showStreak = true,
  className 
}: PointsDisplayProps) {
  if (!stats) return null;

  const levelInfo = LEVEL_THRESHOLDS[stats.current_level];
  const levelIcon = LEVEL_ICONS[stats.current_level];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1 text-sm">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold">{stats.available_points.toLocaleString()}</span>
        </div>
        {showStreak && stats.current_streak > 0 && (
          <div className="flex items-center gap-1 text-sm text-orange-500">
            <Flame className="h-4 w-4" />
            <span>{stats.current_streak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Points Balance */}
      <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
        <Coins className="h-5 w-5 text-yellow-500" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Points</span>
          <span className="font-bold text-foreground">{stats.available_points.toLocaleString()}</span>
        </div>
      </div>

      {/* Level Badge */}
      {showLevel && (
        <Badge 
          variant="outline" 
          className={cn("px-3 py-1.5 font-medium", LEVEL_COLORS[stats.current_level])}
        >
          <span className="mr-1">{levelIcon}</span>
          {levelInfo.name}
        </Badge>
      )}

      {/* Streak */}
      {showStreak && stats.current_streak > 0 && (
        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5">
          <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Streak</span>
            <span className="font-bold text-orange-600">{stats.current_streak}</span>
          </div>
        </div>
      )}

      {/* Daily Streak */}
      {showStreak && stats.daily_streak > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span>{stats.daily_streak}d active</span>
        </div>
      )}
    </div>
  );
}
