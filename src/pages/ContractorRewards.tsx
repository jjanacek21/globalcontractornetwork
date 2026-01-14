import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useGamification } from "@/hooks/useGamification";
import { useContractorFeatures } from "@/hooks/useContractorFeatures";
import { Loader2, ArrowLeft, Lock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PointsDisplay,
  LevelProgressBar,
  BadgeShowcase,
  LeaderboardCard,
  ActiveChallenges,
  StreakIndicator,
  RewardsCatalog,
} from "@/components/gamification";

export default function ContractorRewards() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasFeature, loading: featuresLoading } = useContractorFeatures();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/contractor");
        return;
      }
      setUserId(user.id);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const { stats, badges, allBadges, loading: gamLoading } = useGamification(userId || undefined);

  const hasAccess = hasFeature("rewards_dashboard");

  if (loading || featuresLoading || gamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Access denied screen
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container flex items-center h-16 px-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/contractor/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold ml-4">Rewards Dashboard</h1>
          </div>
        </header>
        <main className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <Card className="p-8">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Lock className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Access Restricted</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The Rewards Dashboard is a premium feature. Please contact your company admin or 
                the GCN support team to request access.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button onClick={() => navigate("/contractor/dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/contractor/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 ml-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Rewards & Achievements</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
        <div>
          <p className="text-muted-foreground">Track your progress and earn rewards</p>
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
      </main>
    </div>
  );
}
