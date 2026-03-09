import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EstimateTemplate {
  id: string;
  company_id: string | null;
  name: string;
  trade: string;
  material_cost_per_sq: number;
  labor_cost_per_sq: number;
  waste_factor: number;
  is_default: boolean;
  created_at: string;
}

export interface CRMEstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total: number;
  category: "material" | "labor" | "other";
  sort_order: number;
}

export interface CRMEstimate {
  id: string;
  contact_id: string | null;
  lead_id: string | null;
  estimate_number: string | null;
  template_id: string | null;
  measurement_id: string | null;
  customer_id: string;
  status: string | null;
  materials_cost: number;
  labor_cost: number;
  overhead_cost: number;
  overhead_percent: number;
  profit_percent: number;
  total: number;
  quick_price_adjust_percent: number;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  // joined
  template?: EstimateTemplate;
  line_items?: CRMEstimateLineItem[];
  customer?: { id: string; name: string; address: string | null };
  measurement?: { total_squares: number; total_area_sqft: number; pitch: string | null; address: string };
}

const DEFAULT_MATERIAL_ITEMS = [
  { description: "Shingles", quantity: 0, unit: "SQ", category: "material" as const, sort_order: 1 },
  { description: "Underlayment (Synthetic)", quantity: 0, unit: "SQ", category: "material" as const, sort_order: 2 },
  { description: "Starter Strip", quantity: 0, unit: "LF", category: "material" as const, sort_order: 3 },
  { description: "Ridge Cap", quantity: 0, unit: "LF", category: "material" as const, sort_order: 4 },
  { description: "Flashing (Step & Counter)", quantity: 0, unit: "LF", category: "material" as const, sort_order: 5 },
  { description: "Ice & Water Shield", quantity: 0, unit: "SQ", category: "material" as const, sort_order: 6 },
  { description: "Drip Edge", quantity: 0, unit: "LF", category: "material" as const, sort_order: 7 },
  { description: "Nails / Fasteners", quantity: 1, unit: "LOT", category: "material" as const, sort_order: 8 },
];

const DEFAULT_LABOR_ITEMS = [
  { description: "Tear-Off (existing roof)", quantity: 0, unit: "SQ", category: "labor" as const, sort_order: 9 },
  { description: "Installation", quantity: 0, unit: "SQ", category: "labor" as const, sort_order: 10 },
  { description: "Cleanup & Haul-Away", quantity: 1, unit: "JOB", category: "labor" as const, sort_order: 11 },
  { description: "Dump Fees", quantity: 1, unit: "JOB", category: "labor" as const, sort_order: 12 },
];

export function useEstimateTemplates() {
  const [templates, setTemplates] = useState<EstimateTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("estimate_templates")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");
      setTemplates((data as EstimateTemplate[]) || []);
      setIsLoading(false);
    };
    load();
  }, []);

  return { templates, isLoading };
}

