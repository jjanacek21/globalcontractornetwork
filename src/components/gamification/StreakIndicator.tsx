import { Flame, Zap, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserGamification } from '@/hooks/useGamification';

interface StreakIndicatorProps {
  stats: UserGamification | null;
  type?: 'referral' | 'daily' | 'both';
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: { container: 'gap-1 text-xs', icon: 'h-4 w-4' },
  md: { container: 'gap-2 text-sm', icon: 'h-5 w-5' },
  lg: { container: 'gap-2 text-base', icon: 'h-6 w-6' },
};

export function StreakIndicator({ 
  stats, 
  type = 'both',
  showAnimation = true,
  size = 'md',
  className 
}: StreakIndicatorProps) {
  if (!stats) return null;

  const sizeClass = SIZE_CLASSES[size];

  const getReferralStreakColor = (streak: number) => {
    if (streak >= 25) return 'text-red-500';
    if (streak >= 10) return 'text-orange-500';
    if (streak >= 5) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getDailyStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-500';
    if (streak >= 14) return 'text-blue-500';
    if (streak >= 7) return 'text-green-500';
    return 'text-muted-foreground';
  };

  const getStreakLabel = (streak: number, type: 'referral' | 'daily') => {
    if (type === 'referral') {
      if (streak >= 25) return '🔥 Legendary!';
      if (streak >= 10) return '🔥 On Fire!';
      if (streak >= 5) return '🔥 Hot Streak!';
      return streak > 0 ? '✨ Building...' : '';
    } else {
      if (streak >= 30) return '💪 Champion!';
      if (streak >= 14) return '📆 Dedicated!';
      if (streak >= 7) return '📅 Consistent!';
      return streak > 0 ? '🌱 Growing...' : '';
    }
  };

  return (
    <div className={cn("flex items-center flex-wrap", sizeClass.container, className)}>
      {/* Referral Streak */}
      {(type === 'referral' || type === 'both') && stats.current_streak > 0 && (
        <div 
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full",
            "bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200"
          )}
        >
          <Flame 
            className={cn(
              sizeClass.icon,
              getReferralStreakColor(stats.current_streak),
              showAnimation && stats.current_streak >= 5 && "animate-pulse"
            )} 
          />
          <span className={cn("font-bold", getReferralStreakColor(stats.current_streak))}>
            {stats.current_streak}
          </span>
          <span className="text-muted-foreground text-xs ml-1 hidden sm:inline">
            {getStreakLabel(stats.current_streak, 'referral')}
          </span>
        </div>
      )}

      {/* Daily Streak */}
      {(type === 'daily' || type === 'both') && stats.daily_streak > 0 && (
        <div 
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full",
            "bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200"
          )}
        >
          <Calendar 
            className={cn(
              sizeClass.icon,
              getDailyStreakColor(stats.daily_streak)
            )} 
          />
          <span className={cn("font-bold", getDailyStreakColor(stats.daily_streak))}>
            {stats.daily_streak}d
          </span>
          <span className="text-muted-foreground text-xs ml-1 hidden sm:inline">
            {getStreakLabel(stats.daily_streak, 'daily')}
          </span>
        </div>
      )}

      {/* Best streak indicator */}
      {type === 'both' && stats.longest_streak > stats.current_streak && stats.longest_streak > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span>Best: {stats.longest_streak}</span>
        </div>
      )}

      {/* No streaks message */}
      {stats.current_streak === 0 && stats.daily_streak === 0 && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Flame className={cn(sizeClass.icon, "opacity-30")} />
          <span className="text-xs">Start a streak!</span>
        </div>
      )}
    </div>
  );
}
