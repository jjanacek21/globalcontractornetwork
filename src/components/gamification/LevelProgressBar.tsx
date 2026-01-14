import { cn } from '@/lib/utils';
import { LEVEL_THRESHOLDS, UserGamification } from '@/hooks/useGamification';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Sparkles } from 'lucide-react';

interface LevelProgressBarProps {
  stats: UserGamification | null;
  showPerks?: boolean;
  className?: string;
}

const LEVEL_COLORS = {
  new_contractor: 'from-gray-400 to-gray-500',
  rising_star: 'from-yellow-400 to-yellow-500',
  network_pro: 'from-blue-400 to-blue-500',
  master_referrer: 'from-purple-400 to-purple-500',
  legend: 'from-amber-400 to-orange-500',
};

const LEVEL_BG = {
  new_contractor: 'bg-gray-100',
  rising_star: 'bg-yellow-50',
  network_pro: 'bg-blue-50',
  master_referrer: 'bg-purple-50',
  legend: 'bg-gradient-to-r from-amber-50 to-orange-50',
};

export function LevelProgressBar({ stats, showPerks = true, className }: LevelProgressBarProps) {
  if (!stats) return null;

  const currentLevelInfo = LEVEL_THRESHOLDS[stats.current_level];
  const levels = Object.entries(LEVEL_THRESHOLDS);
  const currentIndex = levels.findIndex(([key]) => key === stats.current_level);
  const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

  // Calculate progress
  let progressPercent = 100;
  let pointsToNext = 0;

  if (nextLevel) {
    const [, nextThreshold] = nextLevel;
    const pointsInLevel = stats.total_points - currentLevelInfo.min;
    const pointsNeeded = nextThreshold.min - currentLevelInfo.min;
    progressPercent = Math.min((pointsInLevel / pointsNeeded) * 100, 100);
    pointsToNext = nextThreshold.min - stats.total_points;
  }

  const isMaxLevel = stats.current_level === 'legend';

  return (
    <div className={cn("space-y-3", className)}>
      {/* Level indicator */}
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full", LEVEL_BG[stats.current_level])}>
          <span className="text-lg">{getLevelEmoji(stats.current_level)}</span>
          <span className="font-semibold text-sm">{currentLevelInfo.name}</span>
        </div>
        
        {!isMaxLevel && nextLevel && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>{pointsToNext.toLocaleString()} pts to</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium">{nextLevel[1].name}</span>
          </div>
        )}
        
        {isMaxLevel && (
          <div className="flex items-center gap-1 text-sm text-amber-600">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">Max Level Achieved!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative">
        <Progress 
          value={progressPercent} 
          className={cn(
            "h-3 bg-muted/50",
            isMaxLevel && "bg-gradient-to-r from-amber-100 to-orange-100"
          )} 
        />
        <div 
          className={cn(
            "absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r transition-all duration-500",
            LEVEL_COLORS[stats.current_level]
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Total points */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Total: {stats.total_points.toLocaleString()} pts</span>
        <span>{Math.round(progressPercent)}% to next level</span>
      </div>

      {/* Current perks */}
      {showPerks && currentLevelInfo.perks.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-muted-foreground">Your perks:</span>
          {currentLevelInfo.perks.map((perk, i) => (
            <span 
              key={i}
              className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
            >
              {perk}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function getLevelEmoji(level: string): string {
  switch (level) {
    case 'new_contractor': return '🌱';
    case 'rising_star': return '⭐';
    case 'network_pro': return '💼';
    case 'master_referrer': return '👑';
    case 'legend': return '🏆';
    default: return '🎯';
  }
}
