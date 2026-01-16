import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BuildingDepartment {
  id: string;
  county: string;
  city: string | null;
  department_name: string;
  portal_url: string | null;
  is_hvhz: boolean;
  required_forms: any[];
  submission_notes: string | null;
  contact_phone: string | null;
  contact_email: string | null;
}

export function useBuildingDepartments() {
  const [departments, setDepartments] = useState<BuildingDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      // Cast to 'any' since building_departments may not be in generated types yet
      const { data, error: fetchError } = await (supabase as any)
        .from('building_departments')
        .select('*')
        .order('county', { ascending: true })
        .order('city', { ascending: true, nullsFirst: true });

      if (fetchError) throw fetchError;
      setDepartments((data || []) as BuildingDepartment[]);
    } catch (err) {
      console.error('Error fetching building departments:', err);
      setError('Failed to load building departments');
    } finally {
      setLoading(false);
    }
  };

  const getByCounty = (county: string) => {
    return departments.filter(d => d.county === county);
  };

  const getByCity = (city: string) => {
    return departments.find(d => d.city?.toLowerCase() === city.toLowerCase());
  };

  const getCounties = () => {
    return [...new Set(departments.map(d => d.county))].sort();
  };

  const getCitiesByCounty = (county: string) => {
    return departments
      .filter(d => d.county === county && d.city)
      .map(d => d.city as string)
      .sort();
  };

  const detectJurisdiction = (address: string) => {
    // Simple detection based on address keywords
    const addressLower = address.toLowerCase();
    
    // Check for city matches
    for (const dept of departments) {
      if (dept.city && addressLower.includes(dept.city.toLowerCase())) {
        return dept;
      }
    }

    // Fall back to county detection
    if (addressLower.includes('broward') || 
        addressLower.includes('fort lauderdale') ||
        addressLower.includes('hollywood') ||
        addressLower.includes('pembroke pines') ||
        addressLower.includes('weston')) {
      return departments.find(d => d.county === 'Broward' && !d.city);
    }
    
    if (addressLower.includes('miami-dade') || 
        addressLower.includes('miami')) {
      return departments.find(d => d.county === 'Miami-Dade' && !d.city);
    }
    
    if (addressLower.includes('palm beach') ||
        addressLower.includes('west palm') ||
        addressLower.includes('boca raton')) {
      return departments.find(d => d.county === 'Palm Beach' && !d.city);
    }

    return null;
  };

  return {
    departments,
    loading,
    error,
    getByCounty,
    getByCity,
    getCounties,
    getCitiesByCounty,
    detectJurisdiction,
    refetch: fetchDepartments,
  };
}
