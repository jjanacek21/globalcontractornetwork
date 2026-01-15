import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JobRequest {
  id: string;
  homeowner_id: string;
  title: string;
  description: string | null;
  service_category: string;
  urgency: string;
  budget_min: number | null;
  budget_max: number | null;
  timeline: string | null;
  property_address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  lat: number | null;
  lng: number | null;
  photos: string[];
  documents: string[];
  status: string;
  max_responses: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface JobResponse {
  id: string;
  job_id: string;
  contractor_id: string;
  message: string | null;
  proposed_amount: number | null;
  estimated_duration: string | null;
  available_start_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  contractor?: {
    id: string;
    company_name: string;
    logo_url: string | null;
    average_rating: number | null;
    review_count: number | null;
    is_verified: boolean | null;
    category: string;
    phone: string | null;
    email: string | null;
  };
}

export function useMyJobRequests() {
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('job_requests')
        .select('*')
        .eq('homeowner_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedJobs: JobRequest[] = (data || []).map(job => ({
        ...job,
        photos: Array.isArray(job.photos) ? (job.photos as string[]) : [],
        documents: Array.isArray(job.documents) ? (job.documents as string[]) : [],
      }));

      setJobs(formattedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load your job requests');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new job request
  const createJob = async (jobData: Partial<JobRequest>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_requests')
      .insert({
        homeowner_id: user.id,
        title: jobData.title,
        description: jobData.description,
        service_category: jobData.service_category,
        urgency: jobData.urgency || 'standard',
        budget_min: jobData.budget_min,
        budget_max: jobData.budget_max,
        timeline: jobData.timeline,
        property_address: jobData.property_address,
        city: jobData.city,
        state: jobData.state,
        zip_code: jobData.zip_code,
        lat: jobData.lat,
        lng: jobData.lng,
        photos: jobData.photos || [],
        documents: jobData.documents || [],
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;
    await fetchJobs();
    return data;
  };

  // Update a job request
  const updateJob = async (jobId: string, updates: Partial<JobRequest>) => {
    const { error } = await supabase
      .from('job_requests')
      .update(updates)
      .eq('id', jobId);

    if (error) throw error;
    await fetchJobs();
  };

  // Delete a job request
  const deleteJob = async (jobId: string) => {
    const { error } = await supabase
      .from('job_requests')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
    await fetchJobs();
  };

  // Cancel a job request
  const cancelJob = async (jobId: string) => {
    await updateJob(jobId, { status: 'cancelled' });
  };

  // Fetch responses for a specific job
  const fetchResponses = async (jobId: string): Promise<JobResponse[]> => {
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
          is_verified,
          category,
          phone,
          email
        )
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  // Accept a response
  const acceptResponse = async (responseId: string, jobId: string) => {
    // Update the response status to accepted
    const { error: responseError } = await supabase
      .from('job_responses')
      .update({ status: 'accepted' })
      .eq('id', responseId);

    if (responseError) throw responseError;

    // Decline all other pending responses for this job
    const { error: declineError } = await supabase
      .from('job_responses')
      .update({ status: 'declined' })
      .eq('job_id', jobId)
      .neq('id', responseId)
      .eq('status', 'pending');

    if (declineError) throw declineError;

    // Update job status to in_progress
    await updateJob(jobId, { status: 'in_progress' });
  };

  // Decline a response
  const declineResponse = async (responseId: string) => {
    const { error } = await supabase
      .from('job_responses')
      .update({ status: 'declined' })
      .eq('id', responseId);

    if (error) throw error;
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Set up realtime subscription for responses
  useEffect(() => {
    const channel = supabase
      .channel('job_responses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_responses',
        },
        () => {
          // Refresh jobs when responses change
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    cancelJob,
    fetchResponses,
    acceptResponse,
    declineResponse,
    refresh: fetchJobs,
  };
}
