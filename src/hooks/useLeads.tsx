import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export interface LeadWithDetails extends Lead {
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    primary_phone: string | null;
    email: string | null;
  };
  property?: {
    id: string;
    address_line1: string;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  assigned_rep?: {
    id: string;
    user_id: string;
    job_title: string | null;
  };
}

export const LEAD_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "contact_made", label: "Contact Made", color: "bg-cyan-500" },
  { value: "inspection_scheduled", label: "Inspection Scheduled", color: "bg-purple-500" },
  { value: "inspected", label: "Inspected", color: "bg-indigo-500" },
  { value: "estimate_sent", label: "Estimate Sent", color: "bg-amber-500" },
  { value: "negotiating", label: "Negotiating", color: "bg-orange-500" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-500" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-500" },
  { value: "no_deal", label: "No Deal", color: "bg-gray-500" },
];

export function useLeads(companyId?: string) {
  const [leads, setLeads] = useState<LeadWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("permit_leads")
        .select(`
          *,
          contact:contacts(id, first_name, last_name, primary_phone, email),
          property:properties(id, address_line1, city, state, zip),
          assigned_rep:company_members(id, user_id, job_title)
        `)
        .order("created_at", { ascending: false });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads((data as LeadWithDetails[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading leads",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createLead = async (lead: LeadInsert) => {
    try {
      const { data, error } = await supabase
        .from("permit_leads")
        .insert(lead)
        .select()
        .single();

      if (error) throw error;

      await fetchLeads();
      toast({ title: "Lead created successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating lead",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateLead = async (id: string, updates: LeadUpdate) => {
    try {
      const { data, error } = await supabase
        .from("permit_leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await fetchLeads();
      toast({ title: "Lead updated successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating lead",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateLeadStatus = async (id: string, status: Lead["status"]) => {
    const closedStatuses = ["closed_won", "closed_lost", "no_deal"];
    return updateLead(id, { 
      status,
      ...(closedStatuses.includes(status || "") 
        ? { closed_at: new Date().toISOString() } 
        : {})
    });
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from("permit_leads").delete().eq("id", id);

      if (error) throw error;

      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Lead deleted successfully" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting lead",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [companyId]);

  return {
    leads,
    isLoading,
    fetchLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
  };
}

export function useLead(leadId: string | null) {
  const [lead, setLead] = useState<LeadWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLead = async () => {
    if (!leadId) {
      setLead(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("permit_leads")
        .select(`
          *,
          contact:contacts(id, first_name, last_name, primary_phone, email),
          property:properties(id, address_line1, city, state, zip),
          assigned_rep:company_members(id, user_id, job_title)
        `)
        .eq("id", leadId)
        .single();

      if (error) throw error;
      setLead(data as LeadWithDetails);
    } catch (error: any) {
      toast({
        title: "Error loading lead",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  return { lead, isLoading, refetch: fetchLead };
}

export type { Lead, LeadInsert, LeadUpdate };
