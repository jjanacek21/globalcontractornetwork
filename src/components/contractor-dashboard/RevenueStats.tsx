import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, TrendingUp, Calendar, Users, 
  Briefcase, Target, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { ContractorStats, ContractorJob } from "@/hooks/useContractorDashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueStatsProps {
  stats: ContractorStats;
  jobs: ContractorJob[];
}

export const RevenueStats = ({ stats, jobs }: RevenueStatsProps) => {
  // Generate monthly revenue data from completed jobs
  const getMonthlyData = () => {
    const months: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString("en-US", { month: "short" });
      months[key] = 0;
    }

    // Sum completed job revenue by month
    jobs
      .filter(j => j.status === "completed" && j.collected_amount)
      .forEach(job => {
        const date = new Date(job.updated_at);
        const key = date.toLocaleDateString("en-US", { month: "short" });
        if (months[key] !== undefined) {
          months[key] += job.collected_amount || 0;
        }
      });

    return Object.entries(months).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  };

  const monthlyData = getMonthlyData();

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "This Month",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs.toString(),
      icon: Briefcase,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Completed Jobs",
      value: stats.completedJobs.toString(),
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Leads",
      value: stats.totalLeads.toString(),
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      title: "New Leads",
      value: stats.newLeads.toString(),
      icon: TrendingUp,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trend (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 45%, 28%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 45%, 28%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(152, 45%, 28%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Completed Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Completed Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs
              .filter(j => j.status === "completed")
              .slice(0, 5)
              .map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{job.homeowner_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.service_type} • {job.property_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ${job.collected_amount?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(job.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            {jobs.filter(j => j.status === "completed").length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No completed jobs yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
