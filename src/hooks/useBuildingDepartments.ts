import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BuildingDepartment {
  id: string;
  county: string;
  city: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  portal_url: string | null;
  hours: string | null;
  jurisdiction_type: string | null;
  is_hvhz: boolean | null;
  created_at?: string;
  updated_at?: string;
  // Alias for backwards compatibility
  department_name?: string;
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
      const { data, error: fetchError } = await supabase
        .from('permit_building_departments')
        .select('*')
        .order('county', { ascending: true })
        .order('city', { ascending: true, nullsFirst: true });

      if (fetchError) throw fetchError;
      
      // Add backwards-compatible department_name alias
      const depts = (data || []).map(d => ({
        ...d,
        department_name: d.name,
      })) as BuildingDepartment[];
      
      setDepartments(depts);
    } catch (err) {
      console.error('Error fetching building departments:', err);
      setError('Failed to load building departments');
    } finally {
      setLoading(false);
    }
  };

  const getByCounty = (county: string) => {
    return departments.filter(d => 
      d.county?.toLowerCase() === county.toLowerCase()
    );
  };

  const getByCity = (city: string) => {
    return departments.find(d => 
      d.city?.toLowerCase() === city.toLowerCase()
    );
  };

  const getCounties = () => {
    return [...new Set(departments.map(d => d.county))].sort();
  };

  const getCitiesByCounty = (county: string) => {
    return departments
      .filter(d => d.county?.toLowerCase() === county.toLowerCase() && d.city)
      .map(d => d.city as string)
      .sort();
  };

  const detectJurisdiction = (address: string) => {
    const addressLower = address.toLowerCase();
    
    // Check for city matches first
    for (const dept of departments) {
      if (dept.city && addressLower.includes(dept.city.toLowerCase())) {
        return dept;
      }
    }

    // County-level matching
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
