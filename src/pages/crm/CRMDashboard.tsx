import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  UserPlus, DollarSign, Wrench, TrendingUp, Users, FileText,
  Briefcase, Eye, Calendar, Clock, MessageSquare, CheckCircle,
  Plus, Edit, Phone, Mail,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ReturnHomeButton } from "@/components/layout/ReturnHomeButton";

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
  totalContacts: number;
  openEstimates: number;
  activeJobs: number;
  totalRevenue: number;
  pipelineCounts: Record<string, number>;
  unassignedLeads: number;
  jobsInProgress: number;
  completedThisMonth: number;
  companyName: string;
}

interface RecentActivity {
  id: string;
  action: string;
  description: string | null;
  entity_type: string;
  created_at: string;
  user_name: string | null;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  created: Plus,
  updated: Edit,
  status_changed: CheckCircle,
  note_added: MessageSquare,
  call_made: Phone,
  email_sent: Mail,
  document_uploaded: FileText,
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-600",
  updated: "bg-amber-100 text-amber-600",
  status_changed: "bg-teal-100 text-teal-600",
  note_added: "bg-blue-100 text-blue-600",
  call_made: "bg-green-100 text-green-600",
  email_sent: "bg-purple-100 text-purple-600",
  document_uploaded: "bg-orange-100 text-orange-600",
};

export default function CRMDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    openEstimates: 0,
    activeJobs: 0,
    totalRevenue: 0,
    pipelineCounts: {},
    unassignedLeads: 0,
    jobsInProgress: 0,
    completedThisMonth: 0,
    companyName: "",
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Parallel queries
        const [
          contractorRes,
          contactsRes,
          estimatesRes,
          jobsRes,
          leadsRes,
          activitiesRes,
        ] = await Promise.all([
          supabase.from("contractor_profiles").select("company_name").eq("user_id", session.user.id).maybeSingle(),
          supabase.from("contacts").select("id", { count: "exact", head: true }),
          supabase.from("estimates").select("total, status"),
          supabase.from("crm_jobs").select("stage, collected_amount, completion_date"),
          supabase.from("leads").select("status, assigned_rep_id"),
          supabase.from("activities").select(`
            id, action, description, entity_type, created_at,
            user:profiles(first_name, last_name)
          `).order("created_at", { ascending: false }).limit(10),
        ]);

        // Contacts count
        const totalContacts = contactsRes.count || 0;

        // Estimates
        const estimates = estimatesRes.data || [];
        const openEstimates = estimates.filter(e => e.status !== "accepted" && e.status !== "rejected").length;
        const totalRevenue = estimates.reduce((s, e) => s + Number(e.total || 0), 0);

        // Jobs
        const jobs = jobsRes.data || [];
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        let activeJobs = 0, jobsInProgress = 0, completedThisMonth = 0;
        let jobRevenue = 0;
        jobs.forEach(j => {
          if (j.stage !== "completed" && j.stage !== "invoiced") activeJobs++;
          if (j.stage === "in_progress" || j.stage === "scheduled") jobsInProgress++;
          jobRevenue += Number(j.collected_amount || 0);
          if (j.completion_date && j.completion_date >= monthStart) completedThisMonth++;
        });

        // Leads pipeline
        const leads = leadsRes.data || [];
        const pipelineCounts: Record<string, number> = {};
        let unassigned = 0;
        leads.forEach(l => {
          pipelineCounts[l.status || "new"] = (pipelineCounts[l.status || "new"] || 0) + 1;
          if (!l.assigned_rep_id) unassigned++;
        });

        // Activities
        const recentActivities: RecentActivity[] = (activitiesRes.data || []).map((a: any) => ({
          id: a.id,
          action: a.action,
          description: a.description,
          entity_type: a.entity_type,
          created_at: a.created_at,
          user_name: a.user ? `${a.user.first_name || ""} ${a.user.last_name || ""}`.trim() : null,
        }));

        setStats({
          totalContacts,
          openEstimates,
          activeJobs,
          totalRevenue: jobRevenue || totalRevenue,
          pipelineCounts,
          unassignedLeads: unassigned,
          jobsInProgress,
          completedThisMonth,
          companyName: contractorRes.data?.company_name || "Your Company",
        });
        setActivities(recentActivities);
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const quickActions = [
    { title: "New Contact", subtitle: "Add a new customer contact", icon: UserPlus, color: "bg-blue-600 hover:bg-blue-700", onClick: () => navigate("/member/crm/contacts") },
    { title: "Create Estimate", subtitle: "Build a new roof estimate", icon: DollarSign, color: "bg-orange-500 hover:bg-orange-600", onClick: () => navigate("/member/crm/estimates") },
    { title: "Schedule Work", subtitle: "Manage project schedules", icon: Wrench, color: "bg-green-600 hover:bg-green-700", onClick: () => navigate("/member/crm/production") },
  ];

  const kpiCards = [
    { label: "Total Contacts", value: stats.totalContacts, icon: Users, color: "text-primary" },
    { label: "Open Estimates", value: stats.openEstimates, icon: FileText, color: "text-amber-600" },
    { label: "Active Jobs", value: stats.activeJobs, icon: Wrench, color: "text-blue-600" },
    { label: "Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
  ];

  const progressCards = [
    { label: "Unassigned Leads", value: stats.unassignedLeads, icon: Users },
    { label: "Jobs in Progress", value: stats.jobsInProgress, icon: Wrench },
    { label: "Completed This Month", value: stats.completedThisMonth, icon: Briefcase },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">{stats.companyName} Dashboard</h1>
          <ReturnHomeButton />
        </div>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your roofing business overview.</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(), "MMM dd, yyyy")}</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? <Skeleton className="h-7 w-16" /> : card.value}
              </p>
            </CardContent>
          </Card>
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

      {/* Progress + Recent Activity side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Progress</h2>
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

        {/* Recent Activity */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity recorded yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const Icon = ACTION_ICONS[activity.action] || CheckCircle;
                    const colorClass = ACTION_COLORS[activity.action] || "bg-muted text-muted-foreground";
                    return (
                      <div key={activity.id} className="relative flex gap-3 pl-1">
                        <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {activity.action.replace(/_/g, " ")}
                                <span className="text-muted-foreground font-normal"> · {activity.entity_type}</span>
                              </p>
                              {activity.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.description}</p>
                              )}
                              {activity.user_name && (
                                <p className="text-xs text-muted-foreground">by {activity.user_name}</p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
