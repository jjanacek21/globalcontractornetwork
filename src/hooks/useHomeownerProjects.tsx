import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface HomeownerProject {
  id: string;
  user_id: string;
  service_type: string;
  property_address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  ai_estimate_low: number | null;
  ai_estimate_high: number | null;
  official_quote: number | null;
  assigned_contractor_id: string | null;
  project_details: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contractor?: {
    id: string;
    company_name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

export interface ProjectMessage {
  id: string;
  project_id: string;
  sender_type: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const useHomeownerProjects = () => {
  const [projects, setProjects] = useState<HomeownerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("homeowner_projects")
        .select(`
          *,
          contractor:contractor_profiles!assigned_contractor_id(
            id,
            company_name,
            phone,
            email
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects((data as HomeownerProject[]) || []);
    } catch (error: unknown) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async (projectData: {
    service_type: string;
    property_address: string;
    city?: string;
    state?: string;
    zip_code?: string;
    lat?: number;
    lng?: number;
    ai_estimate_low?: number;
    ai_estimate_high?: number;
    project_details?: Record<string, unknown>;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("homeowner_projects")
        .insert([{
          user_id: user.id,
          service_type: projectData.service_type,
          property_address: projectData.property_address,
          city: projectData.city,
          state: projectData.state,
          zip_code: projectData.zip_code,
          lat: projectData.lat,
          lng: projectData.lng,
          ai_estimate_low: projectData.ai_estimate_low,
          ai_estimate_high: projectData.ai_estimate_high,
          project_details: projectData.project_details,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setProjects(prev => [data as HomeownerProject, ...prev]);
      toast({ title: "Success", description: "Project created successfully" });
      return data as HomeownerProject;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create project";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      return null;
    }
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("homeowner_projects")
        .update({ status })
        .eq("id", projectId);

      if (error) throw error;
      
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status } : p
      ));
      toast({ title: "Success", description: "Project status updated" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update status";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProjectStatus,
  };
};

export const useProjectMessages = (projectId: string | null) => {
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as ProjectMessage[]) || []);
    } catch (error: unknown) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const sendMessage = async (content: string, senderType: "homeowner" | "contractor") => {
    if (!projectId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("project_messages")
        .insert({
          project_id: projectId,
          sender_type: senderType,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data as ProjectMessage]);
      return data as ProjectMessage;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      return null;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-messages-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ProjectMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    messages,
    loading,
    sendMessage,
    fetchMessages,
  };
};
