import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, TrendingUp, ClipboardCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalLeads: number;
  estimatesSent: number;
  totalRevenue: number;
  conversionRate: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    estimatesSent: 0,
    totalRevenue: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total leads
        const { count: leadsCount } = await supabase
          .from("permit_customers")
          .select("*", { count: "exact", head: true });

        // Get estimates sent
        const { count: estimatesCount } = await supabase
          .from("estimates")
          .select("*", { count: "exact", head: true });

        // Get sold customers
        const { count: soldCount } = await supabase
          .from("permit_customers")
          .select("*", { count: "exact", head: true })
          .eq("pipeline_stage", "sold");

        // Get total revenue from sold estimates
        const { data: revenueData } = await supabase
          .from("estimates")
          .select("total")
          .eq("status", "accepted");

        const totalRevenue = revenueData?.reduce((sum, item) => sum + Number(item.total || 0), 0) || 0;
        const conversionRate = leadsCount ? ((soldCount || 0) / leadsCount) * 100 : 0;

        setStats({
          totalLeads: leadsCount || 0,
          estimatesSent: estimatesCount || 0,
          totalRevenue,
          conversionRate,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Estimates Sent",
      value: stats.estimatesSent,
      icon: ClipboardCheck,
      color: "text-accent",
    },
    {
      title: "Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your sales pipeline</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New lead added</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Estimate sent</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Deal closed</p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lead</span>
                  <span className="font-medium">40%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-[40%] rounded-full bg-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Inspection</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-[25%] rounded-full bg-accent" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimate Sent</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-[20%] rounded-full bg-blue-600" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sold</span>
                  <span className="font-medium">15%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-[15%] rounded-full bg-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
