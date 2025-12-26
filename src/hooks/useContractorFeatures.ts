import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContractorFeature {
  feature_name: string;
  is_approved: boolean;
  approved_at: string | null;
}

export const AVAILABLE_FEATURES = [
  { key: 'directory_listing', label: 'Directory Listing', description: 'Get listed in the public contractor directory', path: '/directory' },
  { key: 'supplement_kings', label: 'Supplement Kings', description: 'Access insurance supplement tools', path: '/supplement-kings/contractor' },
  { key: 'permit_queens', label: 'Permit Queens', description: 'Access permit expediting dashboard', path: '/permit-queens/dashboard' },
  { key: 'crm_access', label: 'CRM Access', description: 'Full lead management and CRM tools', path: '/lead-pipeline' },
  { key: 'presentations', label: 'Presentations', description: 'Sales presentation tools', path: '/presentations' },
  { key: 'field_map', label: 'Field Map', description: 'Satellite measurement tools', path: '/field-map' },
  { key: 'learning_platform', label: 'Learning Platform', description: 'Training courses access', path: '/learning' },
  { key: 'store_discounts', label: 'Store Discounts', description: 'Wholesale pricing on merchandise', path: '/store' },
] as const;

export type FeatureKey = typeof AVAILABLE_FEATURES[number]['key'];

export function useContractorFeatures() {
  const [features, setFeatures] = useState<ContractorFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractorId, setContractorId] = useState<string | null>(null);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get contractor profile
      const { data: contractor } = await supabase
        .from('contractor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!contractor) {
        setLoading(false);
        return;
      }

      setContractorId(contractor.id);

      // Get feature access
      const { data: featureData } = await supabase
        .from('contractor_feature_access')
        .select('feature_name, is_approved, approved_at')
        .eq('contractor_id', contractor.id);

      setFeatures(featureData || []);
    } catch (error) {
      console.error('Error loading contractor features:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (featureKey: FeatureKey): boolean => {
    const feature = features.find(f => f.feature_name === featureKey);
    return feature?.is_approved === true;
  };

  const getFeatureInfo = (featureKey: FeatureKey) => {
    return AVAILABLE_FEATURES.find(f => f.key === featureKey);
  };

  return {
    features,
    loading,
    hasFeature,
    getFeatureInfo,
    contractorId,
    refresh: loadFeatures,
  };
}
