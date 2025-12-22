import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Activity = Database["public"]["Tables"]["activities"]["Row"];

export interface ActivityWithUser extends Activity {
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export function useActivities(entityType?: string, entityId?: string) {
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("activities")
        .select(`
          *,
          user:profiles(id, first_name, last_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (entityType) {
        query = query.eq("entity_type", entityType);
      }
      if (entityId) {
        query = query.eq("entity_id", entityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities((data as ActivityWithUser[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading activities",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logActivity = async (activity: {
    entity_type: string;
    entity_id: string;
    action: string;
    description?: string;
    meta?: Record<string, unknown>;
    company_id?: string;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("activities").insert({
        entity_type: activity.entity_type,
        entity_id: activity.entity_id,
        action: activity.action,
        description: activity.description,
        meta: activity.meta,
        company_id: activity.company_id,
        user_id: userData.user?.id,
      });

      if (error) throw error;
      await fetchActivities();
    } catch (error: any) {
      console.error("Error logging activity:", error.message);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId]);

  return { activities, isLoading, fetchActivities, logActivity };
}
