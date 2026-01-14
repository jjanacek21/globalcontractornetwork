import { useGamification } from "@/hooks/useGamification";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  PointsDisplay,
  LevelProgressBar,
  BadgeShowcase,
  LeaderboardCard,
  ActiveChallenges,
  StreakIndicator,
  RewardsCatalog,
} from "@/components/gamification";

export default function GamificationDashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUserId(user.id);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const { stats, badges, allBadges, loading: gamLoading } = useGamification(userId || undefined);

  if (loading || gamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rewards & Achievements</h1>
        <p className="text-muted-foreground mt-1">Track your progress and earn rewards</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <PointsDisplay stats={stats} showLevel showStreak />
        </Card>
        <Card className="p-4">
          <StreakIndicator stats={stats} type="both" />
        </Card>
        <Card className="p-4">
          <LevelProgressBar stats={stats} showPerks={false} />
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Badges Earned</div>
          <div className="text-3xl font-bold mt-1">{badges.length}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {allBadges.filter(b => !b.is_hidden).length - badges.length} more available
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Recent Badges</h3>
                <BadgeShowcase 
                  userBadges={badges.slice(0, 6)} 
                  allBadges={allBadges}
                  maxDisplay={6}
                />
              </CardContent>
            </Card>
            <ActiveChallenges userId={userId || undefined} showJoined={false} />
          </div>
          <LeaderboardCard 
            defaultType="personal"
            defaultPeriod="monthly"
            maxEntries={5}
          />
        </TabsContent>

        <TabsContent value="badges">
          <Card>
            <CardContent className="pt-6">
              <BadgeShowcase 
                userBadges={badges} 
                allBadges={allBadges}
                showUnearnedAsLocked
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <div className="grid gap-6 lg:grid-cols-2">
            <ActiveChallenges userId={userId || undefined} showJoined />
            <ActiveChallenges userId={userId || undefined} showJoined={false} />
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <LeaderboardCard 
            defaultType="personal"
            defaultPeriod="monthly"
            showTypeSelector
            showPeriodSelector
            maxEntries={20}
          />
        </TabsContent>

        <TabsContent value="rewards">
          <RewardsCatalog userId={userId || undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
