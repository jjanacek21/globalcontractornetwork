import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const startOfMonthAgo = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export function useOverviewStats(contractorId: string | null | undefined) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["referrals", "overview", contractorId],
    queryFn: async () => {
      const cid = contractorId!;
      const sinceMonth = new Date();
      sinceMonth.setDate(sinceMonth.getDate() - 30);

      const [payoutsRes, escrowRes, refsRes, poolRes, scoreRes, monthlyRes] = await Promise.all([
        supabase.from("payouts").select("net_amount, created_at").eq("contractor_id", cid).eq("direction", "credit"),
        supabase.from("payouts").select("net_amount").eq("contractor_id", cid).eq("direction", "credit").eq("status", "in_escrow"),
        supabase.from("referrals").select("id, referring_contractor_id, receiving_contractor_id, status").eq("status", "in_progress"),
        supabase.from("client_pool").select("id, invitation_status").eq("introducing_contractor_id", cid),
        supabase.from("contractor_scores").select("*").eq("contractor_id", cid).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("payouts").select("net_amount, type, created_at").eq("contractor_id", cid).eq("direction", "credit").gte("created_at", startOfMonthAgo(5)),
      ]);

      const lifetimeEarned = (payoutsRes.data ?? []).reduce((s, p) => s + Number(p.net_amount), 0);
      const thisMonth = (payoutsRes.data ?? []).filter(p => new Date(p.created_at) >= sinceMonth).reduce((s, p) => s + Number(p.net_amount), 0);
      const escrow = (escrowRes.data ?? []).reduce((s, p) => s + Number(p.net_amount), 0);
      const pendingRefs = (refsRes.data ?? []).filter(r => r.referring_contractor_id === cid || r.receiving_contractor_id === cid).length;
      const poolCount = poolRes.data?.length ?? 0;
      const poolActive = (poolRes.data ?? []).filter(c => c.invitation_status === "accepted").length;

      // 6-month buckets
      const buckets: Record<string, { month: string; bonuses: number; residuals: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        buckets[key] = { month: d.toLocaleString("en-US", { month: "short" }), bonuses: 0, residuals: 0 };
      }
      (monthlyRes.data ?? []).forEach(p => {
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!buckets[key]) return;
        if (p.type === "outbound_bounty") buckets[key].bonuses += Number(p.net_amount);
        else if (p.type === "residual") buckets[key].residuals += Number(p.net_amount);
      });

      return {
        lifetimeEarned,
        thisMonth,
        escrow,
        pendingRefs,
        poolCount,
        poolActive,
        score: scoreRes.data,
        chart: Object.values(buckets),
      };
    },
  });
}

export function useActivityFeed(contractorId: string | null | undefined) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["referrals", "activity", contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("contractor_id", contractorId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTopPartners(contractorId: string | null | undefined) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["referrals", "topPartners", contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("receiving_contractor_id, referrer_share, contractor_profiles!referrals_receiving_contractor_id_fkey(company_name, category)")
        .eq("referring_contractor_id", contractorId!)
        .eq("status", "won");
      if (error) throw error;
      const map = new Map<string, { id: string; company_name: string; category: string; total: number }>();
      (data ?? []).forEach((r: any) => {
        const cur = map.get(r.receiving_contractor_id) ?? {
          id: r.receiving_contractor_id,
          company_name: r.contractor_profiles?.company_name ?? "Unknown",
          category: r.contractor_profiles?.category ?? "",
          total: 0,
        };
        cur.total += Number(r.referrer_share ?? 0);
        map.set(r.receiving_contractor_id, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
    },
  });
}

export function usePartners(contractorId: string | null | undefined) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["referrals", "partners", contractorId],
    queryFn: async () => {
      // Eligibility relaxed: include directory-eligible OR verified contractors
      // so the partner picker is not gated to zero while onboarding ramps up.
      const { data: profiles, error } = await supabase
        .from("contractor_profiles")
        .select("id, company_name, category, service_area, is_directory_eligible, verification_status")
        .neq("id", contractorId!)
        .or("is_directory_eligible.eq.true,verification_status.eq.verified,verification_status.eq.pending");
      if (error) throw error;
      const ids = (profiles ?? []).map(p => p.id);
      if (ids.length === 0) return [];
      const [scoresRes, tiersRes] = await Promise.all([
        supabase.from("contractor_scores_public").select("*").in("contractor_id", ids),
        supabase.from("referral_partner_tiers").select("*").in("contractor_id", ids).eq("status", "active").order("min_contract_value"),
      ]);
      const scoreMap = new Map((scoresRes.data ?? []).map((s: any) => [s.contractor_id, s]));
      const tiersMap = new Map<string, any[]>();
      (tiersRes.data ?? []).forEach((t: any) => {
        if (!tiersMap.has(t.contractor_id)) tiersMap.set(t.contractor_id, []);
        tiersMap.get(t.contractor_id)!.push(t);
      });
      return (profiles ?? []).map(p => ({
        ...p,
        score: scoreMap.get(p.id),
        tiers: tiersMap.get(p.id) ?? [],
      }));
    },
  });
}

