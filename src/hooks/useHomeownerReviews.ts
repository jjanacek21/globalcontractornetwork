import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReviewableProject {
  id: string;
  service_type: string;
  property_address: string;
  status: string;
  assigned_contractor_id: string | null;
  contractor?: {
    id: string;
    company_name: string;
    category: string;
    logo_url: string | null;
  };
  has_review: boolean;
}

export interface SubmittedReview {
  id: string;
  contractor_id: string;
  rating: number;
  review_text: string | null;
  is_approved: boolean | null;
  created_at: string;
  contractor?: {
    company_name: string;
    category: string;
  };
}

export function useHomeownerReviews(userId: string | null) {
  const [reviewableProjects, setReviewableProjects] = useState<ReviewableProject[]>([]);
  const [submittedReviews, setSubmittedReviews] = useState<SubmittedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviewableProjects = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Get completed projects
      const { data: projects, error: projectsError } = await supabase
        .from('homeowner_projects')
        .select(`
          id, service_type, property_address, status, assigned_contractor_id,
          contractor:contractor_profiles(id, company_name, category, logo_url)
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('assigned_contractor_id', 'is', null);

      if (projectsError) throw projectsError;

      // Get existing reviews by this user
      const { data: reviews, error: reviewsError } = await supabase
        .from('contractor_reviews')
        .select('project_id')
        .eq('user_id', userId);

      if (reviewsError) throw reviewsError;

      const reviewedProjectIds = new Set((reviews || []).map(r => r.project_id));

      const typedProjects = (projects || []).map(p => ({
        id: p.id,
        service_type: p.service_type,
        property_address: p.property_address,
        status: p.status,
        assigned_contractor_id: p.assigned_contractor_id,
        contractor: p.contractor as ReviewableProject['contractor'],
        has_review: reviewedProjectIds.has(p.id)
      }));

      setReviewableProjects(typedProjects);
    } catch (error) {
      console.error('Error fetching reviewable projects:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchSubmittedReviews = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('contractor_reviews')
        .select(`
          id, contractor_id, rating, review_text, is_approved, created_at,
          contractor:contractor_profiles(company_name, category)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSubmittedReviews((data || []).map(r => ({
        ...r,
        contractor: r.contractor as SubmittedReview['contractor']
      })));
    } catch (error) {
      console.error('Error fetching submitted reviews:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchReviewableProjects();
    fetchSubmittedReviews();
  }, [fetchReviewableProjects, fetchSubmittedReviews]);

  const submitReview = async (
    contractorId: string,
    projectId: string,
    rating: number,
    reviewText: string,
    reviewerName: string,
    reviewerEmail?: string
  ) => {
    if (!userId) {
      toast.error('Please sign in to submit a review');
      return false;
    }
    
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating');
      return false;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('contractor_reviews')
        .insert({
          contractor_id: contractorId,
          user_id: userId,
          project_id: projectId,
          rating,
          review_text: reviewText.trim() || null,
          reviewer_name: reviewerName,
          reviewer_email: reviewerEmail || null,
          is_approved: false // Reviews go to moderation
        });

      if (error) throw error;
      
      toast.success('Review submitted! It will be visible after moderation.');
      await fetchReviewableProjects();
      await fetchSubmittedReviews();
      return true;
    } catch (error: any) {
      console.error('Error submitting review:', error);
      if (error.code === '23505') {
        toast.error('You have already reviewed this project');
      } else {
        toast.error('Failed to submit review');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const pendingReviewsCount = reviewableProjects.filter(p => !p.has_review).length;

  return {
    reviewableProjects,
    submittedReviews,
    pendingReviewsCount,
    loading,
    submitting,
    submitReview,
    refetch: fetchReviewableProjects
  };
}
