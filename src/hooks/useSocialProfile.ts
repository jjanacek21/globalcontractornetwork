import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SocialProfile {
  id: string;
  user_id: string | null;
  company_name: string;
  category: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  bio_short: string | null;
  bio_long: string | null;
  secondary_trades: string[] | null;
  service_areas: any | null;
  license_number: string | null;
  license_state: string | null;
  license_expiration: string | null;
  insurance_info: any | null;
  social_links: any | null;
  logo_url: string | null;
  banner_image_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  verification_status: string | null;
  social_access_approved: boolean | null;
  created_at: string | null;
}

export const useSocialProfile = () => {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSocialAccess, setHasSocialAccess] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as SocialProfile);
        setHasSocialAccess(
          data.verification_status === 'approved' && 
          data.social_access_approved === true
        );
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<SocialProfile>) => {
    if (!profile) return false;

    try {
      const { error } = await supabase
        .from("contractor_profiles")
        .update(updates)
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      toast({ title: "Profile updated successfully" });
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Failed to update profile", variant: "destructive" });
      return false;
    }
  };

  const getProfileById = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();

      if (error) throw error;
      return data as SocialProfile | null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    hasSocialAccess,
    updateProfile,
    getProfileById,
    refetch: fetchProfile,
  };
};
