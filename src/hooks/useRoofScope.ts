import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RSCompanyProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  license_number: string | null;
  service_area: string[] | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  tagline: string | null;
  default_labor_rate: number | null;
  default_markup_percent: number;
  default_waste_factor: number;
  preferred_units: string;
  default_terms: string | null;
  default_disclaimer: string | null;
  tax_rate: number;
  onboarding_completed: boolean;
}

export interface RSCustomer {
  id: string;
  company_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  property_type: string | null;
  notes: string | null;
}

export interface RSEstimate {
  id: string;
  company_id: string;
  customer_id: string | null;
  estimate_number: string;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  status: string;
  selected_tier: string;
  subtotal: number;
  tax_amount: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
  customer?: RSCustomer | null;
}

export function useRSCompany() {
  const [company, setCompany] = useState<RSCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompany = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("rs_company_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      toast({ title: "Error loading company profile", description: error.message, variant: "destructive" });
    }
    setCompany(data as RSCompanyProfile | null);
    setLoading(false);
  }, []);

  const createCompany = async (profile: Partial<RSCompanyProfile>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from("rs_company_profiles")
      .insert({ ...profile, user_id: session.user.id } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating company", description: error.message, variant: "destructive" });
      return null;
    }
    setCompany(data as RSCompanyProfile);
    return data;
  };

  const updateCompany = async (updates: Partial<RSCompanyProfile>) => {
    if (!company) return null;
    const { data, error } = await supabase
      .from("rs_company_profiles")
      .update(updates as any)
      .eq("id", company.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error updating company", description: error.message, variant: "destructive" });
      return null;
    }
    setCompany(data as RSCompanyProfile);
    toast({ title: "Company profile updated" });
    return data;
  };

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  return { company, loading, createCompany, updateCompany, refetch: fetchCompany };
}

export function useRSCustomers(companyId: string | undefined) {
  const [customers, setCustomers] = useState<RSCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("rs_customers")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) toast({ title: "Error loading customers", description: error.message, variant: "destructive" });
    setCustomers((data as RSCustomer[]) || []);
    setLoading(false);
  }, [companyId]);

  const addCustomer = async (customer: Partial<RSCustomer>) => {
    if (!companyId) return null;
    const { data, error } = await supabase
      .from("rs_customers")
      .insert({ ...customer, company_id: companyId } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Error adding customer", description: error.message, variant: "destructive" });
      return null;
    }
    await fetchCustomers();
    toast({ title: "Customer added" });
    return data;
  };

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return { customers, loading, addCustomer, refetch: fetchCustomers };
}

export function useRSEstimates(companyId: string | undefined) {
  const [estimates, setEstimates] = useState<RSEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEstimates = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("rs_estimates")
      .select("*, customer:rs_customers(*)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) toast({ title: "Error loading estimates", description: error.message, variant: "destructive" });
    setEstimates((data as any[]) || []);
    setLoading(false);
  }, [companyId]);

  const deleteEstimate = async (id: string) => {
    const { error } = await supabase.from("rs_estimates").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting estimate", description: error.message, variant: "destructive" });
      return false;
    }
    setEstimates(prev => prev.filter(e => e.id !== id));
    toast({ title: "Estimate deleted" });
    return true;
  };

  useEffect(() => { fetchEstimates(); }, [fetchEstimates]);

  return { estimates, loading, deleteEstimate, refetch: fetchEstimates };
}

export function useRSPricingRules() {
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("rs_pricing_rules").select("*").then(({ data }) => {
      setRules(data || []);
    });
  }, []);

  const getPrice = (region: string, roofType: string, tier: "good" | "better" | "best") => {
    const rule = rules.find(r => r.region === region && r.roof_type === roofType);
    if (!rule) return null;
    if (tier === "good") return rule.price_low;
    if (tier === "better") return rule.price_mid;
    return rule.price_high;
  };

  return { rules, getPrice };
}
