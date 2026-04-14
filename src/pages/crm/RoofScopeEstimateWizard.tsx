import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRSCompany, useRSCustomers, useRSPricingRules } from "@/hooks/useRoofScope";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressBar } from "@/components/measurements/AddressBar";
import { RoofScopeMeasurementStep } from "@/components/roofscope/RoofScopeMeasurementStep";

const STEPS = [
  "Customer & Property",
  "Existing Roof",
  "New Roof System",
  "Measurements",
  "Accessories",
  "Location & Code",
  "Pricing Tiers",
  "AI Photos",
  "Review & Generate",
];

const ROOF_TYPES = [
  { value: "asphalt_3tab", label: "Asphalt Shingle (3-tab)" },
  { value: "asphalt_architectural", label: "Asphalt Shingle (Architectural)" },
  { value: "asphalt_designer", label: "Asphalt Shingle (Designer/Premium)" },
  { value: "concrete_tile", label: "Concrete Tile" },
  { value: "clay_tile", label: "Clay Tile" },
  { value: "standing_seam_24ga", label: "Metal (Standing Seam)" },
  { value: "corrugated_metal", label: "Metal (Corrugated/R-Panel/5V)" },
  { value: "modified_bitumen", label: "Modified Bitumen (Torch-Down)" },
  { value: "bur", label: "Built-Up Roof (BUR)" },
  { value: "tpo_single_ply", label: "TPO / PVC Single-Ply" },
  { value: "epdm", label: "EPDM Rubber" },
  { value: "wood_shake", label: "Wood Shake / Shingle" },
  { value: "slate", label: "Slate" },
  { value: "flat_coating", label: "Flat / Coating Only" },
  { value: "spray_foam_coating", label: "Spray Foam (SPF) + Coating" },
  { value: "silicone_coating", label: "Silicone Coating Only" },
  { value: "acrylic_coating", label: "Acrylic Coating Only" },
];

const REGIONS = [
  { value: "south_florida_hvhz", label: "South Florida HVHZ (Miami-Dade, Broward)" },
  { value: "south_florida_non_hvhz", label: "South Florida Non-HVHZ (Palm Beach)" },
  { value: "central_florida", label: "Central Florida" },
  { value: "north_florida", label: "North Florida" },
  { value: "tampa_bay", label: "Tampa Bay / Gulf Coast" },
  { value: "southeast_us", label: "Southeast US" },
  { value: "northeast_us", label: "Northeast US" },
  { value: "midwest_us", label: "Midwest US" },
  { value: "mountain_west", label: "Mountain West" },
  { value: "pacific_northwest", label: "Pacific Northwest" },
  { value: "southwest_us", label: "Southwest US" },
  { value: "texas_gulf_coast", label: "Texas Gulf Coast" },
];

const PITCHES = [
  { value: "flat", label: "Flat (0-2:12)" },
  { value: "low", label: "Low (3-4:12)" },
  { value: "medium", label: "Medium (5-7:12)" },
  { value: "steep", label: "Steep (8-10:12)" },
  { value: "very_steep", label: "Very Steep (11-12:12)" },
  { value: "extreme", label: "Extreme (12+:12)" },
];

const KNOWN_ISSUES = [
  "Active leaks", "Missing/damaged material", "Sagging/structural concerns",
  "Previous patch repairs", "Storm damage", "Ponding water", "Biological growth",
];

interface EstimateState {
  customer_id: string;
  property_address: string; property_city: string; property_state: string; property_zip: string;
  property_type: string; num_stories: number;
  existing_roof_type: string; existing_layers: number; existing_condition: string; known_issues: string[];
  new_roof_type: string; new_roof_details: any;
  total_squares: string; total_sf: string; roof_pitch: string; waste_factor: string; num_facets: string;
  ridges: string; hips: string; valleys: string; eaves: string; rakes: string; wall_flashings: string; step_flashings: string;
  pipe_boots: string; roof_vents: string; exhaust_fans: string; skylights: string; satellite_dishes: string; hvac_units: string;
  underlayment_type: string;
  ventilation_action: string; ridge_vent_lf: string; box_vents: string;
  gutter_action: string; gutter_lf: string; gutter_type: string;
  plywood_sheets: string; renail_deck: boolean; drip_edge: boolean;
  fascia_repair: string; soffit_repair: string; painting: boolean;
  region: string;
  permit_included: boolean; permit_cost: string;
  engineering_required: boolean; engineering_cost: string;
  selected_tier: string;
  notes: string; disclaimer: string;
}

