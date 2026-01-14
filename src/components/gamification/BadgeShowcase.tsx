import { useState } from 'react';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge, UserBadge } from '@/hooks/useGamification';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface BadgeShowcaseProps {
  userBadges: UserBadge[];
  allBadges?: Badge[];
  showUnearnedAsLocked?: boolean;
  maxDisplay?: number;
  onToggleDisplay?: (badgeId: string, displayed: boolean) => void;
  className?: string;
}

const TIER_COLORS = {
  bronze: 'from-amber-600 to-amber-700 border-amber-500',
  silver: 'from-gray-300 to-gray-400 border-gray-400',
  gold: 'from-yellow-400 to-yellow-500 border-yellow-400',
  platinum: 'from-violet-400 to-purple-500 border-purple-400',
};

const TIER_BG = {
  bronze: 'bg-amber-50 border-amber-200',
  silver: 'bg-gray-50 border-gray-200',
  gold: 'bg-yellow-50 border-yellow-200',
  platinum: 'bg-purple-50 border-purple-200',
};

const CATEGORY_LABELS: Record<string, string> = {
  referral: 'Referral',
  quality: 'Quality',
  team: 'Team',
  hidden: 'Secret',
  special: 'Special',
  streak: 'Streak',
  training: 'Training',
};

export function BadgeShowcase({
  userBadges,
  allBadges = [],
  showUnearnedAsLocked = false,
  maxDisplay,
  onToggleDisplay,
  className,
}: BadgeShowcaseProps) {
  const [showAll, setShowAll] = useState(false);

  // Get earned badge IDs
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  
  // Combine earned and unearned badges
  const displayBadges = showUnearnedAsLocked
    ? allBadges.filter(b => !b.is_hidden || earnedBadgeIds.has(b.id))
    : userBadges.map(ub => ({ ...ub.badge!, userBadge: ub }));

  // Limit display if needed
  const visibleBadges = maxDisplay && !showAll 
    ? displayBadges.slice(0, maxDisplay) 
    : displayBadges;

  const hasMore = maxDisplay && displayBadges.length > maxDisplay;

  if (displayBadges.length === 0) {
    return (
      <div className={cn("text-center py-6 text-muted-foreground", className)}>
        <p className="text-sm">No badges earned yet</p>
        <p className="text-xs mt-1">Complete referrals and challenges to earn badges!</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        <TooltipProvider>
          {visibleBadges.map((badge) => {
            const isEarned = showUnearnedAsLocked 
              ? earnedBadgeIds.has(badge.id)
              : true;
            const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
            const tier = badge.tier as keyof typeof TIER_COLORS;

            return (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer group",
                      isEarned ? TIER_BG[tier] : "bg-muted/30 border-muted opacity-50",
                      isEarned && "hover:scale-105 hover:shadow-md"
                    )}
                  >
                    {/* Badge Icon */}
                    <div className={cn(
                      "text-3xl mb-1",
                      !isEarned && "grayscale"
                    )}>
                      {isEarned ? badge.icon : <Lock className="h-8 w-8 text-muted-foreground" />}
                    </div>

                    {/* Badge Name */}
                    <span className={cn(
                      "text-xs font-medium text-center line-clamp-2",
                      isEarned ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {badge.name}
                    </span>

                    {/* Tier indicator */}
                    {isEarned && (
                      <div className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br border",
                        TIER_COLORS[tier]
                      )} />
                    )}

                    {/* New badge indicator - check if earned recently (within 7 days) */}
                    {userBadge && new Date(userBadge.earned_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                      <BadgeUI className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] px-1">
                        NEW
                      </BadgeUI>
                    )}

                    {/* Display toggle */}
                    {isEarned && onToggleDisplay && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDisplay(badge.id, !userBadge?.displayed);
                        }}
                        className="absolute bottom-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {userBadge?.displayed ? (
                          <Eye className="h-3 w-3 text-green-600" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{badge.icon}</span>
                      <span className="font-semibold">{badge.name}</span>
                      <BadgeUI variant="outline" className="text-[10px] capitalize">
                        {tier}
                      </BadgeUI>
                    </div>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{CATEGORY_LABELS[badge.category] || badge.category}</span>
                      {badge.points_awarded > 0 && (
                        <span className="text-yellow-600">+{badge.points_awarded} pts</span>
                      )}
                    </div>
                    {userBadge && (
                      <p className="text-xs text-muted-foreground">
                        Earned {new Date(userBadge.earned_at).toLocaleDateString()}
                      </p>
                    )}
                    {!isEarned && (
                      <p className="text-xs text-muted-foreground italic">
                        Complete the challenge to unlock this badge
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Show more button */}
      {hasMore && !showAll && (
        <div className="text-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAll(true)}
          >
            Show {displayBadges.length - maxDisplay} more badges
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>{userBadges.length} badges earned</span>
        {showUnearnedAsLocked && (
          <span>{allBadges.filter(b => !b.is_hidden).length - userBadges.length} remaining</span>
        )}
      </div>
    </div>
  );
}
