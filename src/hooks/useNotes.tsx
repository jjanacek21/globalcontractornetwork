import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Note {
  id: string;
  entity_type: string;
  entity_id: string;
  content: string;
  is_pinned: boolean;
  author_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteWithAuthor extends Note {
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export function useNotes(entityType: string, entityId: string | null) {
  const [notes, setNotes] = useState<NoteWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotes = async () => {
    if (!entityId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          author:profiles(id, first_name, last_name)
        `)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading notes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async (content: string) => {
    if (!entityId) return null;

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("notes")
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          content,
          author_user_id: userData.user?.id,
        })
        .select(`
          *,
          author:profiles(id, first_name, last_name)
        `)
        .single();

      if (error) throw error;

      setNotes((prev) => [data, ...prev]);
      toast({ title: "Note added" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error adding note",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateNote = async (id: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .update({ content })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, ...data } : note))
      );
      toast({ title: "Note updated" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating note",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);

      if (error) throw error;

      setNotes((prev) => prev.filter((note) => note.id !== id));
      toast({ title: "Note deleted" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ is_pinned: !isPinned })
        .eq("id", id);

      if (error) throw error;

      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, is_pinned: !isPinned } : note
        )
      );
    } catch (error: any) {
      toast({
        title: "Error updating note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  return { notes, isLoading, fetchNotes, createNote, updateNote, deleteNote, togglePin };
}