const INITIAL: EstimateState = {
  customer_id: "", property_address: "", property_city: "", property_state: "", property_zip: "",
  property_type: "residential", num_stories: 1,
  existing_roof_type: "", existing_layers: 1, existing_condition: "fair", known_issues: [],
  new_roof_type: "", new_roof_details: {},
  total_squares: "", total_sf: "", roof_pitch: "medium", waste_factor: "10", num_facets: "moderate",
  ridges: "", hips: "", valleys: "", eaves: "", rakes: "", wall_flashings: "", step_flashings: "",
  pipe_boots: "0", roof_vents: "0", exhaust_fans: "0", skylights: "0", satellite_dishes: "0", hvac_units: "0",
  underlayment_type: "synthetic",
  ventilation_action: "existing", ridge_vent_lf: "", box_vents: "",
  gutter_action: "none", gutter_lf: "", gutter_type: "5k",
  plywood_sheets: "0", renail_deck: false, drip_edge: true,
  fascia_repair: "none", soffit_repair: "none", painting: false,
  region: "south_florida_hvhz",
  permit_included: true, permit_cost: "350",
  engineering_required: false, engineering_cost: "0",
  selected_tier: "better",
  notes: "", disclaimer: "This estimate is based on the information provided and visible conditions. Final pricing is subject to on-site verification.",
};

