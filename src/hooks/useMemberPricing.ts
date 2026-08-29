import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const MEMBER_DISCOUNT_PCT = 0.15;

/**
 * Network members (contractors / company users) get 15% off store pricing.
 * Homeowners and signed-out visitors pay list price.
 */
export function useMemberPricing() {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) { setIsMember(false); setLoading(false); }
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const role = profile?.role as string | undefined;
        const member = !!role && role !== "homeowner";
        if (mounted) { setIsMember(member); setLoading(false); }
      } catch {
        if (mounted) { setIsMember(false); setLoading(false); }
      }
    };

    check();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(check, 0);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return {
    isMember,
    loading,
    discountPct: isMember ? MEMBER_DISCOUNT_PCT : 0,
    memberPriceCents: (cents: number) =>
      isMember ? Math.round(cents * (1 - MEMBER_DISCOUNT_PCT)) : cents,
  };
}
