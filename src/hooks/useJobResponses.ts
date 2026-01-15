import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface JobResponse {
  id: string;
  job_id: string;
  contractor_id: string;
  proposed_amount: number | null;
  message: string | null;
  status: string | null;
  available_start_date: string | null;
  estimated_duration: string | null;
  created_at: string | null;
  contractor?: {
    id: string;
    company_name: string;
    logo_url: string | null;
    average_rating: number | null;
    review_count: number | null;
    category: string;
    phone: string | null;
    email: string | null;
  };
}

export function useJobResponses(jobId: string | null) {
  const [responses, setResponses] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResponses = useCallback(async () => {
    if (!jobId) {
      setResponses([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('job_responses')
        .select(`
          *,
          contractor:contractor_profiles(
            id,
            company_name,
            logo_url,
            average_rating,
            review_count,
            category,
            phone,
            email
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setResponses((data || []) as JobResponse[]);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Failed to load contractor responses');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const updateResponseStatus = async (responseId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('job_responses')
        .update({ status })
        .eq('id', responseId);

      if (error) throw error;

      if (status === 'accepted') {
        const response = responses.find(r => r.id === responseId);
        if (response) {
          await supabase
            .from('job_requests')
            .update({ status: 'awarded' })
            .eq('id', response.job_id);

          await supabase
            .from('job_responses')
            .update({ status: 'declined' })
            .eq('job_id', response.job_id)
            .neq('id', responseId)
            .eq('status', 'pending');
        }
        toast.success('Contractor accepted! They will be notified.');
      } else {
        toast.success('Response declined');
      }

      await fetchResponses();
    } catch (error) {
      console.error('Error updating response:', error);
      toast.error('Failed to update response');
    }
  };

  return {
    responses,
    loading,
    updateResponseStatus,
    refresh: fetchResponses
  };
}
