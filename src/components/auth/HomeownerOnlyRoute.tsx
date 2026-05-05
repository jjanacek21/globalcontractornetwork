import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HomeownerOnlyRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Restricts access to property owners (profiles.role === 'homeowner').
 * Super admins bypass the check.
 */
export const HomeownerOnlyRoute = ({
  children,
  redirectTo = "/auth",
}: HomeownerOnlyRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) {
          setRedirect(redirectTo);
          setLoading(false);
        }
        return;
      }

      // Super admin bypass
      const { data: superAdmin } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (superAdmin) {
        if (!cancelled) {
          setAllowed(true);
          setLoading(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profile?.role === "homeowner") {
        setAllowed(true);
      } else {
        toast.error("Instant Quote is available to property owners only.");
        setRedirect("/member/dashboard");
      }
      setLoading(false);
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (redirect) return <Navigate to={redirect} replace />;
  if (!allowed) return <Navigate to="/" replace />;
  return <>{children}</>;
};
