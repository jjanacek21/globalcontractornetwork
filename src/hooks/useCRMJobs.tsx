import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CRMJob {
  id: string;
  company_id: string | null;
  contact_id: string | null;
  property_id: string | null;
  lead_id: string | null;
  assigned_rep_id: string | null;
  created_by: string | null;
  job_number: string | null;
  title: string;
  description: string | null;
  stage: string;
  priority: string | null;
  job_type: string | null;
  contract_amount: number | null;
  collected_amount: number | null;
  scheduled_date: string | null;
  start_date: string | null;
  completion_date: string | null;
  notes: string | null;
  tags: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  contact?: { first_name: string; last_name: string; primary_phone: string | null; email: string | null };
  property?: { address_line1: string; city: string | null; state: string | null };
}

export const JOB_STAGES = [
  { value: "new_lead", label: "New Lead", color: "bg-blue-500" },
  { value: "inspection", label: "Inspection", color: "bg-cyan-500" },
  { value: "estimate", label: "Estimate", color: "bg-amber-500" },
  { value: "contract_signed", label: "Contract Signed", color: "bg-purple-500" },
  { value: "permit", label: "Permit", color: "bg-indigo-500" },
  { value: "material_order", label: "Material Order", color: "bg-orange-500" },
  { value: "scheduled", label: "Scheduled", color: "bg-teal-500" },
  { value: "in_progress", label: "In Progress", color: "bg-primary" },
  { value: "quality_check", label: "Quality Check", color: "bg-emerald-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" },
  { value: "invoiced", label: "Invoiced", color: "bg-green-700" },
];

export function useCRMJobs() {
  const [jobs, setJobs] = useState<CRMJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("crm_jobs")
        .select(`
          *,
          contact:contacts(first_name, last_name, primary_phone, email),
          property:properties(address_line1, city, state)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs((data as CRMJob[]) || []);
    } catch (error: any) {
      toast({ title: "Error loading jobs", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const createJob = async (job: Partial<CRMJob>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jobNumber = `JOB-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await supabase
        .from("crm_jobs")
        .insert({ ...job, job_number: jobNumber, created_by: session?.user?.id } as any)
        .select()
        .single();

      if (error) throw error;
      await fetchJobs();
      toast({ title: "Job created successfully" });
      return data;
    } catch (error: any) {
      toast({ title: "Error creating job", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateJob = async (id: string, updates: Partial<CRMJob>) => {
    try {
      const { error } = await supabase.from("crm_jobs").update(updates as any).eq("id", id);
      if (error) throw error;
      await fetchJobs();
      toast({ title: "Job updated" });
    } catch (error: any) {
      toast({ title: "Error updating job", description: error.message, variant: "destructive" });
    }
  };

  const deleteJob = async (id: string) => {
    try {
      const { error } = await supabase.from("crm_jobs").delete().eq("id", id);
      if (error) throw error;
      setJobs(prev => prev.filter(j => j.id !== id));
      toast({ title: "Job deleted" });
    } catch (error: any) {
      toast({ title: "Error deleting job", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  return { jobs, isLoading, fetchJobs, createJob, updateJob, deleteJob };
}
