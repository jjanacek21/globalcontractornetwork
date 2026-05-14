import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContractorFeature {
  feature_name: string;
  is_approved: boolean;
  approved_at: string | null;
}

/**
 * Auto-granted contractor features. Every new contractor profile gets
 * these enabled automatically (see DB trigger trg_grant_default_features).
 */
export const AVAILABLE_FEATURES = [
  { key: 'permit_queens', label: 'Permit Expediter', description: 'Permit expediting & packet assembly', path: '/permit-queens/dashboard' },
  { key: 'gcn_app', label: 'GCN App', description: 'Member dashboard & contractor tools', path: '/member/dashboard' },
  { key: 'job_marketplace', label: 'Job Marketplace', description: 'Browse and respond to homeowner job requests', path: '/job-board' },
  { key: 'directory_listing', label: 'Contractor Directory', description: 'Get listed in the public contractor directory', path: '/directory' },
  { key: 'property_iq', label: 'PropertyIQ', description: 'Real estate intelligence & lead scoring', path: '/property-iq/dashboard' },
  { key: 'referral_network', label: 'Referral Platform', description: 'Refer customers and earn lifetime residuals', path: '/referrals' },
  { key: 'estimating_supplementing', label: 'Estimating & Supplementing', description: 'Estimates and insurance claim supplements', path: '/contractor/estimating' },
  { key: 'digital_marketing', label: 'Digital Marketing', description: 'GCN-powered marketing services', path: '/digital-marketing' },
  { key: 'academy_access', label: 'Training Academy', description: 'Courses, certifications, and resources', path: '/academy' },
] as const;

export type FeatureKey =
  | typeof AVAILABLE_FEATURES[number]['key']
  // Legacy / opt-in feature keys still referenced in code (not auto-granted)
  | 'rewards_dashboard'
  | 'field_map'
  | 'presentations'
  | 'learning_platform'
  | 'crm_access'
  | 'social_network'
  | 'gamification'
  | 'store_discounts'
  | 'coating_kings'
  | 'prep_your_property';

const DEFAULT_KEYS = AVAILABLE_FEATURES.map(f => f.key) as readonly string[];

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
    if (feature?.is_approved === true) return true;
    // Defensive default: any contractor with a profile gets the 9 auto-granted features
    if (contractorId && DEFAULT_KEYS.includes(featureKey)) return true;
    return false;
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
