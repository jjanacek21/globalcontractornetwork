import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  UserPlus, DollarSign, Wrench, TrendingUp, Users, FileText,
  Briefcase, Eye, Calendar, Clock,
} from "lucide-react";
import { format } from "date-fns";

const PIPELINE_STAGES = [
  { key: "new", label: "New Lead", color: "bg-blue-500" },
  { key: "contact_made", label: "Contacted", color: "bg-yellow-500" },
  { key: "inspection_scheduled", label: "Qualified", color: "bg-cyan-500" },
  { key: "estimate_sent", label: "Proposal Sent", color: "bg-purple-500" },
  { key: "negotiating", label: "Negotiating", color: "bg-pink-500" },
  { key: "closed_won", label: "Closed Won", color: "bg-green-500" },
  { key: "closed_lost", label: "Closed Lost", color: "bg-gray-500" },
];

interface DashboardStats {
  totalLeads: number;
  pipelineCounts: Record<string, number>;
  unassignedLeads: number;
  jobsForApproval: number;
  jobsInProgress: number;
  watchList: number;
  totalRevenue: number;
  activeProjects: number;
  completedThisMonth: number;
  avgProfitMargin: number;
  companyName: string;
}

export default function CRMDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    pipelineCounts: {},
    unassignedLeads: 0,
    jobsForApproval: 0,
    jobsInProgress: 0,
    watchList: 0,
    totalRevenue: 0,
    activeProjects: 0,
    completedThisMonth: 0,
    avgProfitMargin: 0,
    companyName: "",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get company name
        const { data: contractor } = await supabase
          .from("contractor_profiles")
          .select("company_name")
          .eq("user_id", session.user.id)
          .maybeSingle();

        // Get leads with status counts
        const { data: leads } = await supabase.from("leads").select("status, assigned_rep_id");
        const pipelineCounts: Record<string, number> = {};
        let unassigned = 0;
        leads?.forEach(l => {
          pipelineCounts[l.status || "new"] = (pipelineCounts[l.status || "new"] || 0) + 1;
          if (!l.assigned_rep_id) unassigned++;
        });

        // Get jobs
        const { data: jobs } = await supabase.from("crm_jobs").select("stage, contract_amount, collected_amount, completion_date");
        let inProgress = 0, totalRevenue = 0, activeProjects = 0, completedThisMonth = 0;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        jobs?.forEach(j => {
          if (j.stage === "in_progress" || j.stage === "scheduled") inProgress++;
          if (j.stage !== "completed" && j.stage !== "invoiced") activeProjects++;
          totalRevenue += Number(j.collected_amount || 0);
          if (j.completion_date && j.completion_date >= monthStart) completedThisMonth++;
        });

        // Get accepted estimates revenue
        const { data: estimates } = await supabase.from("estimates").select("total").eq("status", "accepted");
        const estRevenue = estimates?.reduce((s, e) => s + Number(e.total || 0), 0) || 0;

        setStats({
          totalLeads: leads?.length || 0,
          pipelineCounts,
          unassignedLeads: unassigned,
          jobsForApproval: 0,
          jobsInProgress: inProgress,
          watchList: 0,
          totalRevenue: totalRevenue || estRevenue,
          activeProjects,
          completedThisMonth,
          avgProfitMargin: 0,
          companyName: contractor?.company_name || "Your Company",
        });
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const quickActions = [
    { title: "New Contact", subtitle: "Add a new customer contact", icon: UserPlus, color: "bg-blue-600 hover:bg-blue-700", onClick: () => navigate("/member/crm/contacts") },
    { title: "Create Estimate", subtitle: "Build a new roof estimate", icon: DollarSign, color: "bg-orange-500 hover:bg-orange-600", onClick: () => navigate("/member/crm/estimates") },
    { title: "Schedule Work", subtitle: "Manage project schedules", icon: Wrench, color: "bg-green-600 hover:bg-green-700", onClick: () => navigate("/member/crm/production") },
  ];

  const progressCards = [
    { label: "Unassigned Leads", value: stats.unassignedLeads, icon: Users },
    { label: "Jobs for Approval", value: stats.jobsForApproval, icon: FileText },
    { label: "Jobs in Progress", value: stats.jobsInProgress, icon: Wrench },
    { label: "Watch List", value: stats.watchList, icon: Eye },
  ];

  const revenueCards = [
    { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, change: "0% from last month" },
    { label: "Active Projects", value: stats.activeProjects.toString(), icon: Wrench, change: "+0 from last month" },
    { label: "Completed This Month", value: stats.completedThisMonth.toString(), icon: Briefcase, change: "+0 from last month" },
    { label: "Avg Profit Margin", value: `${stats.avgProfitMargin}%`, icon: TrendingUp, change: "0% from last month" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{stats.companyName} Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your roofing business overview.</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(Date.now() - 90 * 86400000), "MMM dd, yyyy")} - {format(new Date(), "MMM dd, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(), "h:mm:ss a")}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={action.onClick}
            className={`${action.color} text-white rounded-xl p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md`}
          >
            <action.icon className="h-10 w-10 mb-3 opacity-90" />
            <h3 className="font-bold text-lg">{action.title}</h3>
            <p className="text-sm opacity-80">{action.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Pipeline Status */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-foreground" />
          <h2 className="text-xl font-bold text-foreground">Pipeline Status</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {PIPELINE_STAGES.map((stage) => (
            <button
              key={stage.key}
              onClick={() => navigate("/member/crm/pipeline")}
              className="flex flex-col items-center"
            >
              <div className={`${stage.color} text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md hover:scale-105 transition-transform`}>
                {loading ? <Skeleton className="h-6 w-6 bg-white/30" /> : stats.pipelineCounts[stage.key] || 0}
              </div>
              <span className="text-xs text-muted-foreground mt-1.5 text-center max-w-[80px]">{stage.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Section */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {progressCards.map((card) => (
            <Card key={card.label} className="shadow-sm">
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loading ? <Skeleton className="h-7 w-8" /> : card.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                  </div>
                  <card.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {revenueCards.map((card) => (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? <Skeleton className="h-7 w-16" /> : card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">↗ {card.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
