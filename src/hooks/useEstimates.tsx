import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Estimate = Database["public"]["Tables"]["estimates"]["Row"];
type EstimateInsert = Database["public"]["Tables"]["estimates"]["Insert"];
type EstimateUpdate = Database["public"]["Tables"]["estimates"]["Update"];
type EstimateLineItem = Database["public"]["Tables"]["estimate_line_items"]["Row"];
type EstimateLineItemInsert = Database["public"]["Tables"]["estimate_line_items"]["Insert"];

export interface EstimateWithDetails extends Estimate {
  customer?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  line_items?: EstimateLineItem[];
}

export const ESTIMATE_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-500" },
  { value: "sent", label: "Sent", color: "bg-blue-500" },
  { value: "viewed", label: "Viewed", color: "bg-cyan-500" },
  { value: "accepted", label: "Accepted", color: "bg-green-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
  { value: "expired", label: "Expired", color: "bg-amber-500" },
];

export function useEstimates() {
  const [estimates, setEstimates] = useState<EstimateWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEstimates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("estimates")
        .select(`
          *,
          customer:customers(id, name, email, phone, address)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEstimates((data as EstimateWithDetails[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading estimates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createEstimate = async (estimate: EstimateInsert) => {
    try {
      // Generate estimate number
      const estimateNumber = `EST-${Date.now().toString(36).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from("estimates")
        .insert({ ...estimate, estimate_number: estimateNumber })
        .select()
        .single();

      if (error) throw error;

      await fetchEstimates();
      toast({ title: "Estimate created successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating estimate",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEstimate = async (id: string, updates: EstimateUpdate) => {
    try {
      const { data, error } = await supabase
        .from("estimates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await fetchEstimates();
      toast({ title: "Estimate updated successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating estimate",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEstimate = async (id: string) => {
    try {
      const { error } = await supabase.from("estimates").delete().eq("id", id);

      if (error) throw error;

      setEstimates((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Estimate deleted successfully" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting estimate",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  return {
    estimates,
    isLoading,
    fetchEstimates,
    createEstimate,
    updateEstimate,
    deleteEstimate,
  };
}

export function useEstimate(estimateId: string | null) {
  const [estimate, setEstimate] = useState<EstimateWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEstimate = async () => {
    if (!estimateId) {
      setEstimate(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: estimateData, error: estimateError } = await supabase
        .from("estimates")
        .select(`
          *,
          customer:customers(id, name, email, phone, address)
        `)
        .eq("id", estimateId)
        .single();

      if (estimateError) throw estimateError;

      const { data: lineItems } = await supabase
        .from("estimate_line_items")
        .select("*")
        .eq("estimate_id", estimateId)
        .order("sort_order", { ascending: true });

      setEstimate({
        ...estimateData,
        line_items: lineItems || [],
      } as EstimateWithDetails);
    } catch (error: any) {
      toast({
        title: "Error loading estimate",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimate();
  }, [estimateId]);

  return { estimate, isLoading, refetch: fetchEstimate };
}

export function useEstimateLineItems(estimateId: string | null) {
  const { toast } = useToast();

  const addLineItem = async (item: EstimateLineItemInsert) => {
    try {
      const { data, error } = await supabase
        .from("estimate_line_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Error adding line item",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateLineItem = async (id: string, updates: Partial<EstimateLineItem>) => {
    try {
      const { data, error } = await supabase
        .from("estimate_line_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating line item",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteLineItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("estimate_line_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting line item",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return { addLineItem, updateLineItem, deleteLineItem };
}

export type { Estimate, EstimateInsert, EstimateUpdate, EstimateLineItem };
