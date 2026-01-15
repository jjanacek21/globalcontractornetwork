import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateMatchScore, calculateDistance, type MatchScore } from '@/lib/contractor-matching';

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
  response_count?: number;
  match_score?: MatchScore;
  distance?: number;
}

export interface JobFilters {
  category?: string;
  maxDistance?: number;
  minBudget?: number;
  maxBudget?: number;
  urgency?: string;
  timeline?: string;
}

export interface ContractorProfile {
  id: string;
  category: string;
  secondary_trades: string[] | null;
  average_rating: number | null;
  is_verified: boolean | null;
  availability_days: number | null;
  service_area: string[] | null;
}

export function useJobBoard() {
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null);
  const [contractorLocation, setContractorLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<JobFilters>({});
  const [hasAccess, setHasAccess] = useState(false);

  // Check if contractor has marketplace access
  const checkAccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Get contractor profile
      const { data: contractor } = await supabase
        .from('contractor_profiles')
        .select('id, category, secondary_trades, average_rating, is_verified, availability_days, service_area')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!contractor) return false;
      setContractorProfile(contractor);

      // Check feature access
      const { data: featureAccess } = await supabase
        .from('contractor_feature_access')
        .select('is_approved')
        .eq('contractor_id', contractor.id)
        .eq('feature_name', 'job_marketplace')
        .maybeSingle();

      const approved = featureAccess?.is_approved === true;
      setHasAccess(approved);
      return approved;
    } catch (err) {
      console.error('Error checking access:', err);
      return false;
    }
  }, []);

  // Fetch open jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      // Fetch open jobs
      let query = supabase
        .from('job_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      // Apply category filter
      if (filters.category) {
        query = query.eq('service_category', filters.category);
      }

      // Apply budget filters
      if (filters.minBudget) {
        query = query.gte('budget_max', filters.minBudget);
      }
      if (filters.maxBudget) {
        query = query.lte('budget_min', filters.maxBudget);
      }

      // Apply urgency filter
      if (filters.urgency) {
        query = query.eq('urgency', filters.urgency);
      }

      // Apply timeline filter
      if (filters.timeline) {
        query = query.eq('timeline', filters.timeline);
      }

      const { data: jobsData, error: jobsError } = await query;

      if (jobsError) throw jobsError;

      // Get response counts for each job
      const jobIds = (jobsData || []).map(j => j.id);
      const { data: responseCounts } = await supabase
        .from('job_responses')
        .select('job_id')
        .in('job_id', jobIds);

      const countMap = new Map<string, number>();
      (responseCounts || []).forEach(r => {
        countMap.set(r.job_id, (countMap.get(r.job_id) || 0) + 1);
      });

      // Calculate match scores and distances
      const enrichedJobs = (jobsData || []).map(job => {
        const enriched: JobRequest = {
          ...job,
          photos: Array.isArray(job.photos) ? (job.photos as string[]) : [],
          documents: Array.isArray(job.documents) ? (job.documents as string[]) : [],
          response_count: countMap.get(job.id) || 0,
        };

        // Calculate match score if we have contractor profile
        if (contractorProfile) {
          enriched.match_score = calculateMatchScore(
            job,
            contractorProfile,
            contractorLocation?.lat,
            contractorLocation?.lng
          );
        }

        // Calculate distance if we have locations
        if (job.lat && job.lng && contractorLocation) {
          enriched.distance = calculateDistance(
            contractorLocation.lat,
            contractorLocation.lng,
            job.lat,
            job.lng
          );
        }

        return enriched;
      });

      // Filter by distance if specified
      let filteredJobs = enrichedJobs;
      if (filters.maxDistance && contractorLocation) {
        filteredJobs = enrichedJobs.filter(j => 
          j.distance === undefined || j.distance <= filters.maxDistance!
        );
      }

      // Sort by match score (highest first)
      filteredJobs.sort((a, b) => {
        const scoreA = a.match_score?.total || 0;
        const scoreB = b.match_score?.total || 0;
        return scoreB - scoreA;
      });

      setJobs(filteredJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [filters, contractorProfile, contractorLocation]);

  // Get contractor's current location
  const getContractorLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setContractorLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.log('Geolocation error:', err);
          // Default to a central location if geolocation fails
        }
      );
    }
  }, []);

  // Express interest in a job
  const expressInterest = async (
    jobId: string,
    message: string,
    proposedAmount?: number,
    estimatedDuration?: string,
    availableStartDate?: string
  ) => {
    if (!contractorProfile) {
      throw new Error('No contractor profile found');
    }

    const { error } = await supabase
      .from('job_responses')
      .insert({
        job_id: jobId,
        contractor_id: contractorProfile.id,
        message,
        proposed_amount: proposedAmount,
        estimated_duration: estimatedDuration,
        available_start_date: availableStartDate,
      });

    if (error) throw error;

    // Refresh jobs to update response count
    await fetchJobs();
  };

  // Check if contractor has already responded to a job
  const hasResponded = async (jobId: string): Promise<boolean> => {
    if (!contractorProfile) return false;

    const { data } = await supabase
      .from('job_responses')
      .select('id')
      .eq('job_id', jobId)
      .eq('contractor_id', contractorProfile.id)
      .maybeSingle();

    return !!data;
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      const access = await checkAccess();
      if (access) {
        getContractorLocation();
        await fetchJobs();
      } else {
        setLoading(false);
      }
    };
    init();
  }, [checkAccess, fetchJobs, getContractorLocation]);

  // Refetch when filters change
  useEffect(() => {
    if (hasAccess) {
      fetchJobs();
    }
  }, [filters, hasAccess, fetchJobs]);

  return {
    jobs,
    loading,
    error,
    filters,
    setFilters,
    hasAccess,
    contractorProfile,
    contractorLocation,
    expressInterest,
    hasResponded,
    refresh: fetchJobs,
  };
}
