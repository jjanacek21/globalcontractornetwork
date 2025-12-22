import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Trade = Database["public"]["Tables"]["trades"]["Row"];
type CatalogItem = Database["public"]["Tables"]["catalog_items"]["Row"];
type CatalogItemInsert = Database["public"]["Tables"]["catalog_items"]["Insert"];
type CatalogItemUpdate = Database["public"]["Tables"]["catalog_items"]["Update"];

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrades = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setTrades(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading trades",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  return { trades, isLoading, refetch: fetchTrades };
}

export function useCatalogItems(tradeId?: string) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("catalog_items")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (tradeId) {
        query = query.eq("trade_id", tradeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading catalog items",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createItem = async (item: CatalogItemInsert) => {
    try {
      const { data, error } = await supabase
        .from("catalog_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [...prev, data]);
      toast({ title: "Catalog item created successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating catalog item",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateItem = async (id: string, updates: CatalogItemUpdate) => {
    try {
      const { data, error } = await supabase
        .from("catalog_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
      toast({ title: "Catalog item updated successfully" });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating catalog item",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchItems();
  }, [tradeId]);

  return { items, isLoading, fetchItems, createItem, updateItem };
}

export type { Trade, CatalogItem };
