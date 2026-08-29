import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsEquipmentAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (mounted) { setIsAdmin(false); setLoading(false); }
        return;
      }
      const [{ data: roles }, { data: superAdmin }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin"),
        supabase
          .from("super_admins")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle(),
      ]);
      if (mounted) {
        setIsAdmin(!!superAdmin || (roles ?? []).length > 0);
        setLoading(false);
      }

    })();
    return () => { mounted = false; };
  }, []);

  return { isAdmin, loading };
}
