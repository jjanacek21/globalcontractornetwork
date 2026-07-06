import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useIsEquipmentAdmin } from "@/hooks/useIsEquipmentAdmin";

export function StoreAuthBar() {
  const navigate = useNavigate();
  const { isAdmin } = useIsEquipmentAdmin();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    setOpen(false);
    setPassword("");
    // Give role check a beat then route admins to the dashboard
    setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (data) navigate("/equipment/admin");
    }, 200);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  if (userEmail) {
    return (
      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            onClick={() => navigate("/equipment/admin")}
            className="eq-btn eq-btn-primary !py-2 !px-3"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline eq-mono text-xs">Admin</span>
          </button>
        )}
        <button onClick={handleLogout} className="eq-btn eq-btn-ghost !py-2 !px-3">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline eq-mono text-xs">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="eq-btn eq-btn-ghost !py-2 !px-3"
      >
        <LogIn className="h-4 w-4" />
        <span className="eq-mono text-xs">Login</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in</DialogTitle>
            <DialogDescription>
              Admin sign-in for The GCN Store.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="eq-mono text-xs uppercase eq-text-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                className="w-full h-11 rounded-md border eq-hairline bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="eq-mono text-xs uppercase eq-text-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full h-11 rounded-md border eq-hairline bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="eq-btn eq-btn-primary w-full !py-3 justify-center"
            >
              <LogIn className="h-4 w-4" />
              <span className="eq-mono text-xs uppercase">
                {loading ? "Signing in…" : "Sign In"}
              </span>
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
