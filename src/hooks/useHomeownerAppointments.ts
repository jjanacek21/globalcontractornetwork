import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Appointment {
  id: string;
  homeowner_id: string;
  contractor_id: string;
  conversation_id: string | null;
  appointment_type: 'phone_call' | 'video_call' | 'in_person';
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  notes: string | null;
  property_address: string | null;
  service_type: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  contractor?: {
    id: string;
    company_name: string;
    category: string;
    logo_url: string | null;
    phone: string | null;
    email: string | null;
  };
}

export function useHomeownerAppointments(userId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    fetchAppointments();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('homeowner-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'homeowner_appointments',
          filter: `homeowner_id=eq.${userId}`
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchAppointments = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('homeowner_appointments')
        .select(`
          *,
          contractor:contractor_profiles(
            id,
            company_name,
            category,
            logo_url,
            phone,
            email
          )
        `)
        .eq('homeowner_id', userId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setAppointments((data || []) as unknown as Appointment[]);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (data: {
    contractor_id: string;
    conversation_id?: string;
    appointment_type: 'phone_call' | 'video_call' | 'in_person';
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes?: number;
    notes?: string;
    property_address?: string;
    service_type?: string;
  }): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('homeowner_appointments')
        .insert({
          homeowner_id: userId,
          ...data
        });

      if (error) throw error;
      toast.success('Appointment scheduled successfully');
      return true;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to schedule appointment');
      return false;
    }
  };

  const cancelAppointment = async (appointmentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('homeowner_appointments')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;
      toast.success('Appointment cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
      return false;
    }
  };

  const upcomingAppointments = appointments.filter(
    a => a.status !== 'cancelled' && a.status !== 'completed' && new Date(a.scheduled_date) >= new Date()
  );

  const pastAppointments = appointments.filter(
    a => a.status === 'completed' || new Date(a.scheduled_date) < new Date()
  );

  return {
    appointments,
    upcomingAppointments,
    pastAppointments,
    loading,
    createAppointment,
    cancelAppointment,
    refetch: fetchAppointments
  };
}
