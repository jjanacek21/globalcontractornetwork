import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  FileCheck, 
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

export default function PermitProsDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<PermitProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PermitProject | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/permit-pros/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/permit-pros/auth");
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Permit Pros</h1>
              <p className="text-xs text-zinc-400">Client Portal</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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
            <p className="text-zinc-400">
              Track your permits and project status from your dashboard.
            </p>
          </div>
          <Button 
            onClick={() => setAddDialogOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Pending Permits</p>
                  <p className="text-3xl font-bold text-white">{pendingCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/50 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Completed</p>
                  <p className="text-3xl font-bold text-white">{completedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/50 border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Action Required</p>
                  <p className="text-3xl font-bold text-white">{actionRequiredCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Table */}
        <Card className="bg-zinc-900/50 border-amber-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Your Projects</CardTitle>
            <CardDescription className="text-zinc-400">
              View and manage your permit applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
              </div>
            ) : (
              <ProjectsTable 
                projects={projects} 
                onRefresh={fetchProjects}
                onViewProject={setSelectedProject}
              />
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-zinc-900/50 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              Need Help?
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Contact our team for assistance with your permits
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
              <Phone className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-zinc-400">Phone</p>
                <p className="text-white font-medium">(561) 555-PERM</p>
              </div>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
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
      />
    </div>
  );
}