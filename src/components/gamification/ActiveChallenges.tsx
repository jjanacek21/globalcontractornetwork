import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChallengeCard } from './ChallengeCard';
import { useChallenges, ChallengeWithProgress } from '@/hooks/useChallenges';
import { Target, Users, Building2, Trophy } from 'lucide-react';

interface ActiveChallengesProps {
  userId?: string;
  showJoined?: boolean;
  className?: string;
}

export function ActiveChallenges({ userId, showJoined = true, className }: ActiveChallengesProps) {
  const { challenges, myChallenges, loading, joinChallenge, claimReward } = useChallenges(userId);
  const [activeTab, setActiveTab] = useState<string>('all');

  const filterChallenges = (list: ChallengeWithProgress[], type?: string) => {
    if (!type || type === 'all') return list;
    return list.filter(c => c.challenge_type === type);
  };

  const displayChallenges = showJoined 
    ? filterChallenges(myChallenges, activeTab === 'all' ? undefined : activeTab)
    : filterChallenges(challenges, activeTab === 'all' ? undefined : activeTab);

  const handleJoin = async (challengeId: string) => {
    await joinChallenge(challengeId);
  };

  const handleClaim = async (challengeId: string) => {
    await claimReward(challengeId);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {showJoined ? 'My Challenges' : 'Active Challenges'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="individual" className="text-xs gap-1">
              <Target className="h-3 w-3" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              Team
            </TabsTrigger>
            <TabsTrigger value="company" className="text-xs gap-1">
              <Building2 className="h-3 w-3" />
              Company
            </TabsTrigger>
          </TabsList>

          <div className="space-y-3">
            {displayChallenges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">
                  {showJoined 
                    ? "You haven't joined any challenges yet"
                    : "No active challenges right now"
                  }
                </p>
                {showJoined && challenges.length > 0 && (
                  <p className="text-xs mt-1">
                    Check out available challenges to get started!
                  </p>
                )}
              </div>
            ) : (
              displayChallenges.map(challenge => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={handleJoin}
                  onClaim={handleClaim}
                />
              ))
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
