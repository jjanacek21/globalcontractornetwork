import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JurisdictionRule {
  id: string;
  county: string;
  city: string | null;
  rule_type: string;
  rule_description: string;
  rule_action: string | null;
  document_required: string | null;
  permit_types: string[] | null;
  priority: number | null;
  is_active: boolean;
}

export interface AppliedRule {
  rule: JurisdictionRule;
  applicable: boolean;
  severity: 'error' | 'warning' | 'info';
}

export function useJurisdictionRulesEngine() {
  const [rules, setRules] = useState<JurisdictionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('building_department_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (fetchError) throw fetchError;
      setRules((data || []) as JurisdictionRule[]);
    } catch (err) {
      console.error('Error fetching jurisdiction rules:', err);
      setError('Failed to load jurisdiction rules');
    } finally {
      setLoading(false);
    }
  };

  const getRulesForJurisdiction = (county: string, city?: string | null): JurisdictionRule[] => {
    return rules.filter(rule => {
      // Match county
      if (rule.county.toLowerCase() !== county.toLowerCase()) return false;
      
      // If rule is city-specific, check city match
      if (rule.city && city) {
        return rule.city.toLowerCase() === city.toLowerCase();
      }
      
      // County-wide rules apply to all cities in county
      if (!rule.city) return true;
      
      return false;
    });
  };

  const getRulesForPermitType = (
    county: string, 
    permitType: string, 
    city?: string | null
  ): JurisdictionRule[] => {
    const jurisdictionRules = getRulesForJurisdiction(county, city);
    
    return jurisdictionRules.filter(rule => {
      // If no permit_types specified, rule applies to all
      if (!rule.permit_types || rule.permit_types.length === 0) return true;
      
      // Check if permit type matches
      return rule.permit_types.includes(permitType);
    });
  };

  const getGotchas = (county: string, permitType?: string, city?: string | null): JurisdictionRule[] => {
    const applicableRules = permitType 
      ? getRulesForPermitType(county, permitType, city)
      : getRulesForJurisdiction(county, city);
    
    return applicableRules.filter(rule => rule.rule_type === 'gotcha');
  };

  const getRequirements = (county: string, permitType?: string, city?: string | null): JurisdictionRule[] => {
    const applicableRules = permitType 
      ? getRulesForPermitType(county, permitType, city)
      : getRulesForJurisdiction(county, city);
    
    return applicableRules.filter(rule => rule.rule_type === 'requirement');
  };

  const getDocumentRequirements = (county: string, permitType?: string, city?: string | null): JurisdictionRule[] => {
    const applicableRules = permitType 
      ? getRulesForPermitType(county, permitType, city)
      : getRulesForJurisdiction(county, city);
    
    return applicableRules.filter(rule => 
      rule.rule_action === 'require_document' && rule.document_required
    );
  };

  const applyRules = (
    county: string,
    permitType: string,
    isHVHZ: boolean,
    city?: string | null
  ): AppliedRule[] => {
    const applicableRules = getRulesForPermitType(county, permitType, city);
    
    return applicableRules.map(rule => {
      let severity: 'error' | 'warning' | 'info' = 'info';
      
      // Determine severity based on rule type and action
      if (rule.rule_action === 'require_document' || rule.rule_action === 'block') {
        severity = 'error';
      } else if (rule.rule_action === 'show_warning') {
        severity = 'warning';
      }
      
      // HVHZ-related rules are always high priority
      if (isHVHZ && (
        rule.rule_description.toLowerCase().includes('hvhz') ||
        rule.rule_description.toLowerCase().includes('high velocity')
      )) {
        severity = 'error';
      }
      
      return {
        rule,
        applicable: true,
        severity,
      };
    });
  };

  const getCounties = useMemo(() => {
    return [...new Set(rules.map(r => r.county))].sort();
  }, [rules]);

  return {
    rules,
    loading,
    error,
    getRulesForJurisdiction,
    getRulesForPermitType,
    getGotchas,
    getRequirements,
    getDocumentRequirements,
    applyRules,
    getCounties,
    refetch: fetchRules,
  };
}
