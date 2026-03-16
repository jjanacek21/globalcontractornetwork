import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ---- Types matching Supabase piq_ tables ----

export interface PIQOwner {
  id: string;
  name: string;
  owner_type: string | null;
  mailing_address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  company?: PIQCompany | null;
}

export interface PIQCompany {
  id: string;
  company_name: string | null;
  state_registered: string | null;
  registration_number: string | null;
  registered_agent: string | null;
  formation_date: string | null;
  status: string | null;
  sunbiz_url: string | null;
}

export interface PIQScore {
  roof_replacement_score: number | null;
  renovation_score: number | null;
  investment_score: number | null;
  overall_contractor_score: number | null;
}

export interface PIQBuildingComponent {
  id: string;
  component_type: string | null;
  material: string | null;
  install_year: number | null;
  estimated_life: number | null;
  condition: string | null;
}

export interface PIQPermit {
  id: string;
  permit_number: string | null;
  permit_type: string | null;
  description: string | null;
  contractor: string | null;
  estimated_cost: number | null;
  issue_date: string | null;
  status: string | null;
}

export interface PIQSale {
  id: string;
  sale_date: string | null;
  sale_price: number | null;
  buyer: string | null;
  seller: string | null;
  lender: string | null;
}

export interface PIQStormEvent {
  id: string;
  event_name: string | null;
  event_type: string | null;
  category: string | null;
  wind_speed: number | null;
  event_date: string | null;
  damage_reported: boolean | null;
  insurance_claims: number | null;
}

export interface PIQOpportunity {
  id: string;
  opportunity_type: string | null;
  description: string | null;
  priority: string | null;
}

export interface PIQViolation {
  id: string;
  violation_code: string | null;
  description: string | null;
  filed_date: string | null;
  status: string | null;
}

export interface PIQPropertySummary {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  property_type: string | null;
  building_sqft: number | null;
  year_built: number | null;
  stories: number | null;
  estimated_value: number | null;
  assessed_value: number | null;
  zoning: string | null;
  flood_zone: string | null;
  latitude: number | null;
  longitude: number | null;
  piq_property_scores: PIQScore[] | null;
  piq_property_ownership: { owner_id: string; piq_owners: PIQOwner }[] | null;
}

export interface PIQPropertyFull extends PIQPropertySummary {
  lot_sqft: number | null;
  latitude: number | null;
  longitude: number | null;
  parcel_id: string | null;
  construction_type: string | null;
  occupancy_status: string | null;
  property_manager: string | null;
  piq_building_components: PIQBuildingComponent[];
  piq_permits: PIQPermit[];
  piq_property_sales: PIQSale[];
  piq_storm_events: PIQStormEvent[];
  piq_contractor_opportunities: PIQOpportunity[];
  piq_code_violations: PIQViolation[];
}

// ---- Search Hook ----

export function usePropertyIQSearch(query: string) {
  return useQuery({
    queryKey: ["piq-search", query],
    queryFn: async () => {
      let q = supabase
        .from("piq_properties")
        .select(`
          id, address, city, state, zip, property_type, building_sqft, year_built, stories,
          estimated_value, assessed_value, zoning, flood_zone, latitude, longitude,
          piq_property_scores ( roof_replacement_score, renovation_score, investment_score, overall_contractor_score ),
          piq_property_ownership ( owner_id, piq_owners ( id, name, owner_type, phone, email, linkedin_url, facebook_url, mailing_address ) )
        `)
        .order("address");

      if (query.trim()) {
        const term = `%${query.trim()}%`;
        q = q.or(`address.ilike.${term},city.ilike.${term},state.ilike.${term}`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as PIQPropertySummary[];
    },
    enabled: true,
  });
}

// ---- Report Hook ----

export function usePropertyIQReport(id: string | undefined) {
  return useQuery({
    queryKey: ["piq-report", id],
    queryFn: async () => {
      if (!id) throw new Error("No property ID");
      const { data, error } = await supabase
        .from("piq_properties")
        .select(`
          *,
          piq_property_scores ( roof_replacement_score, renovation_score, investment_score, overall_contractor_score ),
          piq_property_ownership ( owner_id, piq_owners ( *, piq_companies (*) ) ),
          piq_building_components ( * ),
          piq_permits ( * ),
          piq_property_sales ( * ),
          piq_storm_events ( * ),
          piq_contractor_opportunities ( * ),
          piq_code_violations ( * )
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as PIQPropertyFull;
    },
    enabled: !!id,
  });
}

// ---- Save Property Mutation ----

export function useSaveProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, listName = "Default" }: { propertyId: string; listName?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if already saved
      const { data: existing } = await supabase
        .from("piq_saved_properties")
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", propertyId)
        .eq("list_name", listName)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("piq_saved_properties").delete().eq("id", existing.id);
        if (error) throw error;
        return { saved: false };
      }

      const { error } = await supabase.from("piq_saved_properties").insert({
        user_id: user.id,
        property_id: propertyId,
        list_name: listName,
      });
      if (error) throw error;
      return { saved: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["piq-saved"] });
      qc.invalidateQueries({ queryKey: ["piq-dashboard"] });
    },
  });
}

// ---- Dashboard Hook ----

export function usePropertyIQDashboard() {
  return useQuery({
    queryKey: ["piq-dashboard"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: saved, error } = await supabase
        .from("piq_saved_properties")
        .select(`
          id, list_name, created_at,
          piq_properties (
            id, address, city, state, zip, property_type, building_sqft, year_built,
            estimated_value, assessed_value, zoning, flood_zone,
            piq_property_scores ( roof_replacement_score, renovation_score, investment_score ),
            piq_property_ownership ( piq_owners ( name, owner_type ) )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { savedProperties: saved || [] };
    },
  });
}

// ---- ATTOM Lookup Mutation ----

export function useAttomLookup() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (address: string) => {
      const { data, error } = await supabase.functions.invoke('attom-property-lookup', {
        body: { address },
      });

      if (error) throw new Error(error.message || 'ATTOM lookup failed');
      if (!data?.success) throw new Error(data?.error || 'No property found');
      return data as { success: boolean; propertyId: string; source: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["piq-search"] });
      toast({
        title: data.source === 'existing' ? "Property Found" : "Property Retrieved",
        description: data.source === 'attom'
          ? "Live property data fetched from ATTOM and saved."
          : "Property already exists in database.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "ATTOM Lookup Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}

// ---- Enrich Property Mutation ----

export function useEnrichProperty() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      const { data, error } = await supabase.functions.invoke('enrich-property', {
        body: { property_id: propertyId },
      });

      if (error) throw new Error(error.message || 'Enrichment failed');
      if (!data?.success) throw new Error(data?.error || 'Enrichment failed');
      return data as { success: boolean; enriched: string[] };
    },
    onSuccess: (_data, propertyId) => {
      qc.invalidateQueries({ queryKey: ["piq-report", propertyId] });
    },
  });
}
