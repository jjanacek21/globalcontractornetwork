import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommunicationMessage {
  id: string;
  lead_type: string;
  lead_id: string;
  sender_type: string;
  sender_id: string | null;
  message: string;
  created_at: string;
}

interface CoatingQuoteDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  property_address: string;
  property_type: string | null;
  coating_type: string;
  roof_type: string;
  estimated_sqft: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  discount_percent: number | null;
  discounted_price: number | null;
  roof_age: string | null;
  roof_condition: string | null;
  urgency: string | null;
  notes: string | null;
  status: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  referral_source: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface WindowQuoteDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  property_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  window_selections: any;
  total_windows: number | null;
  performance_level: string | null;
  interior_color: string | null;
  exterior_color: string | null;
  glass_type: string | null;
  grid_style: string | null;
  existing_window_type: string | null;
  financing_option: string | null;
  estimate_low: number | null;
  estimate_high: number | null;
  discount_percent: number | null;
  discounted_price: number | null;
  status: string | null;
  referral_source: string | null;
  created_at: string | null;
}

interface ContactRequestDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string | null;
  referral_source: string | null;
  created_at: string | null;
}

export type QuoteDetail = CoatingQuoteDetail | WindowQuoteDetail | ContactRequestDetail;

export function useQuoteDetail(type: string, id: string) {
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [communications, setCommunications] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: any = null;
      
      switch (type) {
        case 'coating':
          const { data: coatingData, error: coatingError } = await supabase
            .from('coating_leads')
            .select('*')
            .eq('id', id)
            .single();
          if (coatingError) throw coatingError;
          data = coatingData;
          break;

        case 'window':
          const { data: windowData, error: windowError } = await supabase
            .from('window_leads')
            .select('*')
            .eq('id', id)
            .single();
          if (windowError) throw windowError;
          data = windowData;
          break;

        case 'contact':
          const { data: contactData, error: contactError } = await supabase
            .from('contact_requests')
            .select('*')
            .eq('id', id)
            .single();
          if (contactError) throw contactError;
          data = contactData;
          break;

        default:
          throw new Error('Invalid quote type');
      }

      setQuote(data);
    } catch (err: any) {
      console.error('Error fetching quote:', err);
      setError(err.message || 'Failed to load quote details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_communication_history')
        .select('*')
        .eq('lead_id', id)
        .eq('lead_type', type)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCommunications(data || []);
    } catch (err) {
      console.error('Error fetching communications:', err);
    }
  };

  const addMessage = async (message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('lead_communication_history')
        .insert({
          lead_type: type,
          lead_id: id,
          sender_type: 'homeowner',
          sender_id: user.id,
          message,
        });

      if (error) throw error;
      
      // Refetch communications
      fetchCommunications();
      return true;
    } catch (err) {
      console.error('Error adding message:', err);
      return false;
    }
  };

  useEffect(() => {
    if (id && type) {
      fetchQuote();
      fetchCommunications();
    }
  }, [id, type]);

  // Set up real-time subscription for communications
  useEffect(() => {
    if (!id || !type) return;

    const channel = supabase
      .channel(`communications-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_communication_history',
          filter: `lead_id=eq.${id}`,
        },
        (payload) => {
          setCommunications((prev) => [...prev, payload.new as CommunicationMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, type]);

  return {
    quote,
    communications,
    loading,
    error,
    addMessage,
    refetch: fetchQuote,
  };
}
