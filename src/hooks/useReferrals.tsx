import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Referral {
  id: string;
  referring_contractor_id: string;
  referred_customer_name: string;
  referred_customer_email: string | null;
  referred_customer_phone: string | null;
  referred_service_type: string;
  property_address: string;
  referral_source_context: string | null;
  notes: string | null;
  status: string;
  assigned_contractor_id: string | null;
  job_amount: number | null;
  referral_fee_percentage: number | null;
  payout_amount: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  paid_at: string | null;
}

export interface ReferralStats {
  totalSent: number;
  completed: number;
  totalEarnings: number;
}

export interface CreateReferralData {
  referred_customer_name: string;
  referred_customer_email?: string;
  referred_customer_phone?: string;
  referred_service_type: string;
  property_address: string;
  referral_source_context?: string;
  notes?: string;
}

export const useReferrals = (contractorId?: string) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({ totalSent: 0, completed: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReferrals = async () => {
    if (!contractorId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("contractor_referrals")
        .select("*")
        .eq("referring_contractor_id", contractorId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const referralData = data || [];
      setReferrals(referralData);

      // Calculate stats
      const totalSent = referralData.length;
      const completed = referralData.filter(r => r.status === "completed" || r.status === "paid").length;
      const totalEarnings = referralData
        .filter(r => r.status === "paid" && r.payout_amount)
        .reduce((sum, r) => sum + (r.payout_amount || 0), 0);

      setStats({ totalSent, completed, totalEarnings });
    } catch (error: any) {
      console.error("Error fetching referrals:", error);
      toast({
        title: "Error",
        description: "Failed to load referrals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createReferral = async (data: CreateReferralData) => {
    if (!contractorId) {
      toast({
        title: "Error",
        description: "You must be a contractor to submit referrals",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase.from("contractor_referrals").insert({
        referring_contractor_id: contractorId,
        ...data,
      });

      if (error) throw error;

      toast({
        title: "Referral Submitted",
        description: "Your referral has been submitted successfully!",
      });

      await fetchReferrals();
      return true;
    } catch (error: any) {
      console.error("Error creating referral:", error);
      toast({
        title: "Error",
        description: "Failed to submit referral",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [contractorId]);

  // Real-time subscription for updates
  useEffect(() => {
    if (!contractorId) return;

    const channel = supabase
      .channel("referrals-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contractor_referrals",
          filter: `referring_contractor_id=eq.${contractorId}`,
        },
        () => {
          fetchReferrals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contractorId]);

  return {
    referrals,
    stats,
    loading,
    createReferral,
    refetch: fetchReferrals,
  };
};

// Admin hook for managing all referrals
export const useAdminReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from("contractor_referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error: any) {
      console.error("Error fetching all referrals:", error);
      toast({
        title: "Error",
        description: "Failed to load referrals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReferral = async (id: string, updates: Partial<Referral>) => {
    try {
      const { error } = await supabase
        .from("contractor_referrals")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Referral Updated",
        description: "Referral has been updated successfully",
      });

      await fetchAllReferrals();
      return true;
    } catch (error: any) {
      console.error("Error updating referral:", error);
      toast({
        title: "Error",
        description: "Failed to update referral",
        variant: "destructive",
      });
      return false;
    }
  };

  const markAsPaid = async (id: string, payoutAmount: number) => {
    return updateReferral(id, {
      status: "paid",
      payout_amount: payoutAmount,
      paid_at: new Date().toISOString(),
    });
  };

  useEffect(() => {
    fetchAllReferrals();
  }, []);

  return {
    referrals,
    loading,
    updateReferral,
    markAsPaid,
    refetch: fetchAllReferrals,
  };
};
