import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentContractor() {
  return useQuery({
    queryKey: ["referrals", "currentContractor"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("contractor_profiles")
        .select("id, user_id, company_name, category, service_area, email, phone, average_rating, review_count, verification_status")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
