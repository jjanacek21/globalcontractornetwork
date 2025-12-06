import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Crown, ShieldCheck } from "lucide-react";
import { PermitQueensHeader } from "@/components/permit-queens/PermitQueensHeader";

export default function PermitQueensAdminAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: adminData } = await supabase
          .from("permit_admins")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (adminData) {
          navigate("/permit-queens/admin/dashboard");
        }
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: adminData } = await supabase
          .from("permit_admins")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (adminData) {
          navigate("/permit-queens/admin/dashboard");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: adminData } = await supabase
        .from("permit_admins")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!adminData) {
        await supabase.auth.signOut();
        toast.error("You don't have admin access to Permit Queens.");
        setLoading(false);
        return;
      }

      toast.success("Welcome back, Admin!");
      navigate("/permit-queens/admin/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PermitQueensHeader />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="text-center">
              <div className="flex justify-center gap-2 mb-4">
                <Crown className="h-8 w-8 text-amber-500" />
                <ShieldCheck className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle className="text-2xl text-white">Admin Portal</CardTitle>
              <CardDescription className="text-slate-400">
                Access the Permit Queens admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="admin@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" 
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In as Admin"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
