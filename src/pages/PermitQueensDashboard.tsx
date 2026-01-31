import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Crown, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Phone,
  Building2,
  FileText,
  ArrowRight
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AddProjectDialog } from "@/components/permit-pros/AddProjectDialog";
import { ProjectsList } from "@/components/permit-queens/ProjectsList";
import { ProjectDetailsDialog } from "@/components/permit-pros/ProjectDetailsDialog";
import { ProjectActionsDialog } from "@/components/permit-pros/ProjectActionsDialog";

interface PermitProject {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  property_address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  service_type: string;
  has_hurricane_straps: boolean | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function PermitQueensDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<PermitProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PermitProject | null>(null);
  const [actionProjectId, setActionProjectId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'upload' | 'inspection' | 'revision' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/permit-queens/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/permit-queens/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permit_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load projects.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const firstName = user.user_metadata?.first_name || user.email?.split("@")[0] || "Client";

  // Calculate stats
  const pendingCount = projects.filter(p => p.status === 'pending').length;
  const completedCount = projects.filter(p => p.status === 'complete').length;
  const actionRequiredCount = projects.filter(p => 
    ['documents_submitted', 'pending_payment'].includes(p.status)
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Permit Expediting</h1>
              <p className="text-xs text-muted-foreground">Contractor Portal</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome back, {firstName}!
            </h2>
            <p className="text-muted-foreground">
              Track your permits and project status from your dashboard.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/permit-queens/new-request')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Permit Request
          </Button>
        </div>

        {/* Stats Grid - Large & Prominent */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Pending - Most Prominent */}
          <Card className="relative overflow-hidden border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Pending Permits</p>
                  <p className="text-4xl font-bold text-amber-900 mt-1">{pendingCount}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-amber-200/50 flex items-center justify-center">
                  <Clock className="h-7 w-7 text-amber-700" />
                </div>
              </div>
              {pendingCount > 0 && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto mt-3 text-amber-700 hover:text-amber-900"
                  onClick={() => {/* Filter pending */}}
                >
                  View pending <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
          
          {/* Completed */}
          <Card className="relative overflow-hidden border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Completed</p>
                  <p className="text-4xl font-bold text-emerald-900 mt-1">{completedCount}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-emerald-200/50 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Required */}
          <Card className={`relative overflow-hidden border-2 ${actionRequiredCount > 0 ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100 animate-pulse' : 'border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${actionRequiredCount > 0 ? 'text-red-700' : 'text-slate-600'}`}>
                    Action Required
                  </p>
                  <p className={`text-4xl font-bold mt-1 ${actionRequiredCount > 0 ? 'text-red-900' : 'text-slate-800'}`}>
                    {actionRequiredCount}
                  </p>
                </div>
                <div className={`h-14 w-14 rounded-full flex items-center justify-center ${actionRequiredCount > 0 ? 'bg-red-200/50' : 'bg-slate-200/50'}`}>
                  <AlertCircle className={`h-7 w-7 ${actionRequiredCount > 0 ? 'text-red-700' : 'text-slate-600'}`} />
                </div>
              </div>
              {actionRequiredCount > 0 && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  ⚠️ Needs your attention
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <Card className="mb-8 border border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Your Permit Projects
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  View and manage your permit applications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : (
              <ProjectsList 
                projects={projects} 
                onRefresh={fetchProjects}
                onViewProject={setSelectedProject}
                onAction={(projectId, action) => {
                  setActionProjectId(projectId);
                  setActionType(action);
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Need Help?
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Contact our team for assistance with your permits
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-foreground font-medium">(561) 555-PERM</p>
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Request Callback
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchProjects}
        userId={user.id}
      />

      {/* Project Details Dialog */}
      <ProjectDetailsDialog
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
        onAction={(projectId, action) => {
          setActionProjectId(projectId);
          setActionType(action);
        }}
      />

      {/* Project Actions Dialog */}
      <ProjectActionsDialog
        projectId={actionProjectId || ''}
        userId={user.id}
        action={actionType}
        open={!!actionProjectId && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setActionProjectId(null);
            setActionType(null);
          }
        }}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
