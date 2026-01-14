import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, DollarSign, TrendingUp, Building2, MapPin } from "lucide-react";

interface CompanyOverviewTabProps {
  companyId: string;
}

interface Stats {
  totalTeams: number;
  totalUsers: number;
  totalLeads: number;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalEarnings: number;
}

export const CompanyOverviewTab = ({ companyId }: CompanyOverviewTabProps) => {
  const [stats, setStats] = useState<Stats>({
    totalTeams: 0,
    totalUsers: 0,
    totalLeads: 0,
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch teams count
        const { count: teamsCount } = await supabase
          .from("teams")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId);

        // Fetch users count
        const { count: usersCount } = await supabase
          .from("company_members")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId);

        // Fetch leads count (from contractor_leads where contractor belongs to company)
        const { data: contractorProfiles } = await supabase
          .from("contractor_profiles")
          .select("id")
          .eq("company_id", companyId);

        const contractorIds = contractorProfiles?.map(c => c.id) || [];
        
        let leadsCount = 0;
        if (contractorIds.length > 0) {
          const { count } = await supabase
            .from("contractor_leads")
            .select("*", { count: "exact", head: true })
            .in("contractor_id", contractorIds);
          leadsCount = count || 0;
        }

        // Fetch referrals
        const { data: referrals } = await supabase
          .from("contractor_referrals")
          .select("status, payout_amount")
          .eq("company_id", companyId);

        const referralsData = referrals || [];
        const pendingReferrals = referralsData.filter(r => r.status === "pending").length;
        const completedReferrals = referralsData.filter(r => r.status === "completed" || r.status === "paid").length;
        const totalEarnings = referralsData
          .filter(r => r.status === "paid")
          .reduce((sum, r) => sum + (r.payout_amount || 0), 0);

        setStats({
          totalTeams: teamsCount || 0,
          totalUsers: usersCount || 0,
          totalLeads: leadsCount,
          totalReferrals: referralsData.length,
          pendingReferrals,
          completedReferrals,
          totalEarnings
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [companyId]);

  const statCards = [
    { title: "Total Teams", value: stats.totalTeams, icon: MapPin, color: "text-blue-600" },
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-green-600" },
    { title: "Total Leads", value: stats.totalLeads, icon: FileText, color: "text-purple-600" },
    { title: "Total Referrals", value: stats.totalReferrals, icon: TrendingUp, color: "text-orange-600" },
    { title: "Pending Referrals", value: stats.pendingReferrals, icon: Building2, color: "text-amber-600" },
    { title: "Completed Referrals", value: stats.completedReferrals, icon: TrendingUp, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{loading ? "-" : stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Earnings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Total Earnings
          </CardTitle>
          <CardDescription>Total referral earnings from completed jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-green-600">
            ${loading ? "..." : stats.totalEarnings.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your company</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No recent activity to display.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Use the tabs above to manage your teams, users, leads, and referrals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
