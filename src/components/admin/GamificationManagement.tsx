import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Star, Award, Users, Plus, Edit, Search, Target, Trash2, Gift } from "lucide-react";

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

interface BadgeData {
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

interface Reward {
  id: string;
  name: string;
  description: string | null;
  reward_type: string;
  points_cost: number;
  quantity_available: number | null;
  is_available: boolean | null;
}

export default function GamificationManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserGamification[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Points adjustment dialog
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserGamification | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Challenge dialog
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [challengeForm, setChallengeForm] = useState({
    name: "", description: "", challenge_type: "individual", target_metric: "referrals",
    target_value: "5", points_reward: "100", starts_at: "", ends_at: ""
  });

  // Badge dialog
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [badgeForm, setBadgeForm] = useState({
    code: "", name: "", description: "", category: "achievement",
    criteria_type: "points", criteria_value: "100", points_awarded: "50"
  });

  // Reward dialog
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [rewardForm, setRewardForm] = useState({
    name: "", description: "", reward_type: "merchandise",
    points_cost: "500", quantity_available: "10"
  });

  // Delete dialogs
  const [deleteType, setDeleteType] = useState<"challenge" | "badge" | "reward" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalPoints: 0, totalUsers: 0, activeChallenges: 0, totalBadges: 0, totalRewards: 0
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, challengesRes, badgesRes, rewardsRes] = await Promise.all([
        supabase.from("user_gamification").select("*, profile:profiles(first_name, last_name, email)")
          .order("total_points", { ascending: false }).limit(100),
        supabase.from("challenges").select("*").order("created_at", { ascending: false }),
        supabase.from("badges").select("*").order("category", { ascending: true }),
        supabase.from("rewards_catalog").select("*").order("points_cost", { ascending: true })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (challengesRes.error) throw challengesRes.error;
      if (badgesRes.error) throw badgesRes.error;
      if (rewardsRes.error) throw rewardsRes.error;

      const usersData = (usersRes.data || []).map(u => ({
        ...u, profile: Array.isArray(u.profile) ? u.profile[0] : u.profile
      }));

      setUsers(usersData);
      setChallenges(challengesRes.data || []);
      setBadges(badgesRes.data || []);
      setRewards(rewardsRes.data || []);

      const totalPoints = usersData.reduce((sum, u) => sum + (u.total_points || 0), 0);
      const activeChallenges = (challengesRes.data || []).filter(c => c.is_active).length;

      setStats({
        totalPoints, totalUsers: usersData.length, activeChallenges,
        totalBadges: badgesRes.data?.length || 0, totalRewards: rewardsRes.data?.length || 0
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
      const { error } = await supabase.from("user_gamification")
        .update({ total_points: newTotal, updated_at: new Date().toISOString() })
        .eq("id", selectedUser.id);
      if (error) throw error;
      toast({ title: "Points adjusted", description: `${pointsToAdd > 0 ? 'Added' : 'Removed'} ${Math.abs(pointsToAdd)} points` });
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
      const { error } = await supabase.from("challenges").update({ is_active: !challenge.is_active }).eq("id", challenge.id);
      if (error) throw error;
      toast({ title: "Success", description: `Challenge ${challenge.is_active ? 'deactivated' : 'activated'}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Challenge CRUD
  const openChallengeDialog = (challenge?: Challenge) => {
    if (challenge) {
      setSelectedChallenge(challenge);
      setChallengeForm({
        name: challenge.name, description: challenge.description || "",
        challenge_type: challenge.challenge_type, target_metric: challenge.target_metric,
        target_value: challenge.target_value.toString(), points_reward: challenge.points_reward?.toString() || "100",
        starts_at: challenge.starts_at.split("T")[0], ends_at: challenge.ends_at.split("T")[0]
      });
    } else {
      setSelectedChallenge(null);
      const today = new Date().toISOString().split("T")[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      setChallengeForm({ name: "", description: "", challenge_type: "individual", target_metric: "referrals",
        target_value: "5", points_reward: "100", starts_at: today, ends_at: nextMonth });
    }
    setChallengeDialogOpen(true);
  };

  const saveChallenge = async () => {
    try {
      const data = {
        name: challengeForm.name, description: challengeForm.description || null,
        challenge_type: challengeForm.challenge_type, target_metric: challengeForm.target_metric,
        target_value: parseInt(challengeForm.target_value), points_reward: parseInt(challengeForm.points_reward),
        starts_at: new Date(challengeForm.starts_at).toISOString(), ends_at: new Date(challengeForm.ends_at).toISOString(),
        is_active: true
      };
      if (selectedChallenge) {
        const { error } = await supabase.from("challenges").update(data).eq("id", selectedChallenge.id);
        if (error) throw error;
        toast({ title: "Challenge updated" });
      } else {
        const { error } = await supabase.from("challenges").insert(data);
        if (error) throw error;
        toast({ title: "Challenge created" });
      }
      setChallengeDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Badge CRUD
  const openBadgeDialog = (badge?: BadgeData) => {
    if (badge) {
      setSelectedBadge(badge);
      setBadgeForm({
        code: badge.code, name: badge.name, description: badge.description || "",
        category: badge.category, criteria_type: badge.criteria_type,
        criteria_value: badge.criteria_value?.toString() || "100", points_awarded: badge.points_awarded?.toString() || "50"
      });
    } else {
      setSelectedBadge(null);
      setBadgeForm({ code: "", name: "", description: "", category: "achievement",
        criteria_type: "points", criteria_value: "100", points_awarded: "50" });
    }
    setBadgeDialogOpen(true);
  };

  const saveBadge = async () => {
    try {
      const data = {
        code: badgeForm.code, name: badgeForm.name, description: badgeForm.description || null,
        category: badgeForm.category, criteria_type: badgeForm.criteria_type,
        criteria_value: parseInt(badgeForm.criteria_value), points_awarded: parseInt(badgeForm.points_awarded),
        is_active: true
      };
      if (selectedBadge) {
        const { error } = await supabase.from("badges").update(data).eq("id", selectedBadge.id);
        if (error) throw error;
        toast({ title: "Badge updated" });
      } else {
        const { error } = await supabase.from("badges").insert(data);
        if (error) throw error;
        toast({ title: "Badge created" });
      }
      setBadgeDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Reward CRUD
  const openRewardDialog = (reward?: Reward) => {
    if (reward) {
      setSelectedReward(reward);
      setRewardForm({
        name: reward.name, description: reward.description || "",
        reward_type: reward.reward_type, points_cost: reward.points_cost.toString(),
        quantity_available: reward.quantity_available?.toString() || ""
      });
    } else {
      setSelectedReward(null);
      setRewardForm({ name: "", description: "", reward_type: "merchandise", points_cost: "500", quantity_available: "10" });
    }
    setRewardDialogOpen(true);
  };

  const saveReward = async () => {
    try {
      const data = {
        name: rewardForm.name, description: rewardForm.description || null,
        reward_type: rewardForm.reward_type, points_cost: parseInt(rewardForm.points_cost),
        quantity_available: rewardForm.quantity_available ? parseInt(rewardForm.quantity_available) : null,
        is_available: true
      };
      if (selectedReward) {
        const { error } = await supabase.from("rewards_catalog").update(data).eq("id", selectedReward.id);
        if (error) throw error;
        toast({ title: "Reward updated" });
      } else {
        const { error } = await supabase.from("rewards_catalog").insert(data);
        if (error) throw error;
        toast({ title: "Reward created" });
      }
      setRewardDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteType || !deleteId) return;
    setDeleting(true);
    try {
      const table = deleteType === "challenge" ? "challenges" : deleteType === "badge" ? "badges" : "rewards_catalog";
      const { error } = await supabase.from(table).delete().eq("id", deleteId);
      if (error) throw error;
      toast({ title: "Deleted successfully" });
      setDeleteType(null);
      setDeleteId(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(false);
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rewards</p>
                <p className="text-3xl font-bold">{stats.totalRewards}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Gift className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard" className="gap-2"><Trophy className="h-4 w-4" />Leaderboard</TabsTrigger>
          <TabsTrigger value="challenges" className="gap-2"><Target className="h-4 w-4" />Challenges</TabsTrigger>
          <TabsTrigger value="badges" className="gap-2"><Award className="h-4 w-4" />Badges</TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2"><Gift className="h-4 w-4" />Rewards</TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
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
                    <TableCell><div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold">{index + 1}</div></TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.profile?.first_name || 'Unknown'} {user.profile?.last_name || ''}</div>
                        <div className="text-sm text-muted-foreground">{user.profile?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell><Badge className={getLevelBadge(user.current_level)}>{user.current_level?.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell className="text-right font-bold">{user.total_points.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{user.current_streak}</TableCell>
                    <TableCell className="text-right">{user.daily_streak}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setAdjustDialogOpen(true); }}>
                        <Edit className="h-4 w-4 mr-1" />Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openChallengeDialog()}><Plus className="h-4 w-4 mr-2" />New Challenge</Button>
          </div>
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
                      <div><div className="font-medium">{challenge.name}</div><div className="text-sm text-muted-foreground">{challenge.description}</div></div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{challenge.challenge_type}</Badge></TableCell>
                    <TableCell>{challenge.target_value} {challenge.target_metric}</TableCell>
                    <TableCell>{challenge.points_reward} pts</TableCell>
                    <TableCell className="text-sm">{new Date(challenge.starts_at).toLocaleDateString()} - {new Date(challenge.ends_at).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={challenge.is_active ? "default" : "secondary"}>{challenge.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleChallengeActive(challenge)}>{challenge.is_active ? "Deactivate" : "Activate"}</Button>
                        <Button size="sm" variant="ghost" onClick={() => openChallengeDialog(challenge)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setDeleteType("challenge"); setDeleteId(challenge.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {challenges.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No challenges found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openBadgeDialog()}><Plus className="h-4 w-4 mr-2" />New Badge</Button>
          </div>
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
                        <Badge variant={badge.is_active ? "default" : "secondary"} className="text-xs">{badge.is_active ? "Active" : "Inactive"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{badge.category}</Badge>
                        <span className="text-sm text-muted-foreground">{badge.points_awarded} pts</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="ghost" onClick={() => openBadgeDialog(badge)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setDeleteType("badge"); setDeleteId(badge.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openRewardDialog()}><Plus className="h-4 w-4 mr-2" />New Reward</Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points Cost</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div><div className="font-medium">{reward.name}</div><div className="text-sm text-muted-foreground">{reward.description}</div></div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{reward.reward_type}</Badge></TableCell>
                    <TableCell className="font-bold">{reward.points_cost.toLocaleString()} pts</TableCell>
                    <TableCell>{reward.quantity_available ?? "Unlimited"}</TableCell>
                    <TableCell><Badge variant={reward.is_available ? "default" : "secondary"}>{reward.is_available ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openRewardDialog(reward)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setDeleteType("reward"); setDeleteId(reward.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rewards.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No rewards found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Points Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Points</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>User</Label><p className="text-sm font-medium mt-1">{selectedUser?.profile?.first_name} {selectedUser?.profile?.last_name}</p></div>
            <div><Label>Current Points</Label><p className="text-2xl font-bold mt-1">{selectedUser?.total_points.toLocaleString()}</p></div>
            <div><Label>Points to Add/Remove</Label><Input type="number" value={pointsToAdd} onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)} placeholder="Enter positive or negative value" className="mt-1" /></div>
            <div><Label>Reason</Label><Textarea value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} placeholder="Reason for adjustment..." className="mt-1" /></div>
            {pointsToAdd !== 0 && (
              <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">New Total:</p><p className="text-2xl font-bold">{((selectedUser?.total_points || 0) + pointsToAdd).toLocaleString()}</p></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjustPoints} disabled={adjusting || pointsToAdd === 0}>{adjusting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Adjust Points</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Challenge Dialog */}
      <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedChallenge ? "Edit Challenge" : "New Challenge"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Name</Label><Input value={challengeForm.name} onChange={(e) => setChallengeForm({ ...challengeForm, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={challengeForm.description} onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Type</Label><Select value={challengeForm.challenge_type} onValueChange={(v) => setChallengeForm({ ...challengeForm, challenge_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="team">Team</SelectItem><SelectItem value="company">Company</SelectItem></SelectContent></Select></div>
              <div><Label>Target Metric</Label><Select value={challengeForm.target_metric} onValueChange={(v) => setChallengeForm({ ...challengeForm, target_metric: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="referrals">Referrals</SelectItem><SelectItem value="jobs">Jobs</SelectItem><SelectItem value="revenue">Revenue</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Target Value</Label><Input type="number" value={challengeForm.target_value} onChange={(e) => setChallengeForm({ ...challengeForm, target_value: e.target.value })} /></div>
              <div><Label>Points Reward</Label><Input type="number" value={challengeForm.points_reward} onChange={(e) => setChallengeForm({ ...challengeForm, points_reward: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={challengeForm.starts_at} onChange={(e) => setChallengeForm({ ...challengeForm, starts_at: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={challengeForm.ends_at} onChange={(e) => setChallengeForm({ ...challengeForm, ends_at: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChallengeDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveChallenge}>{selectedChallenge ? "Save Changes" : "Create Challenge"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge Dialog */}
      <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedBadge ? "Edit Badge" : "New Badge"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Code</Label><Input value={badgeForm.code} onChange={(e) => setBadgeForm({ ...badgeForm, code: e.target.value })} placeholder="badge_code" /></div>
              <div><Label>Name</Label><Input value={badgeForm.name} onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={badgeForm.description} onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label><Select value={badgeForm.category} onValueChange={(v) => setBadgeForm({ ...badgeForm, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="achievement">Achievement</SelectItem><SelectItem value="milestone">Milestone</SelectItem><SelectItem value="special">Special</SelectItem></SelectContent></Select></div>
              <div><Label>Criteria Type</Label><Select value={badgeForm.criteria_type} onValueChange={(v) => setBadgeForm({ ...badgeForm, criteria_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="points">Points</SelectItem><SelectItem value="referrals">Referrals</SelectItem><SelectItem value="streak">Streak</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Criteria Value</Label><Input type="number" value={badgeForm.criteria_value} onChange={(e) => setBadgeForm({ ...badgeForm, criteria_value: e.target.value })} /></div>
              <div><Label>Points Awarded</Label><Input type="number" value={badgeForm.points_awarded} onChange={(e) => setBadgeForm({ ...badgeForm, points_awarded: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBadgeDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveBadge}>{selectedBadge ? "Save Changes" : "Create Badge"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reward Dialog */}
      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedReward ? "Edit Reward" : "New Reward"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Name</Label><Input value={rewardForm.name} onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Type</Label><Select value={rewardForm.reward_type} onValueChange={(v) => setRewardForm({ ...rewardForm, reward_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="merchandise">Merchandise</SelectItem><SelectItem value="gift_card">Gift Card</SelectItem><SelectItem value="discount">Discount</SelectItem><SelectItem value="feature">Feature Access</SelectItem></SelectContent></Select></div>
              <div><Label>Points Cost</Label><Input type="number" value={rewardForm.points_cost} onChange={(e) => setRewardForm({ ...rewardForm, points_cost: e.target.value })} /></div>
            </div>
            <div><Label>Quantity Available (leave empty for unlimited)</Label><Input type="number" value={rewardForm.quantity_available} onChange={(e) => setRewardForm({ ...rewardForm, quantity_available: e.target.value })} placeholder="Unlimited" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveReward}>{selectedReward ? "Save Changes" : "Create Reward"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteType} onOpenChange={() => { setDeleteType(null); setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteType}</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this {deleteType}? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}