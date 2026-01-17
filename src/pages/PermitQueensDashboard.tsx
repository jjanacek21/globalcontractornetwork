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
      <div className="min-h-screen hero-gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(45,90%,55%)]" />
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
    <div className="min-h-screen hero-gradient-bg relative">
      {/* Grid Pattern Overlay */}
      <div className="grid-pattern-dark absolute inset-0" />
      
      {/* Gold Orbs */}
      <div className="gold-orb gold-orb-1" />
      <div className="gold-orb gold-orb-2" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 bg-[hsl(0,0%,5%)] backdrop-blur-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-container-gold !w-10 !h-10 !rounded-full">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Permit Queens</h1>
                <p className="text-xs text-white/50">Client Portal</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSignOut}
              className="text-white hover:text-[hsl(45,90%,55%)] hover:bg-white/10"
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
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome back, {firstName}!
              </h2>
              <p className="text-white/60">
                Track your permits and project status from your dashboard.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/permit-queens/new-request')}
              className="btn-gold"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Permit Request
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="premium-card-dark">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Pending Permits</p>
                    <p className="text-3xl font-bold text-white">{pendingCount}</p>
                  </div>
                  <div className="icon-container-gold">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="premium-card-dark">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Completed</p>
                    <p className="text-3xl font-bold text-white">{completedCount}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-[hsl(142,70%,45%)]/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-[hsl(142,70%,45%)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="premium-card-dark">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Action Required</p>
                    <p className="text-3xl font-bold text-white">{actionRequiredCount}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-[hsl(0,70%,50%)]/20 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-[hsl(0,70%,50%)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects Table */}
          <Card className="premium-card-dark mb-8">
            <CardHeader>
              <CardTitle className="text-white">Your Projects</CardTitle>
              <CardDescription className="text-white/50">
                View and manage your permit applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(45,90%,55%)] mx-auto" />
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
          <Card className="premium-card-dark">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[hsl(45,90%,55%)]" />
                Need Help?
              </CardTitle>
              <CardDescription className="text-white/50">
                Contact our team for assistance with your permits
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <Phone className="h-5 w-5 text-[hsl(45,90%,55%)]" />
                <div>
                  <p className="text-sm text-white/50">Phone</p>
                  <p className="text-white font-medium">(561) 555-PERM</p>
                </div>
              </div>
              <Button className="btn-gold">
                Request Callback
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>

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