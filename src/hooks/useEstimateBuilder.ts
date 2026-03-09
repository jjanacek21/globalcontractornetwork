import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Trade = Database["public"]["Tables"]["trades"]["Row"];
type CatalogItem = Database["public"]["Tables"]["catalog_items"]["Row"];
type RoofMeasurement = Database["public"]["Tables"]["roof_measurements"]["Row"];

export interface BuilderLineItem {
  id: string;
  catalog_item_id?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit_of_measure: string;
  total: number;
  trade_name?: string;
  sort_order: number;
}

export interface BuilderPackage {
  id: string;
  name: string;
  description: string;
  items: BuilderLineItem[];
  total: number;
  is_recommended: boolean;
}

export interface EstimateBuilderState {
  step: number;
  customer_id: string;
  customer: Customer | null;
  measurement_id: string;
  measurement: RoofMeasurement | null;
  selectedTrades: string[];
  lineItems: BuilderLineItem[];
  packages: BuilderPackage[];
  usePackages: boolean;
  tax_rate: number;
  discount_amount: number;
  notes: string;
}

const INITIAL_STATE: EstimateBuilderState = {
  step: 0,
  customer_id: "",
  customer: null,
  measurement_id: "",
  measurement: null,
  selectedTrades: [],
  lineItems: [],
  packages: [],
  usePackages: false,
  tax_rate: 7,
  discount_amount: 0,
  notes: "",
};

export function useEstimateBuilder(editEstimateId?: string) {
  const [state, setState] = useState<EstimateBuilderState>(INITIAL_STATE);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [measurements, setMeasurements] = useState<RoofMeasurement[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load reference data
  useEffect(() => {
    const load = async () => {
      const [custRes, tradeRes, catalogRes] = await Promise.all([
        supabase.from("customers").select("*").order("name"),
        supabase.from("trades").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("catalog_items").select("*").eq("is_active", true).order("name"),
      ]);
      setCustomers(custRes.data || []);
      setTrades(tradeRes.data || []);
      setCatalogItems(catalogRes.data || []);
    };
    load();
  }, []);

  // Load measurements when customer changes
  useEffect(() => {
    if (!state.customer_id) {
      setMeasurements([]);
      return;
    }
    const loadMeasurements = async () => {
      // Find contact linked to this customer (by name match or direct)
      const { data } = await supabase
        .from("roof_measurements")
        .select("*")
        .order("created_at", { ascending: false });
      setMeasurements(data || []);
    };
    loadMeasurements();
  }, [state.customer_id]);

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const updateState = useCallback((updates: Partial<EstimateBuilderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setCustomer = useCallback((customer_id: string) => {
    const customer = customers.find(c => c.id === customer_id) || null;
    setState(prev => ({ ...prev, customer_id, customer }));
  }, [customers]);

  const setMeasurement = useCallback((measurement_id: string) => {
    const measurement = measurements.find(m => m.id === measurement_id) || null;
    setState(prev => ({ ...prev, measurement_id, measurement }));
  }, [measurements]);

  const addCatalogItemToLineItems = useCallback((item: CatalogItem, quantity?: number) => {
    const trade = trades.find(t => t.id === item.trade_id);
    const squares = state.measurement?.total_squares || 1;
    const autoQuantity = quantity ?? (item.unit_of_measure === "SQ" ? squares : 1);

    const newItem: BuilderLineItem = {
      id: crypto.randomUUID(),
      catalog_item_id: item.id,
      item_name: item.name,
      description: item.description || "",
      quantity: autoQuantity,
      unit_price: item.unit_price || 0,
      unit_of_measure: item.unit_of_measure,
      total: autoQuantity * (item.unit_price || 0),
      trade_name: trade?.name,
      sort_order: state.lineItems.length + 1,
    };

    setState(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
  }, [trades, state.measurement, state.lineItems.length]);

  const addManualLineItem = useCallback((item: Omit<BuilderLineItem, "id" | "sort_order" | "total">) => {
    const newItem: BuilderLineItem = {
      ...item,
      id: crypto.randomUUID(),
      total: item.quantity * item.unit_price,
      sort_order: state.lineItems.length + 1,
    };
    setState(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
  }, [state.lineItems.length]);

  const updateLineItem = useCallback((id: string, updates: Partial<BuilderLineItem>) => {
    setState(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.total = updated.quantity * updated.unit_price;
        return updated;
      }),
    }));
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id),
    }));
  }, []);

  const subtotal = useMemo(() =>
    state.lineItems.reduce((sum, item) => sum + item.total, 0),
    [state.lineItems]
  );

  const taxAmount = useMemo(() =>
    subtotal * (state.tax_rate / 100),
    [subtotal, state.tax_rate]
  );

  const grandTotal = useMemo(() =>
    subtotal + taxAmount - state.discount_amount,
    [subtotal, taxAmount, state.discount_amount]
  );

  const catalogByTrade = useMemo(() => {
    const map: Record<string, CatalogItem[]> = {};
    catalogItems.forEach(item => {
      const trade = trades.find(t => t.id === item.trade_id);
      const key = trade?.name || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [catalogItems, trades]);

  const saveEstimate = useCallback(async () => {
    if (!state.customer_id) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return null;
    }

    setIsSaving(true);
    try {
      const estimateNumber = `EST-${Date.now().toString(36).toUpperCase()}`;

      const { data: estimate, error } = await supabase
        .from("estimates")
        .insert({
          customer_id: state.customer_id,
          measurement_id: state.measurement_id || null,
          estimate_number: estimateNumber,
          status: "draft",
          subtotal,
          tax_rate: state.tax_rate,
          tax_amount: taxAmount,
          discount_amount: state.discount_amount,
          total: grandTotal,
          notes: state.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert line items
      if (state.lineItems.length > 0) {
        const { error: lineError } = await supabase
          .from("estimate_line_items")
          .insert(
            state.lineItems.map(item => ({
              estimate_id: estimate.id,
              item_name: item.item_name,
              description: item.description || null,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
              sort_order: item.sort_order,
            }))
          );
        if (lineError) throw lineError;
      }

      // Insert packages if using them
      if (state.usePackages && state.packages.length > 0) {
        const { error: pkgError } = await supabase
          .from("estimate_packages")
          .insert(
            state.packages.map(pkg => ({
              estimate_id: estimate.id,
              name: pkg.name,
              description: pkg.description || null,
              items: pkg.items as any,
              total: pkg.total,
              is_recommended: pkg.is_recommended,
            }))
          );
        if (pkgError) throw pkgError;
      }

      toast({ title: "Estimate created successfully" });
      return estimate;
    } catch (error: any) {
      toast({
        title: "Error creating estimate",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [state, subtotal, taxAmount, grandTotal, toast]);

  return {
    state,
    customers,
    trades,
    catalogItems,
    catalogByTrade,
    measurements,
    isSaving,
    subtotal,
    taxAmount,
    grandTotal,
    setStep,
    updateState,
    setCustomer,
    setMeasurement,
    addCatalogItemToLineItems,
    addManualLineItem,
    updateLineItem,
    removeLineItem,
    saveEstimate,
  };
}
