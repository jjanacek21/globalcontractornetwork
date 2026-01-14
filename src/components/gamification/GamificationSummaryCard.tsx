import { useGamification, LEVEL_THRESHOLDS } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Trophy, Star, Flame, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface GamificationSummaryCardProps {
  userId: string | null;
}

const LEVEL_COLORS: Record<string, string> = {
  new_contractor: "bg-slate-500",
  rising_star: "bg-blue-500",
  network_pro: "bg-purple-500",
  master_referrer: "bg-amber-500",
  legend: "bg-gradient-to-r from-amber-500 to-orange-500",
};

export function GamificationSummaryCard({ userId }: GamificationSummaryCardProps) {
  const { stats, badges, loading } = useGamification(userId || undefined);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const level = stats.current_level || "new_contractor";
  const levelConfig = LEVEL_THRESHOLDS[level];
  const nextLevelKey = Object.keys(LEVEL_THRESHOLDS).find(
    (key) => LEVEL_THRESHOLDS[key as keyof typeof LEVEL_THRESHOLDS].min > (stats.total_points || 0)
  );
  const nextLevel = nextLevelKey ? LEVEL_THRESHOLDS[nextLevelKey as keyof typeof LEVEL_THRESHOLDS] : null;
  
  const progressToNext = nextLevel
    ? Math.min(100, ((stats.total_points || 0) - levelConfig.min) / (nextLevel.min - levelConfig.min) * 100)
    : 100;

  const recentBadges = badges.slice(0, 3);

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Your Progress
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/crm/rewards" className="text-xs">
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level & Points */}
        <div className="flex items-center justify-between">
          <div>
            <Badge className={`${LEVEL_COLORS[level]} text-white`}>
              <Star className="h-3 w-3 mr-1" />
              {levelConfig.name}
            </Badge>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{stats.total_points?.toLocaleString() || 0}</span>
            <span className="text-xs text-muted-foreground ml-1">pts</span>
          </div>
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to {nextLevel.name}</span>
              <span>{nextLevel.min - (stats.total_points || 0)} pts to go</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}

        {/* Streak */}
        {(stats.current_streak || 0) > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{stats.current_streak} day streak!</span>
          </div>
        )}

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <div className="flex items-center gap-2">
            {recentBadges.map((userBadge) => (
              <div
                key={userBadge.id}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg"
                title={userBadge.badge?.name || "Badge"}
              >
                {userBadge.badge?.icon || "🏆"}
              </div>
            ))}
            {badges.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{badges.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
