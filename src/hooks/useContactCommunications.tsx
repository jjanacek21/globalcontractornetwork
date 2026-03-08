import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ContactCommunication {
  id: string;
  contact_id: string;
  lead_id: string | null;
  company_id: string | null;
  comm_type: string;
  direction: string;
  subject: string | null;
  content: string | null;
  created_by: string | null;
  created_at: string;
}

export function useContactCommunications(contactId: string | null) {
  const [communications, setCommunications] = useState<ContactCommunication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCommunications = async () => {
    if (!contactId) { setCommunications([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_communications")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCommunications((data as ContactCommunication[]) || []);
    } catch (error: any) {
      toast({ title: "Error loading communications", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const logCommunication = async (params: {
    comm_type: string;
    direction?: string;
    subject?: string;
    content?: string;
    lead_id?: string;
    company_id?: string;
  }) => {
    if (!contactId) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("contact_communications")
        .insert({
          contact_id: contactId,
          lead_id: params.lead_id || null,
          company_id: params.company_id || null,
          comm_type: params.comm_type,
          direction: params.direction || "outbound",
          subject: params.subject || null,
          content: params.content || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      await fetchCommunications();
      toast({ title: `${params.comm_type.charAt(0).toUpperCase() + params.comm_type.slice(1)} logged` });
      return data;
    } catch (error: any) {
      toast({ title: "Error logging communication", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const deleteCommunication = async (id: string) => {
    try {
      const { error } = await supabase.from("contact_communications").delete().eq("id", id);
      if (error) throw error;
      setCommunications(prev => prev.filter(c => c.id !== id));
      toast({ title: "Communication deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => { fetchCommunications(); }, [contactId]);

  const stats = {
    total: communications.length,
    calls: communications.filter(c => c.comm_type === "call").length,
    emails: communications.filter(c => c.comm_type === "email").length,
    sms: communications.filter(c => c.comm_type === "sms").length,
  };

  return { communications, isLoading, stats, logCommunication, deleteCommunication, refetch: fetchCommunications };
}
