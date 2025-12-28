import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SocialAccessGuardProps {
  children: ReactNode;
}

export const SocialAccessGuard = ({ children }: SocialAccessGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/contractor/auth");
          return;
        }

        // Check if user is a super admin - they have access to everything
        const { data: superAdmin } = await supabase
          .from("super_admins")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (superAdmin) {
          // Super admins have full access
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // For non-super-admins, check contractor profile
        const { data: profile } = await supabase
          .from("contractor_profiles")
          .select("verification_status, social_access_approved")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profile) {
          // No contractor profile, redirect to pending with state
          navigate("/social/pending", { state: { reason: "no_profile" } });
          return;
        }

        if (profile.verification_status !== 'approved' || !profile.social_access_approved) {
          // Not approved for social access
          navigate("/social/pending");
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Error checking access:", error);
        navigate("/contractor/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
};
