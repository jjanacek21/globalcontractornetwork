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
  FileText,
  Building2,
  Phone
} from "lucide-react";
import { User } from "@supabase/supabase-js";

export default function PermitProsDashboard() {
  const [user, setUser] = useState<User | null>(null);
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {firstName}!
          </h2>
          <p className="text-zinc-400">
            Track your permits and project status from your dashboard.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Active Permits</p>
                  <p className="text-3xl font-bold text-white">0</p>
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
                  <p className="text-sm text-zinc-400">Approved</p>
                  <p className="text-3xl font-bold text-white">0</p>
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
                  <p className="text-3xl font-bold text-white">0</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-zinc-900/50 border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                Your Projects
              </CardTitle>
              <CardDescription className="text-zinc-400">
                View and manage your permit applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-zinc-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active projects yet.</p>
                <p className="text-sm mt-2">Contact us to start your permit application.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-500" />
                Contact Support
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Get help with your permits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <Phone className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm text-zinc-400">Phone</p>
                  <p className="text-white font-medium">(561) 555-PERM</p>
                </div>
              </div>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                Request Callback
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
