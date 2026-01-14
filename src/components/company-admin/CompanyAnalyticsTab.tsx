import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Users, TrendingUp, DollarSign, Filter } from "lucide-react";

interface CompanyAnalyticsTabProps {
  companyId: string;
}

interface TeamAnalytics {
  teamId: string;
  teamName: string;
  referralsCount: number;
  leadsCount: number;
  earnings: number;
}

interface UserAnalytics {
  userId: string;
  userName: string;
  teamName: string | null;
  referralsCount: number;
  earnings: number;
}

export const CompanyAnalyticsTab = ({ companyId }: CompanyAnalyticsTabProps) => {
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState("all");
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch teams
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name")
          .eq("company_id", companyId);
        setTeams(teamsData || []);

        // Fetch referrals with team info
        const { data: referrals } = await supabase
          .from("contractor_referrals")
          .select(`
            team_id,
            status,
            payout_amount,
            referring_contractor_id
          `)
          .eq("company_id", companyId);

        // Aggregate by team
        const teamMap = new Map<string, TeamAnalytics>();
        teamsData?.forEach(team => {
          teamMap.set(team.id, {
            teamId: team.id,
            teamName: team.name,
            referralsCount: 0,
            leadsCount: 0,
            earnings: 0
          });
        });

        referrals?.forEach(ref => {
          if (ref.team_id && teamMap.has(ref.team_id)) {
            const team = teamMap.get(ref.team_id)!;
            team.referralsCount++;
            if (ref.status === "paid" && ref.payout_amount) {
              team.earnings += ref.payout_amount;
            }
          }
        });

        setTeamAnalytics(Array.from(teamMap.values()));

        // Fetch company members with their referral counts
        const { data: members } = await supabase
          .from("company_members")
          .select(`
            user_id,
            team_id,
            team:teams(name)
          `)
          .eq("company_id", companyId);

        // Get profiles for members
        const userAnalyticsData: UserAnalytics[] = [];
        for (const member of members || []) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", member.user_id)
            .single();

          // Get contractor profile for this user
          const { data: contractorProfile } = await supabase
            .from("contractor_profiles")
            .select("id")
            .eq("user_id", member.user_id)
            .single();

          let referralsCount = 0;
          let earnings = 0;

          if (contractorProfile) {
            const { data: userReferrals } = await supabase
              .from("contractor_referrals")
              .select("status, payout_amount")
              .eq("referring_contractor_id", contractorProfile.id);

            referralsCount = userReferrals?.length || 0;
            earnings = userReferrals
              ?.filter(r => r.status === "paid")
              .reduce((sum, r) => sum + (r.payout_amount || 0), 0) || 0;
          }

          userAnalyticsData.push({
            userId: member.user_id,
            userName: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Unknown",
            teamName: member.team?.name || null,
            referralsCount,
            earnings
          });
        }

        setUserAnalytics(userAnalyticsData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [companyId]);

  const filteredUserAnalytics = teamFilter === "all"
    ? userAnalytics
    : userAnalytics.filter(u => {
        const team = teams.find(t => t.name === u.teamName);
        return team?.id === teamFilter;
      });

  const totalReferrals = teamAnalytics.reduce((sum, t) => sum + t.referralsCount, 0);
  const totalEarnings = teamAnalytics.reduce((sum, t) => sum + t.earnings, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Company Analytics
        </h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Teams</p>
                <p className="text-3xl font-bold">{teams.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{userAnalytics.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-3xl font-bold">{totalReferrals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">${totalEarnings.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Team</CardTitle>
          <CardDescription>Referrals and earnings breakdown by team</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading analytics...</p>
          ) : teamAnalytics.length === 0 ? (
            <p className="text-muted-foreground">No teams to display. Create teams to see analytics.</p>
          ) : (
            <div className="space-y-4">
              {teamAnalytics.map(team => (
                <div key={team.teamId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{team.teamName}</p>
                    <p className="text-sm text-muted-foreground">{team.referralsCount} referrals</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${team.earnings.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">earned</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by User</CardTitle>
          <CardDescription>Individual team member performance</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading analytics...</p>
          ) : filteredUserAnalytics.length === 0 ? (
            <p className="text-muted-foreground">No users to display.</p>
          ) : (
            <div className="space-y-3">
              {filteredUserAnalytics
                .sort((a, b) => b.earnings - a.earnings)
                .map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{user.userName}</p>
                        <p className="text-xs text-muted-foreground">{user.teamName || "No Team"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="font-semibold">{user.referralsCount}</p>
                        <p className="text-xs text-muted-foreground">referrals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${user.earnings.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">earned</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
