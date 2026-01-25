import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PermitRequest {
  id: string;
  property_address: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service_type: string;
  status: string;
  pipeline_status: string;
  jurisdiction_county: string | null;
  permit_type: string | null;
  parcel_id: string | null;
  scope_description: string | null;
  structured_scope_json: Record<string, unknown>;
  valuation: number | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  license_numbers_json: Record<string, unknown>;
  expedited: boolean;
  after_hours: boolean;
  fee_estimate: number | null;
  fee_actual: number | null;
  payment_status: string;
  payment_link: string | null;
  missing_items_json: Record<string, unknown>;
  ai_analysis_json: Record<string, unknown>;
  complexity_tier: string;
  completion_percentage: number;
  packet_url: string | null;
  building_dept_id: string | null;
  contractor_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermitDocument {
  id: string;
  project_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  validation_status: string;
  validation_notes: string | null;
  extracted_text: string | null;
  ai_analysis_json: Record<string, unknown>;
  processing_status: string | null;
  extracted_data: Record<string, unknown> | null;
  fields_populated: string[] | null;
  created_at: string;
}

export interface JurisdictionRule {
  id: string;
  jurisdiction_name: string;
  jurisdiction_county: string;
  permit_type: string;
  required_fields_json: string[];
  required_documents_json: string[];
  common_rejection_reasons_json: string[];
  submission_method: string;
  portal_url: string | null;
  typical_turnaround_days: number;
  hvhz_required: boolean;
  noa_required: boolean;
  wind_mitigation_required: boolean;
  base_price: number;
  complexity_multiplier: Record<string, number>;
  notes: string | null;
}

export interface PricingTier {
  id: string;
  name: string;
  code: string;
  description: string;
  base_price: number;
  criteria_json: Record<string, unknown>;
  features_json: string[];
  turnaround_days: number;
}

export function usePermitRequest(permitId?: string) {
  const [permit, setPermit] = useState<PermitRequest | null>(null);
  const [documents, setDocuments] = useState<PermitDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchPermit = useCallback(async () => {
    if (!permitId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('permit_projects')
        .select('*')
        .eq('id', permitId)
        .single();

      if (error) throw error;
      setPermit(data as unknown as PermitRequest);
    } catch (error) {
      console.error('Error fetching permit:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permit request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [permitId, toast]);

  const fetchDocuments = useCallback(async () => {
    if (!permitId) return;

    try {
      const { data, error } = await supabase
        .from('permit_project_documents')
        .select('*')
        .eq('project_id', permitId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data as unknown as PermitDocument[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, [permitId]);

  useEffect(() => {
    fetchPermit();
    fetchDocuments();
  }, [fetchPermit, fetchDocuments]);

  const createPermit = async (data: Partial<PermitRequest>): Promise<string | null> => {
    setSaving(true);
    try {
      // Get current user and contractor profile ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabase
        .from('contractor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const insertData = {
        user_id: user.id,
        property_address: data.property_address || '',
        customer_name: data.customer_name || data.owner_name || '',
        customer_email: data.customer_email || data.owner_email,
        customer_phone: data.customer_phone || data.owner_phone,
        service_type: data.permit_type || 'roofing',
        status: 'pending',
        pipeline_status: 'intake',
        payment_status: 'unpaid',
        jurisdiction_county: data.jurisdiction_county,
        permit_type: data.permit_type,
        scope_description: data.scope_description,
        valuation: data.valuation,
        owner_name: data.owner_name,
        owner_email: data.owner_email,
        owner_phone: data.owner_phone,
        expedited: data.expedited || false,
        complexity_tier: data.complexity_tier || 'basic',
        contractor_profile_id: profile?.id || null,
      };

      const { data: newPermit, error } = await supabase
        .from('permit_projects')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permit request created',
      });

      return newPermit.id;
    } catch (error) {
      console.error('Error creating permit:', error);
      toast({
        title: 'Error',
        description: 'Failed to create permit request',
        variant: 'destructive',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updatePermit = async (updates: Partial<PermitRequest>): Promise<boolean> => {
    if (!permitId) return false;

    setSaving(true);
    try {
      // Only include fields that exist in the database
      const dbUpdates: Record<string, unknown> = {};
      const allowedFields = [
        'property_address', 'customer_name', 'customer_email', 'customer_phone',
        'service_type', 'status', 'pipeline_status', 'jurisdiction_county',
        'permit_type', 'scope_description', 'valuation', 'owner_name', 'owner_email',
        'owner_phone', 'expedited', 'after_hours', 'complexity_tier', 'fee_estimate',
        'payment_status', 'completion_percentage'
      ];
      
      for (const key of allowedFields) {
        if (key in updates) {
          dbUpdates[key] = updates[key as keyof PermitRequest];
        }
      }

      const { error } = await supabase
        .from('permit_projects')
        .update(dbUpdates)
        .eq('id', permitId);

      if (error) throw error;

      setPermit(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: 'Saved',
        description: 'Permit request updated',
      });
      return true;
    } catch (error) {
      console.error('Error updating permit:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permit request',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (
    file: File,
    documentType: string,
    documentName?: string
  ): Promise<boolean> => {
    if (!permitId) return false;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${permitId}/${documentType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('permit-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('permit-documents')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('permit_project_documents')
        .insert({
          project_id: permitId,
          document_type: documentType,
          file_name: documentName || file.name,
          file_path: publicUrl,
          validation_status: 'pending',
        });

      if (insertError) throw insertError;

      await fetchDocuments();
      toast({
        title: 'Uploaded',
        description: 'Document uploaded successfully',
      });
      return true;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('permit_project_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== documentId));
      toast({
        title: 'Deleted',
        description: 'Document removed',
      });
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    permit,
    documents,
    loading,
    saving,
    createPermit,
    updatePermit,
    uploadDocument,
    deleteDocument,
    refetch: fetchPermit,
    refetchDocuments: fetchDocuments,
  };
}

export function useJurisdictionRules() {
  const [rules, setRules] = useState<JurisdictionRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const { data, error } = await supabase
          .from('jurisdiction_rules')
          .select('*')
          .eq('is_active', true)
          .order('jurisdiction_county', { ascending: true });

        if (error) throw error;
        setRules(data as unknown as JurisdictionRule[]);
      } catch (error) {
        console.error('Error fetching jurisdiction rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  const getRulesForJurisdiction = (county: string, permitType: string): JurisdictionRule | null => {
    return rules.find(r => 
      r.jurisdiction_county === county && r.permit_type === permitType
    ) || null;
  };

  const getCounties = (): string[] => {
    return [...new Set(rules.map(r => r.jurisdiction_county))];
  };

  const getPermitTypes = (county?: string): string[] => {
    const filtered = county ? rules.filter(r => r.jurisdiction_county === county) : rules;
    return [...new Set(filtered.map(r => r.permit_type))];
  };

  return {
    rules,
    loading,
    getRulesForJurisdiction,
    getCounties,
    getPermitTypes,
  };
}

export function usePricingTiers() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const { data, error } = await supabase
          .from('permit_pricing_tiers')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setTiers(data as unknown as PricingTier[]);
      } catch (error) {
        console.error('Error fetching pricing tiers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTiers();
  }, []);

  const getTierByCode = (code: string): PricingTier | undefined => {
    return tiers.find(t => t.code === code);
  };

  return {
    tiers,
    loading,
    getTierByCode,
  };
}

export function useContractorPermits() {
  const [permits, setPermits] = useState<PermitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('contractor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('permit_projects')
          .select('*')
          .eq('contractor_profile_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPermits(data as unknown as PermitRequest[]);
      } catch (error) {
        console.error('Error fetching contractor permits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermits();
  }, []);

  return { permits, loading };
}
