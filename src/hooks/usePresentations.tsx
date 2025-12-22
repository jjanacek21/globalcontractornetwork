import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Presentation = Database["public"]["Tables"]["presentations"]["Row"];
type PresentationInsert = Database["public"]["Tables"]["presentations"]["Insert"];
type PresentationUpdate = Database["public"]["Tables"]["presentations"]["Update"];
type Slide = Database["public"]["Tables"]["presentation_slides"]["Row"];
type SlideInsert = Database["public"]["Tables"]["presentation_slides"]["Insert"];

export interface PresentationWithSlides extends Presentation {
  slides?: Slide[];
}

export function usePresentations() {
  const [presentations, setPresentations] = useState<PresentationWithSlides[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPresentations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("presentations")
        .select(`
          *,
          slides:presentation_slides(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPresentations((data as PresentationWithSlides[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading presentations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPresentation = async (presentation: PresentationInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("presentations")
        .insert({ ...presentation, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;

      await fetchPresentations();
      toast({ title: "Presentation created successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating presentation",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePresentation = async (id: string, updates: PresentationUpdate) => {
    try {
      const { data, error } = await supabase
        .from("presentations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await fetchPresentations();
      toast({ title: "Presentation updated successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating presentation",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deletePresentation = async (id: string) => {
    try {
      const { error } = await supabase.from("presentations").delete().eq("id", id);

      if (error) throw error;

      setPresentations((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Presentation deleted successfully" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting presentation",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  return {
    presentations,
    isLoading,
    fetchPresentations,
    createPresentation,
    updatePresentation,
    deletePresentation,
  };
}

export function usePresentation(presentationId: string | null) {
  const [presentation, setPresentation] = useState<PresentationWithSlides | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPresentation = async () => {
    if (!presentationId) {
      setPresentation(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("presentations")
        .select(`
          *,
          slides:presentation_slides(*)
        `)
        .eq("id", presentationId)
        .single();

      if (error) throw error;
      setPresentation(data as PresentationWithSlides);
    } catch (error: any) {
      toast({
        title: "Error loading presentation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentation();
  }, [presentationId]);

  return { presentation, isLoading, refetch: fetchPresentation };
}

export function usePresentationSlides(presentationId: string | null) {
  const { toast } = useToast();

  const addSlide = async (slide: SlideInsert) => {
    try {
      const { data, error } = await supabase
        .from("presentation_slides")
        .insert(slide)
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Slide added" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error adding slide",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSlide = async (id: string, updates: Partial<Slide>) => {
    try {
      const { data, error } = await supabase
        .from("presentation_slides")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating slide",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteSlide = async (id: string) => {
    try {
      const { error } = await supabase
        .from("presentation_slides")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Slide deleted" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting slide",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return { addSlide, updateSlide, deleteSlide };
}

export type { Presentation, PresentationInsert, Slide };
