import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRewards, Reward } from '@/hooks/useRewards';
import { useGamification } from '@/hooks/useGamification';
import { Gift, Coins, Check, Clock, AlertCircle } from 'lucide-react';

interface RewardsCatalogProps {
  userId?: string;
  compact?: boolean;
  className?: string;
}

export function RewardsCatalog({ userId, compact = false, className }: RewardsCatalogProps) {
  const { catalog, myRedemptions, loading, redeemReward, getRewardTypeIcon, getRewardTypeName } = useRewards(userId);
  const { stats } = useGamification(userId);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const handleRedeem = async (rewardId: string) => {
    if (!stats) return;
    
    setRedeeming(rewardId);
    await redeemReward(rewardId, stats.available_points);
    setRedeeming(null);
  };

  const canAfford = (cost: number) => (stats?.available_points || 0) >= cost;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Available Points */}
      {stats && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-yellow-600" />
            <span className="text-sm text-muted-foreground">Available Points</span>
          </div>
          <span className="text-2xl font-bold text-yellow-700">
            {stats.available_points.toLocaleString()}
          </span>
        </div>
      )}

      {/* Rewards Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Redeem Rewards
        </h3>
        
        <div className={cn(
          "grid gap-4",
          compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {catalog.map(reward => {
            const affordable = canAfford(reward.points_cost);
            const icon = getRewardTypeIcon(reward.reward_type);
            const typeName = getRewardTypeName(reward.reward_type);

            return (
              <Card 
                key={reward.id}
                className={cn(
                  "transition-all",
                  affordable ? "hover:shadow-md hover:border-primary/30" : "opacity-60"
                )}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <Badge variant="outline" className="text-[10px] mb-1">
                            {typeName}
                          </Badge>
                          <h4 className="font-semibold text-sm">{reward.name}</h4>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {reward.description}
                    </p>

                    {/* Cost & Action */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className={cn(
                          "font-bold",
                          affordable ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {reward.points_cost.toLocaleString()}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        disabled={!affordable || redeeming === reward.id}
                        onClick={() => handleRedeem(reward.id)}
                        className={cn(
                          "text-xs",
                          !affordable && "opacity-50"
                        )}
                      >
                        {redeeming === reward.id ? (
                          <span className="animate-pulse">Redeeming...</span>
                        ) : affordable ? (
                          'Redeem'
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Need {(reward.points_cost - (stats?.available_points || 0)).toLocaleString()} more
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* My Redemptions */}
      {myRedemptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            My Redeemed Rewards
          </h3>

          <div className="space-y-2">
            {myRedemptions.slice(0, 5).map(redemption => (
              <div 
                key={redemption.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {getRewardTypeIcon(redemption.reward?.reward_type || '')}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{redemption.reward?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Redeemed {new Date(redemption.redeemed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Badge 
                  variant={redemption.status === 'active' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {redemption.status === 'active' && redemption.expires_at && (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {redemption.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
