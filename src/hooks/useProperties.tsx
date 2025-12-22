import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];
type InsuranceProfile = Database["public"]["Tables"]["insurance_profiles"]["Row"];
type InsuranceProfileInsert = Database["public"]["Tables"]["insurance_profiles"]["Insert"];
type InsuranceProfileUpdate = Database["public"]["Tables"]["insurance_profiles"]["Update"];

export interface PropertyWithInsurance extends Property {
  insurance_profile?: InsuranceProfile | null;
}

export function useProperties(contactId?: string) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (contactId) {
        query = query.eq("contact_id", contactId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading properties",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProperty = async (property: PropertyInsert) => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .insert(property)
        .select()
        .single();

      if (error) throw error;

      setProperties((prev) => [data, ...prev]);
      toast({ title: "Property created successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating property",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateProperty = async (id: string, updates: PropertyUpdate) => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      );
      toast({ title: "Property updated successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating property",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) throw error;

      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Property deleted successfully" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting property",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [contactId]);

  return {
    properties,
    isLoading,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };
}

export function useInsuranceProfile(propertyId: string | null) {
  const [profile, setProfile] = useState<InsuranceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!propertyId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("insurance_profiles")
        .select("*")
        .eq("property_id", propertyId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error loading insurance profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (data: InsuranceProfileUpdate) => {
    if (!propertyId) return null;

    try {
      if (profile) {
        const { data: updated, error } = await supabase
          .from("insurance_profiles")
          .update(data)
          .eq("id", profile.id)
          .select()
          .single();

        if (error) throw error;
        setProfile(updated);
        toast({ title: "Insurance profile updated" });
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from("insurance_profiles")
          .insert({ ...data, property_id: propertyId } as InsuranceProfileInsert)
          .select()
          .single();

        if (error) throw error;
        setProfile(created);
        toast({ title: "Insurance profile created" });
        return created;
      }
    } catch (error: any) {
      toast({
        title: "Error saving insurance profile",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [propertyId]);

  return { profile, isLoading, refetch: fetchProfile, saveProfile };
}

export type { Property, PropertyInsert, InsuranceProfile };
