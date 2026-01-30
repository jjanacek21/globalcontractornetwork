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
  Building2
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AddProjectDialog } from "@/components/permit-pros/AddProjectDialog";
import { ProjectsTable } from "@/components/permit-pros/ProjectsTable";
import { ProjectDetailsDialog } from "@/components/permit-pros/ProjectDetailsDialog";
import { ProjectActionsDialog } from "@/components/permit-pros/ProjectActionsDialog";
import { StatCard3D } from "@/components/crm-ui";

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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard3D
            title="Pending Permits"
            value={pendingCount}
            icon={Clock}
            color="warning"
          />
          
          <StatCard3D
            title="Completed"
            value={completedCount}
            icon={CheckCircle2}
            color="success"
          />
          
          <StatCard3D
            title="Action Required"
            value={actionRequiredCount}
            icon={AlertCircle}
            color="danger"
          />
        </div>

        {/* Projects Table */}
        <Card className="mb-8 border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Your Projects</CardTitle>
            <CardDescription className="text-muted-foreground">
              View and manage your permit applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : (
              <ProjectsTable 
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