export default function RoofScopeEstimateWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company, loading: cl } = useRSCompany();
  const { customers } = useRSCustomers(company?.id);
  const { getPrice } = useRSPricingRules();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<EstimateState>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [propertyCoords, setPropertyCoords] = useState<{ lat: number; lng: number } | null>(null);

  const u = (field: keyof EstimateState, value: any) => setState(prev => ({ ...prev, [field]: value }));

  const sq = parseFloat(state.total_squares) || 0;
  const sf = parseFloat(state.total_sf) || (sq * 100);
  const waste = parseFloat(state.waste_factor) || 10;
  const sfWithWaste = sf * (1 + waste / 100);

  // Auto-convert between SF and SQ
  useEffect(() => {
    if (state.total_squares && !state.total_sf) {
      setState(prev => ({ ...prev, total_sf: String(parseFloat(prev.total_squares) * 100 || "") }));
    }
  }, [state.total_squares]);

  // Generate line items for each tier
  const generateLineItems = useCallback((tier: "good" | "better" | "best") => {
    const items: { description: string; category: string; quantity: number; unit: string; unit_price: number; total: number }[] = [];
    const roofPrice = getPrice(state.region, state.new_roof_type, tier) || (tier === "good" ? 3.5 : tier === "better" ? 5.0 : 7.0);

    // Tear-off
    if (state.existing_roof_type) {
      const tearOffPrice = tier === "good" ? 0.75 : tier === "better" ? 1.0 : 1.25;
      items.push({ description: `Tear-off existing ${ROOF_TYPES.find(r => r.value === state.existing_roof_type)?.label || "roof"} (${state.existing_layers} layer${state.existing_layers > 1 ? "s" : ""})`, category: "tear_off", quantity: sf, unit: "SF", unit_price: tearOffPrice * state.existing_layers, total: sf * tearOffPrice * state.existing_layers });
    }

    // Underlayment
    const ulPrices = { good: 0.35, better: 0.65, best: 1.25 };
    const ulNames = { good: "Synthetic Felt Underlayment", better: "Self-Adhering Peel & Stick", best: "High-Temp Self-Adhering (Full Deck)" };
    items.push({ description: ulNames[tier], category: "underlayment", quantity: sfWithWaste, unit: "SF", unit_price: ulPrices[tier], total: sfWithWaste * ulPrices[tier] });

    // Roofing material
    items.push({ description: `Install ${ROOF_TYPES.find(r => r.value === state.new_roof_type)?.label || "new roof"}`, category: "roofing_material", quantity: sfWithWaste, unit: "SF", unit_price: roofPrice, total: sfWithWaste * roofPrice });

    // Drip edge
    if (state.drip_edge) {
      const eaves = parseFloat(state.eaves) || (Math.sqrt(sf) * 4);
      const dripPrice = tier === "good" ? 3.5 : tier === "better" ? 4.5 : 6.0;
      items.push({ description: "Drip Edge", category: "trim_flashings", quantity: eaves, unit: "LF", unit_price: dripPrice, total: eaves * dripPrice });
    }

    // Pipe boots
    const boots = parseInt(state.pipe_boots) || 0;
    if (boots > 0) {
      const bootPrice = tier === "good" ? 35 : tier === "better" ? 55 : 85;
      items.push({ description: "Pipe Boot Flashings", category: "trim_flashings", quantity: boots, unit: "EA", unit_price: bootPrice, total: boots * bootPrice });
    }

    // Permit
    if (state.permit_included) {
      items.push({ description: "Building Permit", category: "permits", quantity: 1, unit: "LS", unit_price: parseFloat(state.permit_cost) || 350, total: parseFloat(state.permit_cost) || 350 });
    }

    // Engineering
    if (state.engineering_required) {
      items.push({ description: "Engineering / PE Letter", category: "permits", quantity: 1, unit: "LS", unit_price: parseFloat(state.engineering_cost) || 500, total: parseFloat(state.engineering_cost) || 500 });
    }

    // Cleanup/dumpster
    const cleanupPrice = tier === "good" ? 0.25 : tier === "better" ? 0.35 : 0.45;
    items.push({ description: "Cleanup, Haul-off & Dumpster", category: "accessories", quantity: sf, unit: "SF", unit_price: cleanupPrice, total: sf * cleanupPrice });

    return items;
  }, [state, getPrice, sf, sfWithWaste]);

  const goodItems = generateLineItems("good");
  const betterItems = generateLineItems("better");
  const bestItems = generateLineItems("best");
  const currentItems = state.selected_tier === "good" ? goodItems : state.selected_tier === "best" ? bestItems : betterItems;
  const subtotal = currentItems.reduce((sum, i) => sum + i.total, 0);
  const taxRate = company?.tax_rate || 0;
  const taxAmount = subtotal * taxRate / 100;
  const grandTotal = subtotal + taxAmount;

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const estNumber = `EST-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;

      const { data: estimate, error } = await supabase
        .from("rs_estimates")
        .insert({
          company_id: company.id,
          customer_id: state.customer_id || null,
          estimate_number: estNumber,
          property_address: state.property_address,
          property_city: state.property_city,
          property_state: state.property_state,
          property_zip: state.property_zip,
          property_type: state.property_type,
          num_stories: state.num_stories,
          existing_roof_type: state.existing_roof_type,
          existing_layers: state.existing_layers,
          existing_condition: state.existing_condition,
          known_issues: state.known_issues,
          new_roof_type: state.new_roof_type,
          new_roof_details: state.new_roof_details,
          total_squares: sq || null,
          total_sf: sf || null,
          roof_pitch: state.roof_pitch,
          waste_factor: waste,
          num_facets: state.num_facets,
          linear_measurements: { ridges: state.ridges, hips: state.hips, valleys: state.valleys, eaves: state.eaves, rakes: state.rakes, wall_flashings: state.wall_flashings, step_flashings: state.step_flashings },
          penetrations: { pipe_boots: state.pipe_boots, roof_vents: state.roof_vents, exhaust_fans: state.exhaust_fans, skylights: state.skylights, satellite_dishes: state.satellite_dishes, hvac_units: state.hvac_units },
          underlayment_type: state.underlayment_type,
          ventilation: { action: state.ventilation_action, ridge_vent_lf: state.ridge_vent_lf, box_vents: state.box_vents },
          gutters: { action: state.gutter_action, lf: state.gutter_lf, type: state.gutter_type },
          decking: { plywood_sheets: state.plywood_sheets, renail_deck: state.renail_deck },
          drip_edge: state.drip_edge,
          fascia_repair: state.fascia_repair,
          soffit_repair: state.soffit_repair,
          painting: state.painting,
          region: state.region,
          permit_included: state.permit_included,
          permit_cost: parseFloat(state.permit_cost) || 0,
          engineering_required: state.engineering_required,
          engineering_cost: parseFloat(state.engineering_cost) || 0,
          selected_tier: state.selected_tier,
          notes: state.notes,
          disclaimer: state.disclaimer,
          subtotal,
          tax_amount: taxAmount,
          grand_total: grandTotal,
          status: "draft",
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Insert line items for all tiers
      const allItems = [
        ...goodItems.map((it, i) => ({ ...it, estimate_id: estimate.id, tier: "good", sort_order: i })),
        ...betterItems.map((it, i) => ({ ...it, estimate_id: estimate.id, tier: "better", sort_order: i })),
        ...bestItems.map((it, i) => ({ ...it, estimate_id: estimate.id, tier: "best", sort_order: i })),
      ];

      await supabase.from("rs_estimate_line_items").insert(allItems.map(it => ({
        estimate_id: it.estimate_id,
        tier: it.tier,
        category: it.category,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        total: it.total,
        sort_order: it.sort_order,
      })) as any);

      toast({ title: "Estimate saved!", description: estNumber });
      navigate("/roofscope/estimates");
    } catch (err: any) {
      toast({ title: "Error saving estimate", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (cl) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/roofscope/estimates")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Estimate</h1>
          <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />

      <Card>
        <CardContent className="p-6 space-y-4">
          {/* STEP 0: Customer & Property */}
          {step === 0 && (
            <>
              <div>
                <Label>Customer</Label>
                <Select value={state.customer_id} onValueChange={v => u("customer_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Property Address</Label>
                <AddressBar onSelect={(address, coords) => {
                  u("property_address", address);
                  setPropertyCoords(coords);
                  // Parse city/state/zip from place_name
                  const parts = address.split(",").map(s => s.trim());
                  if (parts.length >= 3) {
                    u("property_city", parts[1] || "");
                    const stateZip = (parts[2] || "").split(" ");
                    u("property_state", stateZip[0] || "");
                    u("property_zip", stateZip[1] || "");
                  }
                }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>City</Label><Input value={state.property_city} onChange={e => u("property_city", e.target.value)} /></div>
                <div><Label>State</Label><Input value={state.property_state} onChange={e => u("property_state", e.target.value)} /></div>
                <div><Label>Zip</Label><Input value={state.property_zip} onChange={e => u("property_zip", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Property Type</Label>
                  <Select value={state.property_type} onValueChange={v => u("property_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="multi_family">Multi-Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Stories</Label><Input type="number" min={1} max={10} value={state.num_stories} onChange={e => u("num_stories", parseInt(e.target.value) || 1)} /></div>
              </div>
            </>
          )}

          {/* STEP 1: Existing Roof */}
          {step === 1 && (
            <>
              <div>
                <Label>Current Roof Type</Label>
                <Select value={state.existing_roof_type} onValueChange={v => u("existing_roof_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{ROOF_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Existing Layers</Label>
                  <Select value={String(state.existing_layers)} onValueChange={v => u("existing_layers", parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Layer</SelectItem>
                      <SelectItem value="2">2 Layers</SelectItem>
                      <SelectItem value="3">3+ Layers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Roof Condition</Label>
                  <Select value={state.existing_condition} onValueChange={v => u("existing_condition", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Known Issues</Label>
                <div className="grid grid-cols-2 gap-2">
                  {KNOWN_ISSUES.map(issue => (
                    <label key={issue} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={state.known_issues.includes(issue)}
                        onCheckedChange={checked => {
                          u("known_issues", checked ? [...state.known_issues, issue] : state.known_issues.filter(i => i !== issue));
                        }} />
                      {issue}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 2: New Roof System */}
          {step === 2 && (
            <>
              <div>
                <Label>New Roof Type</Label>
                <Select value={state.new_roof_type} onValueChange={v => u("new_roof_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{ROOF_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {state.new_roof_type.includes("standing_seam") && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Panel Profile</Label>
                    <Select value={state.new_roof_details?.panel_profile || ""} onValueChange={v => u("new_roof_details", { ...state.new_roof_details, panel_profile: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="snap_lock">Snap-Lock</SelectItem>
                        <SelectItem value="mechanical_lock">Mechanical Lock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gauge</Label>
                    <Select value={state.new_roof_details?.gauge || ""} onValueChange={v => u("new_roof_details", { ...state.new_roof_details, gauge: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24ga">24 Gauge</SelectItem>
                        <SelectItem value="26ga">26 Gauge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Finish</Label>
                    <Select value={state.new_roof_details?.finish || ""} onValueChange={v => u("new_roof_details", { ...state.new_roof_details, finish: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kynar">Kynar 500 PVDF</SelectItem>
                        <SelectItem value="smp">SMP</SelectItem>
                        <SelectItem value="galvalume">Galvalume</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 3: Measurements */}
          {step === 3 && (
            <RoofScopeMeasurementStep
              center={propertyCoords}
              onMeasurementsChange={(data) => {
                setState(prev => ({
                  ...prev,
                  total_squares: data.total_squares,
                  total_sf: data.total_sf,
                  waste_factor: data.waste_factor,
                  ridges: data.ridges,
                  hips: data.hips,
                  valleys: data.valleys,
                  eaves: data.eaves,
                  rakes: data.rakes,
                  pipe_boots: data.pipe_boots,
                  roof_vents: data.roof_vents,
                  skylights: data.skylights,
                  num_facets: data.num_facets,
                  roof_pitch: data.roof_pitch,
                }));
              }}
            />
          )}

          {/* STEP 4: Accessories */}
          {step === 4 && (
            <>
              <div>
                <Label>Underlayment Type</Label>
                <Select value={state.underlayment_type} onValueChange={v => u("underlayment_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="synthetic">Synthetic Felt</SelectItem>
                    <SelectItem value="peel_stick">Self-Adhering Peel & Stick</SelectItem>
                    <SelectItem value="high_temp">Self-Adhering High-Temp (HVHZ)</SelectItem>
                    <SelectItem value="ice_water_eaves">Ice & Water Shield (Eaves/Valleys)</SelectItem>
                    <SelectItem value="ice_water_full">Ice & Water Shield (Full Deck)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ventilation</Label>
                <Select value={state.ventilation_action} onValueChange={v => u("ventilation_action", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="existing">Existing adequate — no changes</SelectItem>
                    <SelectItem value="ridge_vent">Add Ridge Vent</SelectItem>
                    <SelectItem value="box_vents">Add Box Vents</SelectItem>
                    <SelectItem value="powered">Add Powered Attic Vent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gutters</Label>
                <Select value={state.gutter_action} onValueChange={v => u("gutter_action", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No gutters</SelectItem>
                    <SelectItem value="detach_reset">Detach & Reset Existing</SelectItem>
                    <SelectItem value="new">Remove & Install New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Plywood Sheets (replacement)</Label><Input type="number" value={state.plywood_sheets} onChange={e => u("plywood_sheets", e.target.value)} /></div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox checked={state.renail_deck} onCheckedChange={v => u("renail_deck", !!v)} />
                  <Label>Re-nail deck to code</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2"><Checkbox checked={state.drip_edge} onCheckedChange={v => u("drip_edge", !!v)} /><Label>Install new drip edge</Label></div>
                <div className="flex items-center gap-2"><Checkbox checked={state.painting} onCheckedChange={v => u("painting", !!v)} /><Label>Fascia/soffit touch-up painting</Label></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fascia Repair</Label>
                  <Select value={state.fascia_repair} onValueChange={v => u("fascia_repair", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="minor">Minor (&lt;20 LF)</SelectItem>
                      <SelectItem value="moderate">Moderate (20-60 LF)</SelectItem>
                      <SelectItem value="major">Major (60+ LF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Soffit Repair</Label>
                  <Select value={state.soffit_repair} onValueChange={v => u("soffit_repair", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* STEP 5: Location & Code */}
          {step === 5 && (
            <>
              <div>
                <Label>Region</Label>
                <Select value={state.region} onValueChange={v => u("region", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REGIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {state.region.includes("hvhz") && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm text-orange-300">
                  <strong>HVHZ Requirements:</strong> Mandatory self-adhering underlayment, specific nail patterns, NOA product approvals required.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2"><Checkbox checked={state.permit_included} onCheckedChange={v => u("permit_included", !!v)} /><Label>Permit Included</Label></div>
                {state.permit_included && <div><Label>Permit Cost</Label><Input type="number" value={state.permit_cost} onChange={e => u("permit_cost", e.target.value)} /></div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2"><Checkbox checked={state.engineering_required} onCheckedChange={v => u("engineering_required", !!v)} /><Label>Engineering Required</Label></div>
                {state.engineering_required && <div><Label>Engineering Cost</Label><Input type="number" value={state.engineering_cost} onChange={e => u("engineering_cost", e.target.value)} /></div>}
              </div>
            </>
          )}

          {/* STEP 6: Pricing Tiers */}
          {step === 6 && (
            <>
              <div className="flex gap-2">
                {(["good", "better", "best"] as const).map(tier => (
                  <Button key={tier} variant={state.selected_tier === tier ? "default" : "outline"} onClick={() => u("selected_tier", tier)} className="flex-1 capitalize">
                    {tier}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                {currentItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs text-muted-foreground">{item.quantity.toFixed(0)} {item.unit} × ${item.unit_price.toFixed(2)}</p>
                      <p className="text-sm font-mono font-bold">${item.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1 text-right">
                <p className="text-sm">Subtotal: <span className="font-bold">${subtotal.toFixed(2)}</span></p>
                {taxRate > 0 && <p className="text-sm">Tax ({taxRate}%): <span className="font-bold">${taxAmount.toFixed(2)}</span></p>}
                <p className="text-lg font-bold">Total: ${grandTotal.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">${sf > 0 ? (grandTotal / sf).toFixed(2) : "0.00"}/SF • ${sq > 0 ? (grandTotal / sq).toFixed(2) : "0.00"}/SQ</p>
              </div>
            </>
          )}

          {/* STEP 7: AI Photos (placeholder) */}
          {step === 7 && (
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground">Photo analysis is available from the standalone AI Photo Analyzer page.</p>
              <Button variant="outline" onClick={() => navigate("/roofscope/analyzer")}>Open AI Analyzer</Button>
              <p className="text-xs text-muted-foreground">You can skip this step and proceed to review.</p>
            </div>
          )}

          {/* STEP 8: Review */}
          {step === 8 && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{customers.find(c => c.id === state.customer_id) ? `${customers.find(c => c.id === state.customer_id)!.first_name} ${customers.find(c => c.id === state.customer_id)!.last_name}` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Property</p>
                  <p className="font-medium">{state.property_address || "—"}, {state.property_city} {state.property_state}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Existing Roof</p>
                  <p className="font-medium">{ROOF_TYPES.find(r => r.value === state.existing_roof_type)?.label || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">New Roof</p>
                  <p className="font-medium">{ROOF_TYPES.find(r => r.value === state.new_roof_type)?.label || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Area</p>
                  <p className="font-medium">{sq} SQ ({sf} SF + {waste}% waste)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Region</p>
                  <p className="font-medium">{REGIONS.find(r => r.value === state.region)?.label || "—"}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {(["good", "better", "best"] as const).map(tier => (
                  <Button key={tier} variant={state.selected_tier === tier ? "default" : "outline"} onClick={() => u("selected_tier", tier)} className="flex-1 capitalize" size="sm">
                    {tier}
                  </Button>
                ))}
              </div>

              <div className="space-y-1 mt-2">
                {currentItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                    <span className="truncate">{item.description}</span>
                    <span className="font-mono ml-2 shrink-0">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 text-right">
                <p className="text-2xl font-bold">${grandTotal.toFixed(2)}</p>
              </div>

              <div><Label>Notes</Label><Textarea value={state.notes} onChange={e => u("notes", e.target.value)} rows={3} /></div>
              <div><Label>Disclaimer</Label><Textarea value={state.disclaimer} onChange={e => u("disclaimer", e.target.value)} rows={3} className="text-xs" /></div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Estimate"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
