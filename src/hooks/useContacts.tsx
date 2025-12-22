import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];
type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];
type Property = Database["public"]["Tables"]["properties"]["Row"];
type Lead = Database["public"]["Tables"]["leads"]["Row"];

export interface ContactWithDetails extends Contact {
  properties?: Property[];
  leads?: Lead[];
}

export function useContacts(companyId?: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading contacts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createContact = async (contact: ContactInsert) => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert(contact)
        .select()
        .single();

      if (error) throw error;

      setContacts((prev) => [data, ...prev]);
      toast({ title: "Contact created successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating contact",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateContact = async (id: string, updates: ContactUpdate) => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
      toast({ title: "Contact updated successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating contact",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id);

      if (error) throw error;

      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Contact deleted successfully" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting contact",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [companyId]);

  return {
    contacts,
    isLoading,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
}

export function useContact(contactId: string | null) {
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchContact = async () => {
    if (!contactId) {
      setContact(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: contactData, error: contactError } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .single();

      if (contactError) throw contactError;

      const { data: properties } = await supabase
        .from("properties")
        .select("*")
        .eq("contact_id", contactId);

      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .eq("contact_id", contactId);

      setContact({
        ...contactData,
        properties: properties || [],
        leads: leads || [],
      });
    } catch (error: any) {
      toast({
        title: "Error loading contact",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  return { contact, isLoading, refetch: fetchContact };
}

export type { Contact, ContactInsert, ContactUpdate, Property, Lead };
