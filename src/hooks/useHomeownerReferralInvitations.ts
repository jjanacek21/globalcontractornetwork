import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReferralInvitation {
  id: string;
  homeowner_id: string | null;
  homeowner_email: string | null;
  referring_contractor_id: string;
  recommended_contractor_id: string;
  job_type: string;
  property_address: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  accepted_at: string | null;
  declined_at: string | null;
  project_id: string | null;
  created_at: string;
  referring_contractor?: {
    id: string;
    company_name: string;
    category: string;
    logo_url: string | null;
    phone: string | null;
  };
  recommended_contractor?: {
    id: string;
    company_name: string;
    category: string;
    logo_url: string | null;
    phone: string | null;
    email: string | null;
  };
}

export function useHomeownerReferralInvitations(userId: string | null, userEmail: string | null) {
  const [invitations, setInvitations] = useState<ReferralInvitation[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    if (!userId && !userEmail) {
      setLoading(false);
      return;
    }
    
    try {
      let query = supabase
        .from('homeowner_referral_invitations')
        .select(`
          *,
          referring_contractor:contractor_profiles!homeowner_referral_invitations_referring_contractor_id_fkey(
            id, company_name, category, logo_url, phone
          ),
          recommended_contractor:contractor_profiles!homeowner_referral_invitations_recommended_contractor_id_fkey(
            id, company_name, category, logo_url, phone, email
          )
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('homeowner_id', userId);
      } else if (userEmail) {
        query = query.eq('homeowner_email', userEmail);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedInvitations = (data || []).map(inv => ({
        ...inv,
        status: inv.status as 'pending' | 'accepted' | 'declined',
        referring_contractor: inv.referring_contractor as ReferralInvitation['referring_contractor'],
        recommended_contractor: inv.recommended_contractor as ReferralInvitation['recommended_contractor']
      }));
      
      setInvitations(typedInvitations);
      setPendingCount(typedInvitations.filter(i => i.status === 'pending').length);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // Real-time subscription for new invitations
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`invitations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'homeowner_referral_invitations',
          filter: `homeowner_id=eq.${userId}`
        },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchInvitations]);

  const acceptInvitation = async (invitationId: string, propertyAddress?: string) => {
    if (!userId) return false;
    
    try {
      const invitation = invitations.find(i => i.id === invitationId);
      if (!invitation) throw new Error('Invitation not found');

      // Create a new homeowner project
      const { data: project, error: projectError } = await supabase
        .from('homeowner_projects')
        .insert({
          user_id: userId,
          property_address: propertyAddress || invitation.property_address || 'Address to be confirmed',
          service_type: invitation.job_type,
          status: 'pending',
          assigned_contractor_id: invitation.recommended_contractor_id,
          notes: `Referral from ${invitation.referring_contractor?.company_name}`
        })
        .select('id')
        .single();

      if (projectError) throw projectError;

      // Update invitation status
      const { error } = await supabase
        .from('homeowner_referral_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          project_id: project.id
        })
        .eq('id', invitationId);

      if (error) throw error;
      
      toast.success('Invitation accepted! The contractor will reach out soon.');
      await fetchInvitations();
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
      return false;
    }
  };

  const declineInvitation = async (invitationId: string) => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('homeowner_referral_invitations')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;
      
      toast.success('Invitation declined');
      await fetchInvitations();
      return true;
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
      return false;
    }
  };

  return {
    invitations,
    pendingCount,
    loading,
    acceptInvitation,
    declineInvitation,
    refetch: fetchInvitations
  };
}
