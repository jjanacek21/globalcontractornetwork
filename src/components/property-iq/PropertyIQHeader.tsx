import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Search, LayoutDashboard, LogOut, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const PropertyIQHeader = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/property-iq");
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/property-iq" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">PropertyIQ</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/property-iq/search">
            <Button variant="ghost" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </Link>
          {user ? (
            <>
              <Link to="/property-iq/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/property-iq/auth">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link to="/property-iq/auth">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
