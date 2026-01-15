import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { geocodeAddress } from '@/lib/geocoding';

export interface JobRequest {
  id: string;
  homeowner_id: string;
  title: string;
  description: string | null;
  service_category: string;
  property_address: string;
  budget_min: number | null;
  budget_max: number | null;
  timeline: string | null;
  urgency: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  state?: string | null;
  response_count?: number;
}

export function useHomeownerJobs(userId: string | null) {
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!userId) {
      setJobs([]);
      setLoading(false);
      return;
    }

    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_requests')
        .select('*')
        .eq('homeowner_id', userId)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      const jobsWithCounts = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { count } = await supabase
            .from('job_responses')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);
          
          return {
            ...job,
            response_count: count || 0
          } as JobRequest;
        })
      );

      setJobs(jobsWithCounts);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const createJob = async (jobData: {
    title: string;
    description?: string;
    service_category: string;
    property_address: string;
    budget_min?: number;
    budget_max?: number;
    timeline?: string;
    urgency: string;
  }) => {
    if (!userId) {
      toast.error('You must be logged in to create a job');
      return null;
    }

    setCreating(true);
    try {
      // Geocode the address to get coordinates
      const geoResult = await geocodeAddress(jobData.property_address);
      
      const { data, error } = await supabase
        .from('job_requests')
        .insert({
          homeowner_id: userId,
          title: jobData.title,
          description: jobData.description || null,
          service_category: jobData.service_category,
          property_address: jobData.property_address,
          budget_min: jobData.budget_min || null,
          budget_max: jobData.budget_max || null,
          timeline: jobData.timeline || null,
          urgency: jobData.urgency,
          status: 'open',
          lat: geoResult?.lat || null,
          lng: geoResult?.lng || null,
          city: geoResult?.city || null,
          state: geoResult?.state || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Job posted successfully!');
      await fetchJobs();
      return data;
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', jobId)
        .eq('homeowner_id', userId);

      if (error) throw error;

      toast.success(`Job ${status === 'closed' ? 'closed' : 'updated'} successfully`);
      await fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job');
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('job_requests')
        .delete()
        .eq('id', jobId)
        .eq('homeowner_id', userId);

      if (error) throw error;

      toast.success('Job deleted successfully');
      await fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  return {
    jobs,
    loading,
    creating,
    createJob,
    updateJobStatus,
    deleteJob,
    refresh: fetchJobs
  };
}
