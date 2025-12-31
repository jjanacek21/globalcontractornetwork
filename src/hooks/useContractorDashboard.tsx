import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ContractorLead {
  id: string;
  contractor_id: string;
  project_id: string;
  status: string;
  quoted_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    service_type: string;
    property_address: string;
    city: string | null;
    state: string | null;
    ai_estimate_low: number | null;
    ai_estimate_high: number | null;
    status: string;
  } | null;
}

export interface ContractorJob {
  id: string;
  contractor_id: string;
  project_id: string | null;
  homeowner_name: string;
  homeowner_phone: string | null;
  homeowner_email: string | null;
  property_address: string;
  service_type: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  quoted_amount: number | null;
  collected_amount: number | null;
  job_details: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractorStats {
  totalLeads: number;
  newLeads: number;
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export const useContractorDashboard = () => {
  const [leads, setLeads] = useState<ContractorLead[]>([]);
  const [jobs, setJobs] = useState<ContractorJob[]>([]);
  const [stats, setStats] = useState<ContractorStats>({
    totalLeads: 0,
    newLeads: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [contractorProfileId, setContractorProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContractorProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("contractor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setContractorProfileId(data.id);
      return data.id;
    }
    return null;
  }, []);

  const fetchLeads = useCallback(async (contractorId: string) => {
    try {
      const { data, error } = await supabase
        .from("contractor_leads")
        .select(`
          *,
          project:homeowner_projects(
            id,
            service_type,
            property_address,
            city,
            state,
            ai_estimate_low,
            ai_estimate_high,
            status
          )
        `)
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads((data as ContractorLead[]) || []);
      return data as ContractorLead[];
    } catch (error: unknown) {
      console.error("Error fetching leads:", error);
      return [];
    }
  }, []);

  const fetchJobs = useCallback(async (contractorId: string) => {
    try {
      const { data, error } = await supabase
        .from("contractor_jobs")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs((data as ContractorJob[]) || []);
      return data as ContractorJob[];
    } catch (error: unknown) {
      console.error("Error fetching jobs:", error);
      return [];
    }
  }, []);

  const calculateStats = useCallback((leadsData: ContractorLead[], jobsData: ContractorJob[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newLeads = leadsData.filter(l => l.status === "new").length;
    const activeJobs = jobsData.filter(j => j.status === "in_progress" || j.status === "scheduled").length;
    const completedJobs = jobsData.filter(j => j.status === "completed").length;
    const totalRevenue = jobsData.reduce((sum, j) => sum + (j.collected_amount || 0), 0);
    const monthlyRevenue = jobsData
      .filter(j => j.status === "completed" && new Date(j.updated_at) >= startOfMonth)
      .reduce((sum, j) => sum + (j.collected_amount || 0), 0);

    setStats({
      totalLeads: leadsData.length,
      newLeads,
      activeJobs,
      completedJobs,
      totalRevenue,
      monthlyRevenue,
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const contractorId = await fetchContractorProfile();
    if (contractorId) {
      const [leadsData, jobsData] = await Promise.all([
        fetchLeads(contractorId),
        fetchJobs(contractorId),
      ]);
      calculateStats(leadsData, jobsData);
    }
    setLoading(false);
  }, [fetchContractorProfile, fetchLeads, fetchJobs, calculateStats]);

  const updateLeadStatus = async (leadId: string, status: string, quotedAmount?: number) => {
    try {
      const updateData: { status: string; quoted_amount?: number } = { status };
      if (quotedAmount !== undefined) {
        updateData.quoted_amount = quotedAmount;
      }

      const { error } = await supabase
        .from("contractor_leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;
      
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, status, quoted_amount: quotedAmount ?? l.quoted_amount } : l
      ));
      toast({ title: "Success", description: "Lead updated successfully" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update lead";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const createJob = async (jobData: Omit<ContractorJob, "id" | "contractor_id" | "created_at" | "updated_at">) => {
    if (!contractorProfileId) return null;

    try {
      const { data, error } = await supabase
        .from("contractor_jobs")
        .insert([{
          contractor_id: contractorProfileId,
          homeowner_name: jobData.homeowner_name,
          homeowner_phone: jobData.homeowner_phone,
          homeowner_email: jobData.homeowner_email,
          property_address: jobData.property_address,
          service_type: jobData.service_type,
          status: jobData.status,
          scheduled_date: jobData.scheduled_date,
          scheduled_time: jobData.scheduled_time,
          quoted_amount: jobData.quoted_amount,
          collected_amount: jobData.collected_amount,
          job_details: jobData.job_details,
          notes: jobData.notes,
          project_id: jobData.project_id,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setJobs(prev => [data as ContractorJob, ...prev]);
      toast({ title: "Success", description: "Job created successfully" });
      return data as ContractorJob;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create job";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      return null;
    }
  };

  const updateJobStatus = async (jobId: string, status: string, collectedAmount?: number) => {
    try {
      const updateData: { status: string; collected_amount?: number } = { status };
      if (collectedAmount !== undefined) {
        updateData.collected_amount = collectedAmount;
      }

      const { error } = await supabase
        .from("contractor_jobs")
        .update(updateData)
        .eq("id", jobId);

      if (error) throw error;
      
      setJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status, collected_amount: collectedAmount ?? j.collected_amount } : j
      ));
      toast({ title: "Success", description: "Job updated successfully" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update job";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    leads,
    jobs,
    stats,
    loading,
    contractorProfileId,
    loadData,
    updateLeadStatus,
    createJob,
    updateJobStatus,
  };
};
