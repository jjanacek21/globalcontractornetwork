import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Inspection = Database["public"]["Tables"]["inspections"]["Row"];
type InspectionInsert = Database["public"]["Tables"]["inspections"]["Insert"];
type InspectionUpdate = Database["public"]["Tables"]["inspections"]["Update"];

export interface InspectionWithDetails extends Inspection {
  lead?: {
    id: string;
    status: string;
    contact?: {
      first_name: string;
      last_name: string;
    };
  };
  property?: {
    address_line1: string;
    city: string | null;
    state: string | null;
  };
  inspector?: {
    id: string;
    user_id: string;
  };
}

export const ROOF_TYPES = [
  { value: "shingle", label: "Shingle" },
  { value: "tile", label: "Tile" },
  { value: "metal", label: "Metal" },
  { value: "flat", label: "Flat" },
  { value: "coating_candidate", label: "Coating Candidate" },
  { value: "other", label: "Other" },
];

export const DAMAGE_TYPES = [
  "Hail",
  "Wind",
  "Leak",
  "Ponding",
  "Rust",
  "Cracking",
  "Missing Shingles",
  "Storm Damage",
  "Age Deterioration",
  "Other",
];

export const RECOMMENDATIONS = [
  { value: "repair", label: "Repair" },
  { value: "partial_replacement", label: "Partial Replacement" },
  { value: "full_replacement", label: "Full Replacement" },
  { value: "coating", label: "Coating" },
  { value: "no_action", label: "No Action Required" },
];

export function useInspections(leadId?: string) {
  const [inspections, setInspections] = useState<InspectionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInspections = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("inspections")
        .select(`
          *,
          lead:leads(id, status, contact:contacts(first_name, last_name)),
          property:properties(address_line1, city, state),
          inspector:company_members(id, user_id)
        `)
        .order("scheduled_at", { ascending: true });

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInspections((data as InspectionWithDetails[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading inspections",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createInspection = async (inspection: InspectionInsert) => {
    try {
      const { data, error } = await supabase
        .from("inspections")
        .insert(inspection)
        .select()
        .single();

      if (error) throw error;

      await fetchInspections();
      toast({ title: "Inspection scheduled successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error scheduling inspection",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateInspection = async (id: string, updates: InspectionUpdate) => {
    try {
      const { data, error } = await supabase
        .from("inspections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await fetchInspections();
      toast({ title: "Inspection updated successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating inspection",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const completeInspection = async (
    id: string,
    data: {
      roof_type: Inspection["roof_type"];
      damage_types: Inspection["damage_types"];
      summary: string;
      recommendation: Inspection["recommendation"];
    }
  ) => {
    return updateInspection(id, {
      ...data,
      completed_at: new Date().toISOString(),
    });
  };

  useEffect(() => {
    fetchInspections();
  }, [leadId]);

  return {
    inspections,
    isLoading,
    fetchInspections,
    createInspection,
    updateInspection,
    completeInspection,
  };
}

export type { Inspection, InspectionInsert };
