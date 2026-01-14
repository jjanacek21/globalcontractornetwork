import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ChallengeWithProgress } from '@/hooks/useChallenges';
import { Clock, Target, Gift, Users, Building2, Trophy, CheckCircle2 } from 'lucide-react';

interface ChallengeCardProps {
  challenge: ChallengeWithProgress;
  onJoin?: (challengeId: string) => void;
  onClaim?: (challengeId: string) => void;
  compact?: boolean;
  className?: string;
}

const CHALLENGE_TYPE_ICONS = {
  individual: <Target className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
  company: <Building2 className="h-4 w-4" />,
};

const METRIC_LABELS: Record<string, string> = {
  referrals: 'Referrals',
  conversions: 'Conversions',
  photos: 'Photos',
  verifications: 'Verifications',
  logins: 'Daily Logins',
  points: 'Points',
};

export function ChallengeCard({
  challenge,
  onJoin,
  onClaim,
  compact = false,
  className,
}: ChallengeCardProps) {
  const isCompleted = challenge.participation?.completed;
  const canClaim = isCompleted && !challenge.participation?.reward_claimed;
  const isExpired = new Date(challenge.ends_at) < new Date();

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isCompleted && "bg-green-50/50 border-green-200",
      isExpired && !isCompleted && "opacity-60",
      className
    )}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs gap-1">
                  {CHALLENGE_TYPE_ICONS[challenge.challenge_type]}
                  <span className="capitalize">{challenge.challenge_type}</span>
                </Badge>
                
                {isCompleted && (
                  <Badge className="bg-green-500 text-white text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </Badge>
                )}
              </div>
              
              <h3 className={cn(
                "font-semibold",
                compact ? "text-sm" : "text-base"
              )}>
                {challenge.name}
              </h3>
              
              {!compact && challenge.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {challenge.description}
                </p>
              )}
            </div>

            {/* Time remaining */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              <span>{challenge.time_remaining}</span>
            </div>
          </div>

          {/* Progress */}
          {challenge.is_joined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {METRIC_LABELS[challenge.target_metric] || challenge.target_metric}
                </span>
                <span className="font-medium">
                  {challenge.participation?.progress || 0} / {challenge.target_value}
                </span>
              </div>
              <Progress 
                value={challenge.progress_percent} 
                className={cn(
                  "h-2",
                  isCompleted && "bg-green-100"
                )}
              />
            </div>
          )}

          {/* Rewards */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-yellow-600">
              <Gift className="h-4 w-4" />
              <span className="font-medium">+{challenge.points_reward} pts</span>
            </div>
            
            {challenge.bonus_payout_percent > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <Trophy className="h-4 w-4" />
                <span className="font-medium">+{challenge.bonus_payout_percent}% payout</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!challenge.is_joined && !isExpired && (
              <Button 
                size="sm" 
                onClick={() => onJoin?.(challenge.id)}
                className="w-full"
              >
                Join Challenge
              </Button>
            )}
            
            {canClaim && (
              <Button 
                size="sm" 
                onClick={() => onClaim?.(challenge.id)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Gift className="h-4 w-4 mr-1" />
                Claim Reward
              </Button>
            )}
            
            {challenge.is_joined && !isCompleted && !isExpired && (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full"
                disabled
              >
                In Progress
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
