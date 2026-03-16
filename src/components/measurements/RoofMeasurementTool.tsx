import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Save, FileText, Loader2, ArrowLeft,
  Satellite, Pencil, CheckCircle, Share2, DollarSign
} from "lucide-react";
import { MeasurementMap } from "./MeasurementMap";
import { AddressBar } from "./AddressBar";
import { PinListPanel } from "./PinListPanel";
import { DrawingToolbar } from "./DrawingToolbar";
import { FacetListPanel } from "./FacetListPanel";
import { MeasurementReportPanel } from "./MeasurementReportPanel";
import { generateMeasurementPDF } from "./reportGenerator";
import {
  calcPin, calculateMaterialTakeoff, estimateComponentsFromSolar,
  generateSimulatedFacets, getPitchMultiplier, createPinFacet,
  distanceFt, findSnapVertex,
} from "./utils";
import type {
  RoofPin, SolarMeasurementData, RoofFacet, RoofEdge,
  RoofComponents, MeasurementMode, DrawingTool, EdgeType, RoofSection,
} from "./types";
import { DEFAULT_COMPONENTS, FACET_COLORS, PITCH_MULTIPLIERS, getPinColor } from "./types";

export function RoofMeasurementTool() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  // Core state
  const [address, setAddress] = useState("");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mode, setMode] = useState<MeasurementMode>("ai");
  const [satelliteImage, setSatelliteImage] = useState("");

  // AI mode
  const [pins, setPins] = useState<RoofPin[]>([]);
  const [measuring, setMeasuring] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Manual mode - drawing
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const [activeEdgeType, setActiveEdgeType] = useState<EdgeType>("ridge");
  const [selectedFacetId, setSelectedFacetId] = useState<string | null>(null);

  // Shared data
  const [facets, setFacets] = useState<RoofFacet[]>([]);
  const [edges, setEdges] = useState<RoofEdge[]>([]);
  const [components, setComponents] = useState<RoofComponents>(DEFAULT_COMPONENTS);

  // History for undo/redo
  const [history, setHistory] = useState<{ facets: RoofFacet[]; edges: RoofEdge[] }[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const pushHistory = (f: RoofFacet[], e: RoofEdge[]) => {
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push({ facets: f, edges: e });
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIdx <= 0) return;
    const prev = history[historyIdx - 1];
    setFacets(prev.facets);
    setEdges(prev.edges);
    setHistoryIdx(historyIdx - 1);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const next = history[historyIdx + 1];
    setFacets(next.facets);
    setEdges(next.edges);
    setHistoryIdx(historyIdx + 1);
  };

  // Address selection
  const handleAddressSelect = useCallback((addr: string, coords: { lat: number; lng: number }) => {
    setAddress(addr);
    setCenter(coords);
    setSaved(false);
    setSavedId(null);
    setShareUrl(null);
    setFacets([]);
    setEdges([]);
    setHistory([]);
    setHistoryIdx(-1);
    setPins([{
      id: crypto.randomUUID(), lat: coords.lat, lng: coords.lng,
      pitch: "4/12", label: "Main Roof", wastePercent: 13,
      loading: false, result: null, error: null,
    }]);
  }, []);

  // Pin management
  const addPin = () => {
    if (pins.length === 0 || !center) return;
    const last = pins[pins.length - 1];
    setPins(prev => [...prev, {
      id: crypto.randomUUID(), lat: last.lat + 0.00015, lng: last.lng + 0.00015,
      pitch: "Flat", label: `Flat ${prev.filter(p => p.pitch === "Flat").length + 1}`,
      wastePercent: 5,
      loading: false, result: null, error: null,
    }]);
  };

  const removePin = (id: string) => setPins(prev => prev.filter(p => p.id !== id));
  const updatePin = (id: string, field: Partial<RoofPin>) => {
    setPins(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...field };
      // Don't clear result when changing pitch/waste - just recalculate
      if (field.pitch !== undefined || field.wastePercent !== undefined) {
        return updated;
      }
      return updated;
    }));
  };
  const handlePinDrag = useCallback((id: string, lat: number, lng: number) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, lat, lng, result: null, error: null } : p));
  }, []);

  // Recalculate totals whenever pins change
  const recalcTotals = (currentPins: RoofPin[], currentEdges: RoofEdge[]) => {
    const measured = currentPins.filter(p => p.result);
    if (measured.length === 0) return;

    // Each pin uses its own multiplier and waste
    let totalSqft = 0;
    let totalSquares = 0;
    measured.forEach(p => {
      const pc = calcPin(p);
      if (pc) {
        totalSqft += pc.flatSqft;
        totalSquares += pc.squares;
      }
    });

    // Weighted average pitch multiplier for display
    const avgMult = measured.reduce((s, p) => {
      const pc = calcPin(p);
      return s + (pc ? pc.multiplier * pc.flatSqft : 0);
    }, 0) / (totalSqft || 1);

    // Edge totals from actual edges
    const edgeTotals: Record<string, number> = {};
    currentEdges.forEach(e => {
      edgeTotals[e.edgeType] = (edgeTotals[e.edgeType] || 0) + e.lengthFt;
    });

    // Weighted waste
    const avgWaste = measured.reduce((s, p) => {
      const pc = calcPin(p);
      return s + (pc ? p.wastePercent * pc.flatSqft : 0);
    }, 0) / (totalSqft || 1);

    setComponents(prev => ({
      ...prev,
      totalAreaSqft: Math.round(totalSqft),
      totalSquares: +totalSquares.toFixed(2),
      pitchMultiplier: +avgMult.toFixed(3),
      wastePercent: Math.round(avgWaste),
      ridgeFt: Math.round(edgeTotals.ridge || 0),
      hipFt: Math.round(edgeTotals.hip || 0),
      valleyFt: Math.round(edgeTotals.valley || 0),
      eaveFt: Math.round(edgeTotals.eave || 0),
      rakeFt: Math.round(edgeTotals.rake || 0),
      dripEdgeFt: Math.round((edgeTotals.drip_edge || 0) + (edgeTotals.eave || 0) + (edgeTotals.rake || 0)),
      flashingFt: Math.round(edgeTotals.flashing || 0),
    }));
  };

  // AI Measure
  const measureAllPins = async () => {
    if (pins.length === 0) return;
    setMeasuring(true);
    setAiAnalyzing(true);
    setSaved(false);
    setPins(prev => prev.map(p => ({ ...p, loading: true, error: null })));

    const results = await Promise.all(pins.map(async (pin) => {
      try {
        const { data, error } = await supabase.functions.invoke("solar-roof-measure", {
          body: { latitude: pin.lat, longitude: pin.lng, address },
        });
        if (error || !data?.success || !data?.data) return { ...pin, loading: false, error: data?.error || "Measurement failed", result: null };
        if (!satelliteImage && data.data.satellite_image) setSatelliteImage(data.data.satellite_image);
        
        // Auto-detect pitch from API if not Flat
        const apiResult = data.data as SolarMeasurementData;
        let updatedPitch = pin.pitch;
        if (pin.pitch !== "Flat" && apiResult.average_pitch_over_12 > 0) {
          const detectedPitch = `${apiResult.average_pitch_over_12}/12`;
          if (PITCH_MULTIPLIERS[detectedPitch]) {
            updatedPitch = detectedPitch;
          }
        }
        
        return { ...pin, pitch: updatedPitch, loading: false, error: null, result: apiResult };
      } catch { return { ...pin, loading: false, error: "Measurement failed", result: null }; }
    }));

    setPins(results);

    // Generate simulated facets/edges from API data
    const measured = results.filter(p => p.result);
    if (measured.length > 0 && center) {
      const primaryResult = measured[0].result!;
      
      // Calculate totals using individual pin multipliers
      let totalSqft = 0;
      let totalSquares = 0;
      measured.forEach(p => {
        const pc = calcPin(p);
        if (pc) {
          totalSqft += pc.flatSqft;
          totalSquares += pc.squares;
        }
      });

      // Simulate facets/edges from primary pin segments
      const simulated = generateSimulatedFacets(center, primaryResult.segments, totalSqft);
      const allFacets = [...simulated.facets];

      // Add synthetic facets for non-primary measured pins
      measured.slice(1).forEach((pin, i) => {
        if (pin.result) {
          allFacets.push(createPinFacet(pin, simulated.facets.length + i));
        }
      });

      setFacets(allFacets);
      setEdges(simulated.edges);
      pushHistory(simulated.facets, simulated.edges);

      // Update components using real edge lengths from generated facets
      const estimated = estimateComponentsFromSolar(results, totalSqft, totalSquares, simulated.edges);
      setComponents(prev => ({ ...prev, ...estimated, totalSquares: +totalSquares.toFixed(2) }));
    }

    await new Promise(r => setTimeout(r, 800));
    setAiAnalyzing(false);
    setMeasuring(false);

    setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
  };

  // ─── Per-facet recalc helper ─────────────────────────────────────────
  const recalcFromFacets = useCallback((newFacets: RoofFacet[], newEdges: RoofEdge[]) => {
    const totalFlatArea = newFacets.reduce((s, f) => s + f.areaSqft, 0);
    const totalPitchedArea = newFacets.reduce((s, f) => s + f.areaSqft * (PITCH_MULTIPLIERS[f.pitch] ?? 1), 0);
    const totalSquares = newFacets.reduce((s, f) => {
      const pitched = f.areaSqft * (PITCH_MULTIPLIERS[f.pitch] ?? 1);
      return s + pitched * (1 + f.wastePercent / 100) / 100;
    }, 0);

    // Weighted pitch multiplier
    const avgMult = totalFlatArea > 0
      ? newFacets.reduce((s, f) => s + (PITCH_MULTIPLIERS[f.pitch] ?? 1) * f.areaSqft, 0) / totalFlatArea
      : 1.054;

    // Weighted waste
    const avgWaste = totalFlatArea > 0
      ? newFacets.reduce((s, f) => s + f.wastePercent * f.areaSqft, 0) / totalFlatArea
      : 13;

    // Most common pitch
    const pitchCounts: Record<string, number> = {};
    newFacets.forEach(f => { pitchCounts[f.pitch] = (pitchCounts[f.pitch] || 0) + f.areaSqft; });
    const predominantPitch = Object.entries(pitchCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "4/12";

    // Edge totals
    const edgeTotals: Record<string, number> = {};
    newEdges.forEach(e => { edgeTotals[e.edgeType] = (edgeTotals[e.edgeType] || 0) + e.lengthFt; });

    setComponents(prev => ({
      ...prev,
      totalAreaSqft: Math.round(totalFlatArea),
      totalSquares: +totalSquares.toFixed(2),
      pitchMultiplier: +avgMult.toFixed(3),
      wastePercent: Math.round(avgWaste),
      predominantPitch,
      facetsCount: newFacets.length,
      ridgeFt: Math.round(edgeTotals.ridge || 0),
      hipFt: Math.round(edgeTotals.hip || 0),
      valleyFt: Math.round(edgeTotals.valley || 0),
      eaveFt: Math.round(edgeTotals.eave || 0),
      rakeFt: Math.round(edgeTotals.rake || 0),
      dripEdgeFt: Math.round((edgeTotals.drip_edge || 0) + (edgeTotals.eave || 0) + (edgeTotals.rake || 0)),
      flashingFt: Math.round(edgeTotals.flashing || 0),
      stepFlashingFt: Math.round(edgeTotals.flashing || 0),
      perimeterFt: Math.round((edgeTotals.eave || 0) + (edgeTotals.rake || 0)),
    }));
  }, []);

  // ─── Auto-generate perimeter edges for a new facet ─────────────────
  const generatePerimeterEdges = useCallback((facet: RoofFacet, existingFacets: RoofFacet[]): RoofEdge[] => {
    const newEdges: RoofEdge[] = [];
    const verts = facet.vertices;
    if (verts.length < 3) return newEdges;

    for (let i = 0; i < verts.length; i++) {
      const start = verts[i];
      const end = verts[(i + 1) % verts.length];
      const len = distanceFt(start, end);

      // Check if this edge is shared with an existing facet (transition)
      let isShared = false;
      for (const other of existingFacets) {
        if (other.id === facet.id) continue;
        for (let j = 0; j < other.vertices.length; j++) {
          const oStart = other.vertices[j];
          const oEnd = other.vertices[(j + 1) % other.vertices.length];
          // Shared if both endpoints match (in either direction) within ~2ft
          const matchFwd = distanceFt(start, oStart) < 3 && distanceFt(end, oEnd) < 3;
          const matchRev = distanceFt(start, oEnd) < 3 && distanceFt(end, oStart) < 3;
          if (matchFwd || matchRev) { isShared = true; break; }
        }
        if (isShared) break;
      }

      // Classify: shared = transition, bottom = eave, sides = rake
      let edgeType: EdgeType;
      if (isShared) {
        edgeType = "transition";
      } else {
        // Simple heuristic: more horizontal edges → eave, more vertical → rake
        const dx = Math.abs(end[0] - start[0]);
        const dy = Math.abs(end[1] - start[1]);
        edgeType = dx > dy * 1.5 ? "eave" : dy > dx * 1.5 ? "rake" : "eave";
      }

      newEdges.push({
        id: crypto.randomUUID(),
        edgeType,
        startVertex: start,
        endVertex: end,
        lengthFt: Math.round(len),
      });
    }
    return newEdges;
  }, []);

  // Facet complete (manual) — with auto perimeter edges
  const handleFacetComplete = useCallback((facet: Omit<RoofFacet, "id" | "name" | "color">) => {
    const idx = facets.length;
    const newFacet: RoofFacet = {
      ...facet,
      id: crypto.randomUUID(),
      name: `Facet ${idx + 1}`,
      color: FACET_COLORS[idx % FACET_COLORS.length],
    };
    const newFacets = [...facets, newFacet];

    // Auto-generate perimeter edges
    const perimeterEdges = generatePerimeterEdges(newFacet, facets);
    const newEdges = [...edges, ...perimeterEdges];

    setFacets(newFacets);
    setEdges(newEdges);
    pushHistory(newFacets, newEdges);
    recalcFromFacets(newFacets, newEdges);
  }, [facets, edges, generatePerimeterEdges, recalcFromFacets]);

  // Edge complete (manual) — still allow manual edge drawing
  const handleEdgeComplete = useCallback((edge: Omit<RoofEdge, "id">) => {
    const newEdge: RoofEdge = { ...edge, id: crypto.randomUUID() };
    const newEdges = [...edges, newEdge];
    setEdges(newEdges);
    pushHistory(facets, newEdges);
    recalcFromFacets(facets, newEdges);
  }, [facets, edges, recalcFromFacets]);

  // Facet update from panel
  const handleUpdateFacet = useCallback((id: string, updates: Partial<RoofFacet>) => {
    const newFacets = facets.map(f => f.id === id ? { ...f, ...updates } : f);
    setFacets(newFacets);
    recalcFromFacets(newFacets, edges);
  }, [facets, edges, recalcFromFacets]);

  // Facet delete from panel
  const handleDeleteFacet = useCallback((id: string) => {
    // Remove facet and its associated auto-generated edges
    const newFacets = facets.filter(f => f.id !== id);
    // Remove edges that reference only deleted facet vertices (keep manually drawn)
    const deletedFacet = facets.find(f => f.id === id);
    let newEdges = edges;
    if (deletedFacet) {
      // Remove edges whose both endpoints belong to the deleted facet
      newEdges = edges.filter(e => {
        const startOnDeleted = deletedFacet.vertices.some(v => distanceFt(v, e.startVertex) < 3);
        const endOnDeleted = deletedFacet.vertices.some(v => distanceFt(v, e.endVertex) < 3);
        return !(startOnDeleted && endOnDeleted);
      });
    }
    setFacets(newFacets);
    setEdges(newEdges);
    setSelectedFacetId(null);
    pushHistory(newFacets, newEdges);
    recalcFromFacets(newFacets, newEdges);
  }, [facets, edges, recalcFromFacets]);

  // Computed
  const measuredPins = pins.filter(p => p.result).map(p => ({ pin: p, calc: calcPin(p)! }));
  const hasMeasurements = facets.length > 0 || measuredPins.length > 0;
  const aiTotalSquares = measuredPins.reduce((s, pc) => s + pc.calc.squares, 0);
  const manualTotalSquares = facets.reduce((s, f) => {
    const pitched = f.areaSqft * (PITCH_MULTIPLIERS[f.pitch] ?? 1);
    return s + pitched * (1 + f.wastePercent / 100) / 100;
  }, 0);
  const takeoff = calculateMaterialTakeoff(components);

  // Save
  const saveMeasurement = async () => {
    if (!hasMeasurements) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { toast({ title: "Authentication required", variant: "destructive" }); return; }
      const { data: memberData } = await supabase.from("company_members").select("company_id").eq("user_id", session.user.id).eq("is_active", true).limit(1).single();

      const { data: inserted, error: insertError } = await supabase.from("roof_measurements").insert({
        created_by: session.user.id, company_id: memberData?.company_id || null,
        address: address || "Unknown", latitude: center?.lat || null, longitude: center?.lng || null,
        source: mode === "ai" ? "ai_solar" : "manual",
        quality: mode === "ai" ? measuredPins[0]?.pin.result?.quality || null : null,
        complexity: components.complexity, segments_count: components.facetsCount,
        pitch: components.predominantPitch, pitch_multiplier: components.pitchMultiplier,
        waste_percent: components.wastePercent, total_area_sqft: Math.round(components.totalAreaSqft),
        total_squares: +components.totalSquares.toFixed(2),
        roof_type: pins.some(p => p.pitch === "Flat") ? "flat" : "pitched",
        ridge_ft: components.ridgeFt || null, hip_ft: components.hipFt || null,
        valley_ft: components.valleyFt || null, eave_ft: components.eaveFt || null,
        perimeter_ft: components.perimeterFt || null, rake_ft: components.rakeFt || null,
        step_flashing_ft: components.stepFlashingFt || null, headwall_ft: components.headwallFt || null,
        drip_edge_ft: components.dripEdgeFt || null, flashing_ft: components.flashingFt || null,
        pipe_boots_count: components.pipeBootsCount, skylights_count: components.skylightsCount,
        chimney_count: components.chimneyCount, facets_count: components.facetsCount,
        stories: components.stories, predominant_pitch: components.predominantPitch,
        material_takeoff: takeoff as any,
        solar_api_response: {
          pins: pins.filter(p => p.result).map(p => ({
            label: p.label, pitch: p.pitch, waste: p.wastePercent,
            area_sqft: calcPin(p)?.flatSqft, squares: calcPin(p)?.squares,
          })),
          facets: facets.map(f => ({ name: f.name, type: f.type, pitch: f.pitch, area_sqft: f.areaSqft, vertices: f.vertices })),
          edges: edges.map(e => ({ type: e.edgeType, length_ft: e.lengthFt, start_vertex: e.startVertex, end_vertex: e.endVertex })),
        } as any,
      }).select("id").single();

      if (insertError) throw insertError;
      setSaved(true);
      setSavedId(inserted.id);
      toast({ title: "Measurement saved", description: `${components.totalSquares.toFixed(2)} squares recorded.` });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const generateShareLink = async () => {
    if (!savedId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.from("measurement_reports").insert({
        measurement_id: savedId, created_by: session?.user?.id || null,
        report_data: { address, components, takeoff } as any,
      }).select("share_token").single();
      if (error) throw error;
      const url = `${window.location.origin}/report/${data.share_token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      toast({ title: "Share link copied!" });
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
  };

  const downloadPDF = () => {
    const doc = generateMeasurementPDF(address, components, takeoff, satelliteImage);
    doc.save(`roof-report-${(address || "property").replace(/[^a-zA-Z0-9]/g, "-").substring(0, 40)}.pdf`);
    toast({ title: "Report downloaded" });
  };

  return (
    <div className="flex flex-col">
      {/* Map Section - 65vh */}
      <div className="relative" style={{ height: "65vh" }}>
        {/* Top Bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2">
          <Button variant="secondary" size="icon" className="h-9 w-9 shadow-lg bg-background/95 backdrop-blur-sm shrink-0" onClick={() => navigate("/member/crm")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <AddressBar onSelect={handleAddressSelect} />
          {center && (
            <Tabs value={mode} onValueChange={(v) => { setMode(v as MeasurementMode); setActiveTool("select"); }}>
              <TabsList className="shadow-lg bg-background/95 backdrop-blur-sm">
                <TabsTrigger value="ai" className="gap-1.5 text-xs"><Satellite className="h-3.5 w-3.5" />AI Fast Measure</TabsTrigger>
                <TabsTrigger value="manual" className="gap-1.5 text-xs"><Pencil className="h-3.5 w-3.5" />Manual Measure</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {hasMeasurements && (
            <Badge variant="secondary" className="ml-auto text-sm font-bold shadow-lg bg-background/95 backdrop-blur-sm px-3 py-1.5">
              {(mode === "ai" ? aiTotalSquares : manualTotalSquares).toFixed(2)} sq
            </Badge>
          )}
        </div>

        {/* Left toolbar (manual mode) */}
        {center && mode === "manual" && (
          <div className="absolute top-16 left-3 z-10">
            <DrawingToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              activeEdgeType={activeEdgeType}
              onEdgeTypeChange={setActiveEdgeType}
              onUndo={undo}
              onRedo={redo}
               onDelete={() => { if (selectedFacetId) handleDeleteFacet(selectedFacetId); }}
              canUndo={historyIdx > 0}
              canRedo={historyIdx < history.length - 1}
              hasSelection={!!selectedFacetId}
            />
          </div>
        )}

        {/* Right panel (manual mode) — Facet List */}
        {center && mode === "manual" && (
          <div className="absolute top-16 right-3 z-10">
            <FacetListPanel
              facets={facets}
              edges={edges}
              selectedFacetId={selectedFacetId}
              onSelectFacet={setSelectedFacetId}
              onUpdateFacet={handleUpdateFacet}
              onDeleteFacet={handleDeleteFacet}
            />
          </div>
        )}

        {/* Left panel (AI mode) */}
        {center && mode === "ai" && (
          <div className="absolute top-16 left-3 z-10">
            <PinListPanel
              pins={pins} onAddPin={addPin} onRemovePin={removePin}
              onUpdatePin={updatePin} onMeasureAll={measureAllPins} measuring={measuring}
            />
          </div>
        )}

        {/* Map */}
        <MeasurementMap
          center={center}
          pins={mode === "ai" ? pins : []}
          onPinDrag={handlePinDrag}
          facets={facets}
          edges={edges}
          activeTool={mode === "manual" ? activeTool : "select"}
          activeEdgeType={activeEdgeType}
          onFacetComplete={handleFacetComplete}
          onEdgeComplete={handleEdgeComplete}
          onFacetSelect={setSelectedFacetId}
          selectedFacetId={selectedFacetId}
          showAIOverlay={aiAnalyzing}
        />

        {/* Bottom action bar */}
        {hasMeasurements && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
            <Button size="sm" className="shadow-lg text-xs" onClick={saveMeasurement} disabled={saving || saved}>
              {saving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving...</>
                : saved ? <><CheckCircle className="mr-1.5 h-3.5 w-3.5" />Saved</>
                : <><Save className="mr-1.5 h-3.5 w-3.5" />Save Measurement</>}
            </Button>
            <Button variant="outline" size="sm" className="shadow-lg bg-background/95 backdrop-blur-sm text-xs" onClick={downloadPDF}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />Generate Report
            </Button>
            {saved && savedId && (
              <>
                <Button variant="outline" size="sm" className="shadow-lg bg-background/95 backdrop-blur-sm text-xs" onClick={generateShareLink}>
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />{shareUrl ? "Copied!" : "Share Link"}
                </Button>
                <Button size="sm" className="shadow-lg bg-orange-500 hover:bg-orange-600 text-white text-xs" onClick={() => navigate(`/member/crm/estimates/new?measurement_id=${savedId}`)}>
                  <DollarSign className="mr-1.5 h-3.5 w-3.5" />Create Estimate
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Report Section Below Map */}
      <div ref={reportRef} className="bg-background border-t border-border">
        {hasMeasurements ? (
          <MeasurementReportPanel
            address={address}
            facets={facets}
            edges={edges}
            components={components}
            takeoff={takeoff}
            onComponentsChange={setComponents}
          />
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Satellite className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Measurement report will appear here after measuring</p>
          </div>
        )}
      </div>
    </div>
  );
}
