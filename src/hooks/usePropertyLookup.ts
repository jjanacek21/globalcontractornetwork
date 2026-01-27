import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyLookupResult {
  yearBuilt: number | null;
  ownerName: string | null;
  legalDescription: string | null;
  assessedValue: number | null;
  marketValue: number | null;
  zoning: string | null;
  propertyUse: string | null;
  lotSize: number | null;
  livingArea: number | null;
  folio: string | null;
  isHVHZ: boolean;
  loading: boolean;
  error: string | null;
  lookupUrl: string | null;
  manualSteps: string[] | null;
  scraped: boolean;
}

const initialState: PropertyLookupResult = {
  yearBuilt: null,
  ownerName: null,
  legalDescription: null,
  assessedValue: null,
  marketValue: null,
  zoning: null,
  propertyUse: null,
  lotSize: null,
  livingArea: null,
  folio: null,
  isHVHZ: false,
  loading: false,
  error: null,
  lookupUrl: null,
  manualSteps: null,
  scraped: false,
};

type CountyType = 'palm_beach' | 'broward' | 'miami_dade';

function normalizeCounty(county: string): CountyType | null {
  const lower = county.toLowerCase().replace(/[\s-_]/g, '');
  
  if (lower.includes('palmbeach') || lower.includes('palm')) {
    return 'palm_beach';
  }
  if (lower.includes('broward')) {
    return 'broward';
  }
  if (lower.includes('miamidade') || lower.includes('miami') || lower.includes('dade')) {
    return 'miami_dade';
  }
  
  return null;
}

export function usePropertyLookup(
  address: string | null,
  county: string | null,
  options: { enabled?: boolean; debounceMs?: number } = {}
): PropertyLookupResult & { refetch: () => void } {
  const { enabled = true, debounceMs = 1500 } = options;
  
  const [result, setResult] = useState<PropertyLookupResult>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const lookup = useCallback(async (lookupAddress: string, lookupCounty: string) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    const normalizedCounty = normalizeCounty(lookupCounty);
    if (!normalizedCounty) {
      setResult(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'County not supported for property lookup' 
      }));
      return;
    }
    
    setResult(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.functions.invoke(
        'property-appraiser-lookup',
        { 
          body: { 
            address: lookupAddress, 
            county: normalizedCounty 
          } 
        }
      );
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        setResult({
          yearBuilt: data.data.yearBuilt ?? null,
          ownerName: data.data.ownerName ?? null,
          legalDescription: data.data.legalDescription ?? null,
          assessedValue: data.data.assessedValue ?? null,
          marketValue: data.data.marketValue ?? null,
          zoning: data.data.zoning ?? null,
          propertyUse: data.data.propertyUse ?? null,
          lotSize: data.data.lotSize ?? null,
          livingArea: data.data.livingArea ?? null,
          folio: data.data.folio ?? null,
          isHVHZ: data.data.isHVHZ ?? false,
          loading: false,
          error: null,
          lookupUrl: data.lookupUrl ?? null,
          manualSteps: null,
          scraped: data.scraped ?? false,
        });
      } else {
        // Not an error, just couldn't auto-lookup
        setResult({
          ...initialState,
          loading: false,
          error: null,
          lookupUrl: data?.lookupUrl ?? null,
          manualSteps: data?.manualSteps ?? null,
        });
      }
    } catch (err) {
      // Don't update state if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      setResult(prev => ({ 
        ...prev, 
        loading: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }));
    }
  }, []);

  const refetch = useCallback(() => {
    if (address && county && enabled) {
      lookup(address, county);
    }
  }, [address, county, enabled, lookup]);

  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Don't lookup if not enabled or missing required fields
    if (!enabled || !address || !county) {
      setResult(initialState);
      return;
    }
    
    // Require minimum address length
    if (address.length < 10) {
      return;
    }
    
    // Debounce the lookup
    debounceTimerRef.current = setTimeout(() => {
      lookup(address, county);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [address, county, enabled, debounceMs, lookup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { ...result, refetch };
}
