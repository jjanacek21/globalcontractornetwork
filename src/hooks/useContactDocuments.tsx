import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ContactDocument {
  id: string;
  contact_id: string;
  lead_id: string | null;
  company_id: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

export function useContactDocuments(contactId: string | null) {
  const [documents, setDocuments] = useState<ContactDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!contactId) { setDocuments([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_documents")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDocuments((data as ContactDocument[]) || []);
    } catch (error: any) {
      toast({ title: "Error loading documents", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file: File, leadId?: string) => {
    if (!contactId) return null;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPG, PNG, and PDF files are allowed.", variant: "destructive" });
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return null;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/${contactId}/${timestamp}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("contact-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("contact_documents")
        .insert({
          contact_id: contactId,
          lead_id: leadId || null,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        });
      if (dbError) throw dbError;

      await fetchDocuments();
      toast({ title: "Document uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (doc: ContactDocument) => {
    try {
      await supabase.storage.from("contact-documents").remove([doc.file_path]);
      const { error } = await supabase.from("contact_documents").delete().eq("id", doc.id);
      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast({ title: "Document deleted" });
    } catch (error: any) {
      toast({ title: "Error deleting document", description: error.message, variant: "destructive" });
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("contact-documents")
      .createSignedUrl(filePath, 3600);
    if (error) return null;
    return data.signedUrl;
  };

  useEffect(() => { fetchDocuments(); }, [contactId]);

  return { documents, isLoading, isUploading, uploadDocument, deleteDocument, getSignedUrl, refetch: fetchDocuments };
}