export function useEstimateBuilderV2(contactId?: string, leadId?: string) {
  const { templates } = useEstimateTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [lineItems, setLineItems] = useState<CRMEstimateLineItem[]>([]);
  const [overheadPercent, setOverheadPercent] = useState(10);
  const [profitPercent, setProfitPercent] = useState(30);
  const [quickAdjust, setQuickAdjust] = useState(0);
  const [notes, setNotes] = useState("");
  const [measurementId, setMeasurementId] = useState("");
  const [measurement, setMeasurement] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load active measurement for this contact
  useEffect(() => {
    if (!contactId) return;
    const load = async () => {
      const { data } = await supabase
        .from("roof_measurements")
        .select("*")
        .eq("contact_id", contactId)
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        setMeasurement(data);
        setMeasurementId(data.id);
      }
    };
    load();
  }, [contactId]);

  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const applyTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (!template || !measurement) return;

    const squares = measurement.total_squares || 0;
    const wasteFactor = 1 + (template.waste_factor / 100);
    const adjustedSquares = Math.ceil(squares * wasteFactor * 10) / 10;

    const matCostPerSq = template.material_cost_per_sq;
    const labCostPerSq = template.labor_cost_per_sq;

    // Perimeter-based defaults
    const perimeter = measurement.perimeter_ft || (Math.sqrt(squares * 100) * 4);
    const ridgeFt = measurement.ridge_ft || perimeter * 0.15;
    const eaveFt = measurement.eave_ft || perimeter * 0.5;

    const newItems: CRMEstimateLineItem[] = [
      // Materials
      { id: crypto.randomUUID(), description: `${template.name} Shingles`, quantity: adjustedSquares, unit: "SQ", unit_cost: matCostPerSq * 0.55, total: 0, category: "material", sort_order: 1 },
      { id: crypto.randomUUID(), description: "Underlayment (Synthetic)", quantity: adjustedSquares, unit: "SQ", unit_cost: matCostPerSq * 0.12, total: 0, category: "material", sort_order: 2 },
      { id: crypto.randomUUID(), description: "Starter Strip", quantity: Math.ceil(eaveFt), unit: "LF", unit_cost: 1.25, total: 0, category: "material", sort_order: 3 },
      { id: crypto.randomUUID(), description: "Ridge Cap", quantity: Math.ceil(ridgeFt), unit: "LF", unit_cost: 3.50, total: 0, category: "material", sort_order: 4 },
      { id: crypto.randomUUID(), description: "Flashing (Step & Counter)", quantity: Math.ceil(perimeter * 0.1), unit: "LF", unit_cost: 5.00, total: 0, category: "material", sort_order: 5 },
      { id: crypto.randomUUID(), description: "Ice & Water Shield", quantity: Math.ceil(adjustedSquares * 0.15), unit: "SQ", unit_cost: matCostPerSq * 0.18, total: 0, category: "material", sort_order: 6 },
      { id: crypto.randomUUID(), description: "Drip Edge", quantity: Math.ceil(eaveFt), unit: "LF", unit_cost: 2.00, total: 0, category: "material", sort_order: 7 },
      { id: crypto.randomUUID(), description: "Nails / Fasteners", quantity: 1, unit: "LOT", unit_cost: adjustedSquares * 3.50, total: 0, category: "material", sort_order: 8 },
      // Labor
      { id: crypto.randomUUID(), description: "Tear-Off (existing roof)", quantity: squares, unit: "SQ", unit_cost: labCostPerSq * 0.30, total: 0, category: "labor", sort_order: 9 },
      { id: crypto.randomUUID(), description: "Installation", quantity: adjustedSquares, unit: "SQ", unit_cost: labCostPerSq * 0.50, total: 0, category: "labor", sort_order: 10 },
      { id: crypto.randomUUID(), description: "Cleanup & Haul-Away", quantity: 1, unit: "JOB", unit_cost: squares * labCostPerSq * 0.12, total: 0, category: "labor", sort_order: 11 },
      { id: crypto.randomUUID(), description: "Dump Fees", quantity: 1, unit: "JOB", unit_cost: squares * labCostPerSq * 0.08, total: 0, category: "labor", sort_order: 12 },
    ];

    // Calculate totals
    newItems.forEach(item => {
      item.total = Math.round(item.quantity * item.unit_cost * 100) / 100;
    });

    setLineItems(newItems);
  }, [templates, measurement]);

  const updateLineItem = useCallback((id: string, updates: Partial<CRMEstimateLineItem>) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      updated.total = Math.round(updated.quantity * updated.unit_cost * 100) / 100;
      return updated;
    }));
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const addLineItem = useCallback((category: "material" | "labor" | "other") => {
    setLineItems(prev => [...prev, {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unit: "EA",
      unit_cost: 0,
      total: 0,
      category,
      sort_order: prev.length + 1,
    }]);
  }, []);

  const materialsCost = useMemo(
    () => lineItems.filter(i => i.category === "material").reduce((s, i) => s + i.total, 0),
    [lineItems]
  );

  const laborCost = useMemo(
    () => lineItems.filter(i => i.category === "labor").reduce((s, i) => s + i.total, 0),
    [lineItems]
  );

  const directCost = materialsCost + laborCost;
  const overheadCost = Math.round(directCost * (overheadPercent / 100) * 100) / 100;
  const subtotalBeforeProfit = directCost + overheadCost;
  const profitAmount = Math.round(subtotalBeforeProfit * (profitPercent / 100) * 100) / 100;
  const baseTotal = subtotalBeforeProfit + profitAmount;
  const adjustmentAmount = Math.round(baseTotal * (quickAdjust / 100) * 100) / 100;
  const grandTotal = baseTotal + adjustmentAmount;
  const marginPercent = grandTotal > 0 ? Math.round(((grandTotal - directCost) / grandTotal) * 100) : 0;

  const saveEstimate = useCallback(async (customerId: string) => {
    setIsSaving(true);
    try {
      const estimateNumber = `EST-${Date.now().toString(36).toUpperCase()}`;

      const { data: estimate, error } = await supabase
        .from("estimates")
        .insert({
          customer_id: customerId,
          contact_id: contactId || null,
          lead_id: leadId || null,
          template_id: selectedTemplateId || null,
          measurement_id: measurementId || null,
          estimate_number: estimateNumber,
          status: "draft",
          materials_cost: materialsCost,
          labor_cost: laborCost,
          overhead_cost: overheadCost,
          overhead_percent: overheadPercent,
          profit_percent: profitPercent,
          quick_price_adjust_percent: quickAdjust,
          subtotal: directCost,
          tax_rate: 0,
          tax_amount: 0,
          total: grandTotal,
          notes: notes || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      if (lineItems.length > 0) {
        const { error: lineError } = await supabase
          .from("estimate_line_items")
          .insert(
            lineItems.map(item => ({
              estimate_id: estimate.id,
              item_name: item.description,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_cost,
              unit: item.unit,
              total: item.total,
              category: item.category,
              sort_order: item.sort_order,
            }))
          );
        if (lineError) throw lineError;
      }

      toast({ title: "Estimate created successfully" });
      return estimate;
    } catch (error: any) {
      toast({ title: "Error creating estimate", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [contactId, leadId, selectedTemplateId, measurementId, lineItems, materialsCost, laborCost, overheadCost, overheadPercent, profitPercent, quickAdjust, notes, directCost, grandTotal, toast]);

  return {
    templates,
    selectedTemplate,
    selectedTemplateId,
    lineItems,
    measurement,
    measurementId,
    overheadPercent,
    profitPercent,
    quickAdjust,
    notes,
    materialsCost,
    laborCost,
    directCost,
    overheadCost,
    profitAmount,
    baseTotal,
    adjustmentAmount,
    grandTotal,
    marginPercent,
    isSaving,
    applyTemplate,
    updateLineItem,
    removeLineItem,
    addLineItem,
    setOverheadPercent,
    setProfitPercent,
    setQuickAdjust,
    setNotes,
    setMeasurementId,
    saveEstimate,
  };
}

export function useContactEstimates(contactId: string | null) {
  const [estimates, setEstimates] = useState<CRMEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEstimates = useCallback(async () => {
    if (!contactId) { setEstimates([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { data } = await supabase
      .from("estimates")
      .select(`
        *,
        customer:customers(id, name, address)
      `)
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false });
    setEstimates((data as CRMEstimate[]) || []);
    setIsLoading(false);
  }, [contactId]);

  useEffect(() => { fetchEstimates(); }, [fetchEstimates]);

  return { estimates, isLoading, refetch: fetchEstimates };
}