export function useBountyTiers(contractorId: string | null | undefined) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["referrals", "bountyTiers", contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_partner_tiers")
        .select("*")
        .eq("contractor_id", contractorId!)
        .order("trade").order("min_contract_value");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyClients(contractorId: string | null | undefined) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["referrals", "myClients", contractorId],
    queryFn: async () => {
      const { data: pool, error } = await supabase
        .from("client_pool")
        .select("*, gcn_customers(*)")
        .eq("introducing_contractor_id", contractorId!);
      if (error) throw error;
      const customerIds = (pool ?? []).map((c: any) => c.customer_id);
      if (customerIds.length === 0) return [];
      const [refsRes, residualsRes] = await Promise.all([
        supabase.from("referrals").select("customer_id, contract_value, status").in("customer_id", customerIds).eq("status", "won"),
        supabase.from("residuals").select("customer_id, residual_amount").in("customer_id", customerIds).eq("introducing_contractor_id", contractorId!),
      ]);
      const jobsByCust = new Map<string, { jobs: number; spent: number }>();
      (refsRes.data ?? []).forEach((r: any) => {
        const cur = jobsByCust.get(r.customer_id) ?? { jobs: 0, spent: 0 };
        cur.jobs += 1;
        cur.spent += Number(r.contract_value ?? 0);
        jobsByCust.set(r.customer_id, cur);
      });
      const residualsByCust = new Map<string, number>();
      (residualsRes.data ?? []).forEach((r: any) => {
        residualsByCust.set(r.customer_id, (residualsByCust.get(r.customer_id) ?? 0) + Number(r.residual_amount ?? 0));
      });
      return (pool ?? []).map((c: any) => {
        const j = jobsByCust.get(c.customer_id) ?? { jobs: 0, spent: 0 };
        return { ...c, jobs: j.jobs, spent: j.spent, residuals: residualsByCust.get(c.customer_id) ?? 0 };
      });
    },
  });
}

export function useReferralsSent(contractorId: string | null | undefined) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["referrals", "sent", contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*, gcn_customers(name, email), receiver:contractor_profiles!referrals_receiving_contractor_id_fkey(company_name)")
        .eq("referring_contractor_id", contractorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useReferralsReceived(contractorId: string | null | undefined) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["referrals", "received", contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*, gcn_customers(name, email), referrer:contractor_profiles!referrals_referring_contractor_id_fkey(company_name)")
        .eq("receiving_contractor_id", contractorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePayouts(contractorId: string | null | undefined) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["referrals", "payouts", contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .eq("contractor_id", contractorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const available = rows.filter(p => p.direction === "credit" && p.status === "available").reduce((s, p) => s + Number(p.net_amount), 0);
      const escrow = rows.filter(p => p.direction === "credit" && p.status === "in_escrow").reduce((s, p) => s + Number(p.net_amount), 0);
      const gcnCut = rows.reduce((s, p) => s + Number(p.gcn_fee), 0);
      return { rows, available, escrow, gcnCut };
    },
  });
}

// ============= Available broadcasts (open referrals first 3 to claim) =============

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

export function useAvailableBroadcasts(contractorId: string | null | undefined, trade?: string) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["referrals", "availableBroadcasts", contractorId, trade ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("referral_broadcasts")
        .select("*, gcn_customers(name, property_address), referrer:contractor_profiles!referral_broadcasts_referring_contractor_id_fkey(company_name)")
        .eq("status", "open")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (trade && trade !== "all") q = q.eq("trade", trade);
      const { data, error } = await q;
      if (error) throw error;
      const ids = (data ?? []).map((b: any) => b.id);
      if (ids.length === 0) return [];
      const { data: claims } = await supabase
        .from("referral_broadcast_claims")
        .select("broadcast_id, contractor_id")
        .in("broadcast_id", ids);
      const counts = new Map<string, { count: number; mine: boolean }>();
      (claims ?? []).forEach((c: any) => {
        const cur = counts.get(c.broadcast_id) ?? { count: 0, mine: false };
        cur.count += 1;
        if (c.contractor_id === contractorId) cur.mine = true;
        counts.set(c.broadcast_id, cur);
      });
      return (data ?? [])
        .map((b: any) => {
          const c = counts.get(b.id) ?? { count: 0, mine: false };
          return { ...b, claim_count: c.count, claimed_by_me: c.mine, claims_remaining: Math.max(0, b.max_claims - c.count) };
        })
        .filter((b: any) => b.referring_contractor_id !== contractorId)
        .filter((b: any) => b.claims_remaining > 0 || b.claimed_by_me);
    },
  });
}

export function useClaimBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ broadcastId, contractorId }: { broadcastId: string; contractorId: string }) => {
      const { error } = await supabase
        .from("referral_broadcast_claims")
        .insert({ broadcast_id: broadcastId, contractor_id: contractorId, message_sent_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referrals", "availableBroadcasts"] });
    },
  });
}
