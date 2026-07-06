import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, LogOut, User } from "lucide-react";
import { toast } from "sonner";

export function StoreAuthBar() {
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
    setPassword("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  if (userEmail) {
    return (
      <div className="flex items-center gap-2 eq-mono text-xs">
        <User className="h-3.5 w-3.5 eq-text-2" />
        <span className="eq-text-2 hidden sm:inline">{userEmail}</span>
        <button onClick={handleLogout} className="eq-btn eq-btn-ghost !py-1.5 !px-2.5">
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="flex items-center gap-1.5">
      <input
        type="email"
        required
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        className="h-8 w-32 sm:w-40 rounded border eq-hairline bg-background/60 px-2 eq-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <input
        type="password"
        required
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        className="h-8 w-24 sm:w-32 rounded border eq-hairline bg-background/60 px-2 eq-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button type="submit" disabled={loading} className="eq-btn eq-btn-primary !py-1.5 !px-2.5">
        <LogIn className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{loading ? "…" : "Sign In"}</span>
      </button>
    </form>
  );
}
