import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CoatingLead {
  id: string;
  name: string;
  email: string;
  property_address: string;
  coating_type: string;
  roof_type: string;
  status: string | null;
  created_at: string | null;
}

interface WindowLead {
  id: string;
  name: string;
  email: string;
  property_address: string | null;
  total_windows: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  status: string | null;
  created_at: string | null;
}

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  message: string | null;
  status: string | null;
  created_at: string | null;
}

interface HomeownerProject {
  id: string;
  property_address: string;
  service_type: string;
  status: string;
  ai_estimate_low: number | null;
  ai_estimate_high: number | null;
  official_quote: number | null;
  created_at: string;
  assigned_contractor: {
    company_name: string;
    phone: string | null;
  } | null;
}

export interface HomeownerSubmissions {
  coatingLeads: CoatingLead[];
  windowLeads: WindowLead[];
  contactRequests: ContactRequest[];
  projects: HomeownerProject[];
}

export function useHomeownerSubmissions(userId: string | null, email: string | null) {
  const [submissions, setSubmissions] = useState<HomeownerSubmissions>({
    coatingLeads: [],
    windowLeads: [],
    contactRequests: [],
    projects: []
  });
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    if (!userId) return;
    
    try {
      // Fetch coating leads by user_id or email
      const coatingQuery = supabase
        .from('coating_leads')
        .select('id, name, email, property_address, coating_type, roof_type, status, created_at')
        .order('created_at', { ascending: false });
      
      if (email) {
        coatingQuery.or(`user_id.eq.${userId},email.ilike.${email}`);
      } else {
        coatingQuery.eq('user_id', userId);
      }

      const { data: coatingLeads } = await coatingQuery;

      // Fetch window leads
      const windowQuery = supabase
        .from('window_leads')
        .select('id, name, email, property_address, total_windows, estimate_low, estimate_high, status, created_at')
        .order('created_at', { ascending: false });
      
      if (email) {
        windowQuery.or(`user_id.eq.${userId},email.ilike.${email}`);
      } else {
        windowQuery.eq('user_id', userId);
      }

      const { data: windowLeads } = await windowQuery;

      // Fetch contact requests
      const contactQuery = supabase
        .from('contact_requests')
        .select('id, name, email, message, status, created_at')
        .order('created_at', { ascending: false });
      
      if (email) {
        contactQuery.or(`user_id.eq.${userId},email.ilike.${email}`);
      } else {
        contactQuery.eq('user_id', userId);
      }

      const { data: contactRequests } = await contactQuery;

      // Fetch homeowner projects
      const { data: projects } = await supabase
        .from('homeowner_projects')
        .select(`
          id,
          property_address,
          service_type,
          status,
          ai_estimate_low,
          ai_estimate_high,
          official_quote,
          created_at,
          assigned_contractor:contractor_profiles(company_name, phone)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setSubmissions({
        coatingLeads: coatingLeads || [],
        windowLeads: windowLeads || [],
        contactRequests: contactRequests || [],
        projects: (projects || []).map(p => ({
          ...p,
          assigned_contractor: Array.isArray(p.assigned_contractor) 
            ? p.assigned_contractor[0] || null 
            : p.assigned_contractor
        }))
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [userId, email]);

  return { submissions, loading, refetch: fetchSubmissions };
}
