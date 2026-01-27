import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PriorPermitData {
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  valuation: number | null;
  permit_type: string | null;
  created_at: string | null;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

export interface ClientReference {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  project_type?: string;
  testimonial?: string;
}

export interface GalleryImage {
  url: string;
  caption?: string;
  project_type?: string;
}

export interface ContractorProfile {
  id: string;
  user_id: string | null;
  company_name: string;
  category: string;
  description: string | null;
  bio_short: string | null;
  bio_long: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  banner_image_url: string | null;
  is_verified: boolean | null;
  verification_status: string | null;
  subscription_status: string | null;
  service_area: string[] | null;
  secondary_trades: string[] | null;
  average_rating: number | null;
  review_count: number | null;
  price_tier: string | null;
  availability_days: number | null;
  social_links: SocialLinks | null;
  google_business_url: string | null;
  services_offered: string[] | null;
  client_references: ClientReference[] | null;
  profile_gallery: GalleryImage[] | null;
  license_number: string | null;
  license_state: string | null;
  license_expiration: string | null;
  insurance_info: Record<string, unknown> | null;
}

export function useContractorProfile(userId: string | null) {
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      // Parse JSON fields with proper type coercion
      const parsed = {
        ...data,
        social_links: data.social_links as unknown as SocialLinks | null,
        client_references: data.client_references as unknown as ClientReference[] | null,
        profile_gallery: data.profile_gallery as unknown as GalleryImage[] | null,
      };
      
      setProfile(parsed as ContractorProfile);
    } catch (error) {
      console.error('Error fetching contractor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<ContractorProfile>): Promise<boolean> => {
    if (!profile) return false;
    
    setSaving(true);
    try {
      // Cast updates to unknown first for Supabase compatibility
      const { error } = await supabase
        .from('contractor_profiles')
        .update(updates as unknown as Record<string, unknown>)
        .eq('id', profile.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'banner' | 'gallery'): Promise<string | null> => {
    if (!profile) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}/${type}-${Date.now()}.${fileExt}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('social-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('social-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const addGalleryImage = async (file: File, caption?: string, projectType?: string): Promise<boolean> => {
    const url = await uploadImage(file, 'gallery');
    if (!url) return false;

    const newGallery = [...(profile?.profile_gallery || []), { url, caption, project_type: projectType }];
    return updateProfile({ profile_gallery: newGallery });
  };

  const removeGalleryImage = async (index: number): Promise<boolean> => {
    const newGallery = [...(profile?.profile_gallery || [])];
    newGallery.splice(index, 1);
    return updateProfile({ profile_gallery: newGallery });
  };

  const addClientReference = async (reference: ClientReference): Promise<boolean> => {
    const newRefs = [...(profile?.client_references || []), reference];
    return updateProfile({ client_references: newRefs });
  };

  const removeClientReference = async (index: number): Promise<boolean> => {
    const newRefs = [...(profile?.client_references || [])];
    newRefs.splice(index, 1);
    return updateProfile({ client_references: newRefs });
  };

  // Lookup prior permit data for an address (for auto-fill)
  const lookupPriorPermit = useCallback(async (address: string): Promise<PriorPermitData | null> => {
    if (!address || address.length < 5) return null;
    
    try {
      // Normalize address for matching
      const normalizedAddress = address.toLowerCase().trim();
      
      const { data, error } = await supabase
        .from('permit_projects')
        .select('owner_name, owner_email, owner_phone, valuation, permit_type, created_at')
        .ilike('property_address', `%${normalizedAddress}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error looking up prior permit:', error);
        return null;
      }
      
      return data as PriorPermitData | null;
    } catch (error) {
      console.error('Prior permit lookup error:', error);
      return null;
    }
  }, []);

  return {
    profile,
    loading,
    saving,
    updateProfile,
    uploadImage,
    addGalleryImage,
    removeGalleryImage,
    addClientReference,
    removeClientReference,
    refetch: fetchProfile,
    lookupPriorPermit
  };
}
