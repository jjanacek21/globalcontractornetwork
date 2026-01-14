import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Star, Award, Users, Plus, Edit, Search, TrendingUp, Gift, Target } from "lucide-react";

interface UserGamification {
  id: string;
  user_id: string;
  total_points: number;
  current_level: string;
  current_streak: number;
  daily_streak: number;
  last_active_at: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface Challenge {
  id: string;
  name: string;
  description: string | null;
  challenge_type: string;
  target_metric: string;
  target_value: number;
  points_reward: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean | null;
}

interface Badge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  criteria_type: string;
  criteria_value: number | null;
  points_awarded: number | null;
  is_active: boolean | null;
}

export default function GamificationManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserGamification[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Points adjustment dialog
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserGamification | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalUsers: 0,
    activeChallenges: 0,
    totalBadges: 0
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, challengesRes, badgesRes] = await Promise.all([
        supabase
          .from("user_gamification")
          .select("*, profile:profiles(first_name, last_name, email)")
          .order("total_points", { ascending: false })
          .limit(100),
        supabase
          .from("challenges")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("badges")
          .select("*")
          .order("category", { ascending: true })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (challengesRes.error) throw challengesRes.error;
      if (badgesRes.error) throw badgesRes.error;

      const usersData = (usersRes.data || []).map(u => ({
        ...u,
        profile: Array.isArray(u.profile) ? u.profile[0] : u.profile
      }));

      setUsers(usersData);
      setChallenges(challengesRes.data || []);
      setBadges(badgesRes.data || []);

      // Calculate stats
      const totalPoints = usersData.reduce((sum, u) => sum + (u.total_points || 0), 0);
      const activeChallenges = (challengesRes.data || []).filter(c => c.is_active).length;

      setStats({
        totalPoints,
        totalUsers: usersData.length,
        activeChallenges,
        totalBadges: badgesRes.data?.length || 0
      });
    } catch (error) {
      console.error("Error fetching gamification data:", error);
      toast({ title: "Error", description: "Failed to load gamification data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedUser || pointsToAdd === 0) return;
    
    setAdjusting(true);
    try {
      const newTotal = selectedUser.total_points + pointsToAdd;
      
      const { error } = await supabase
        .from("user_gamification")
        .update({ 
          total_points: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({
        title: "Points adjusted", 
        description: `${pointsToAdd > 0 ? 'Added' : 'Removed'} ${Math.abs(pointsToAdd)} points` 
      });
      
      setAdjustDialogOpen(false);
      setPointsToAdd(0);
      setAdjustmentReason("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAdjusting(false);
    }
  };

  const toggleChallengeActive = async (challenge: Challenge) => {
    try {
      const { error } = await supabase
        .from("challenges")
        .update({ is_active: !challenge.is_active })
        .eq("id", challenge.id);

      if (error) throw error;
      
      toast({ title: "Success", description: `Challenge ${challenge.is_active ? 'deactivated' : 'activated'}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(u => {
    const name = `${u.profile?.first_name || ''} ${u.profile?.last_name || ''}`.toLowerCase();
    const email = u.profile?.email?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  const getLevelBadge = (level: string) => {
    const levelColors: Record<string, string> = {
      'new_contractor': 'bg-gray-100 text-gray-800',
      'rising_star': 'bg-blue-100 text-blue-800',
      'network_pro': 'bg-purple-100 text-purple-800',
      'master_referrer': 'bg-yellow-100 text-yellow-800',
      'legend': 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
    };
    return levelColors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-3xl font-bold">{stats.totalPoints.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Challenges</p>
                <p className="text-3xl font-bold">{stats.activeChallenges}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Badges</p>
                <p className="text-3xl font-bold">{stats.totalBadges}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="challenges" className="gap-2">
            <Target className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-2">
            <Award className="h-4 w-4" />
            Badges
          </TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Referral Streak</TableHead>
                  <TableHead className="text-right">Daily Streak</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold">
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.profile?.first_name || 'Unknown'} {user.profile?.last_name || ''}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.profile?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getLevelBadge(user.current_level)}>
                        {user.current_level?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">{user.total_points.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{user.current_streak}</TableCell>
                    <TableCell className="text-right">{user.daily_streak}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setAdjustDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{challenge.name}</div>
                        <div className="text-sm text-muted-foreground">{challenge.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{challenge.challenge_type}</Badge>
                    </TableCell>
                    <TableCell>{challenge.target_value} {challenge.target_metric}</TableCell>
                    <TableCell>{challenge.points_reward} pts</TableCell>
                    <TableCell className="text-sm">
                      {new Date(challenge.starts_at).toLocaleDateString()} - {new Date(challenge.ends_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={challenge.is_active ? "default" : "secondary"}>
                        {challenge.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleChallengeActive(challenge)}
                      >
                        {challenge.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {challenges.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No challenges found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <Card key={badge.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{badge.name}</h4>
                        <Badge variant={badge.is_active ? "default" : "secondary"} className="text-xs">
                          {badge.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{badge.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {badge.points_awarded} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Points Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>User</Label>
              <p className="text-sm font-medium mt-1">
                {selectedUser?.profile?.first_name} {selectedUser?.profile?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{selectedUser?.profile?.email}</p>
            </div>
            <div>
              <Label>Current Points</Label>
              <p className="text-2xl font-bold">{selectedUser?.total_points.toLocaleString()}</p>
            </div>
            <div>
              <Label htmlFor="points">Points to Add/Remove</Label>
              <Input
                id="points"
                type="number"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                placeholder="Enter positive or negative number"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use negative numbers to deduct points
              </p>
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Reason for adjustment..."
              />
            </div>
            {pointsToAdd !== 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  New total: <span className="font-bold">{((selectedUser?.total_points || 0) + pointsToAdd).toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustPoints} disabled={adjusting || pointsToAdd === 0}>
              {adjusting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
