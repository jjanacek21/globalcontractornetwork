import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MeasurementMap } from "@/components/measurements/MeasurementMap";
import { PinListPanel } from "@/components/measurements/PinListPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RoofPin, RoofFacet, RoofEdge, DrawingTool, EdgeType, MeasurementMode } from "@/components/measurements/types";
import { EDGE_COLORS, EDGE_LABELS, FACET_COLORS } from "@/components/measurements/types";
import { calcPin, generateSimulatedFacets, createPinFacet, estimateComponentsFromSolar, polygonAreaSqft, polygonPerimeterFt } from "@/components/measurements/utils";
import { BrainCircuit, Pencil, MousePointer, Trash2 } from "lucide-react";

interface MeasurementData {
  total_squares: string;
  total_sf: string;
  waste_factor: string;
  ridges: string;
  hips: string;
  valleys: string;
  eaves: string;
  rakes: string;
  pipe_boots: string;
  roof_vents: string;
  skylights: string;
  num_facets: string;
  roof_pitch: string;
}

interface RoofScopeMeasurementStepProps {
  center: { lat: number; lng: number } | null;
  onMeasurementsChange: (data: MeasurementData) => void;
}

export function RoofScopeMeasurementStep({ center, onMeasurementsChange }: RoofScopeMeasurementStepProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<MeasurementMode>("ai");
  const [pins, setPins] = useState<RoofPin[]>([
    { id: "pin-1", lat: center?.lat || 0, lng: center?.lng || 0, pitch: "4/12", label: "Section 1", wastePercent: 13, loading: false, result: null, error: null },
  ]);
  const [facets, setFacets] = useState<RoofFacet[]>([]);
  const [edges, setEdges] = useState<RoofEdge[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const [activeEdgeType, setActiveEdgeType] = useState<EdgeType>("ridge");
  const [selectedFacetId, setSelectedFacetId] = useState<string | null>(null);
  const [measuring, setMeasuring] = useState(false);

  // Update pin positions when center changes
  useEffect(() => {
    if (center && pins.length === 1 && !pins[0].result) {
      setPins([{ ...pins[0], lat: center.lat, lng: center.lng }]);
    }
  }, [center?.lat, center?.lng]);

  // Push totals up whenever pins/facets change
  useEffect(() => {
    const measuredPins = pins.filter(p => p.result).map(p => ({ pin: p, calc: calcPin(p)! })).filter(pc => pc.calc);
    
    let totalSqft = 0;
    let totalSquares = 0;

    if (mode === "ai" && measuredPins.length > 0) {
      totalSqft = measuredPins.reduce((s, pc) => s + pc.calc.flatSqft, 0);
      totalSquares = measuredPins.reduce((s, pc) => s + pc.calc.squares, 0);
    } else if (mode === "manual" && facets.length > 0) {
      totalSqft = facets.reduce((s, f) => s + f.areaSqft, 0);
      totalSquares = totalSqft / 100;
    }

    // Get edge totals
    const edgeTotals: Record<string, number> = {};
    edges.forEach(e => { edgeTotals[e.edgeType] = (edgeTotals[e.edgeType] || 0) + e.lengthFt; });

    // Also get components from AI if available
    const components = mode === "ai" && measuredPins.length > 0
      ? estimateComponentsFromSolar(pins, totalSqft, totalSquares, edges.length > 0 ? edges : undefined)
      : {};

    const avgWaste = pins.length > 0 ? Math.round(pins.reduce((s, p) => s + p.wastePercent, 0) / pins.length) : 13;

    onMeasurementsChange({
      total_squares: totalSquares > 0 ? totalSquares.toFixed(2) : "",
      total_sf: totalSqft > 0 ? Math.round(totalSqft).toString() : "",
      waste_factor: String(avgWaste),
      ridges: String(Math.round(components.ridgeFt || edgeTotals.ridge || 0)),
      hips: String(Math.round(components.hipFt || edgeTotals.hip || 0)),
      valleys: String(Math.round(components.valleyFt || edgeTotals.valley || 0)),
      eaves: String(Math.round(components.eaveFt || edgeTotals.eave || 0)),
      rakes: String(Math.round(components.rakeFt || edgeTotals.rake || 0)),
      pipe_boots: String(components.pipeBootsCount || 0),
      roof_vents: "0",
      skylights: String(components.skylightsCount || 0),
      num_facets: components.facetsCount ? (components.facetsCount <= 4 ? "simple" : components.facetsCount <= 8 ? "moderate" : "complex") : "moderate",
      roof_pitch: components.predominantPitch ? pitchToCategory(components.predominantPitch) : "medium",
    });
  }, [pins, facets, edges, mode]);

  const pitchToCategory = (pitch: string): string => {
    const num = parseInt(pitch.split("/")[0]) || 0;
    if (num <= 2) return "flat";
    if (num <= 4) return "low";
    if (num <= 7) return "medium";
    if (num <= 10) return "steep";
    if (num <= 12) return "very_steep";
    return "extreme";
  };

  const handleAddPin = () => {
    const offset = pins.length * 0.0002;
    setPins(prev => [...prev, {
      id: `pin-${Date.now()}`,
      lat: (center?.lat || 0) + offset,
      lng: (center?.lng || 0) + offset,
      pitch: "4/12",
      label: `Section ${prev.length + 1}`,
      wastePercent: 13,
      loading: false,
      result: null,
      error: null,
    }]);
  };

  const handleRemovePin = (id: string) => setPins(prev => prev.filter(p => p.id !== id));

  const handleUpdatePin = (id: string, fields: Partial<RoofPin>) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
  };

  const handlePinDrag = (id: string, lat: number, lng: number) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, lat, lng, result: null, error: null } : p));
  };

  const handleMeasureAll = async () => {
    setMeasuring(true);
    const updated = [...pins];
    
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], loading: true, error: null };
      setPins([...updated]);
      
      try {
        const { data, error } = await supabase.functions.invoke("roof-vision-ai", {
          body: { lat: updated[i].lat, lng: updated[i].lng },
        });
        if (error) throw error;
        updated[i] = { ...updated[i], loading: false, result: data, error: null };
        
        // Generate facets/edges from AI data
        if (data?.segments && data.center) {
          const { facets: newFacets, edges: newEdges } = generateSimulatedFacets(
            { lat: data.center.latitude, lng: data.center.longitude },
            data.segments,
            data.total_flat_area_sqft
          );
          setFacets(prev => [...prev.filter(f => !f.id.startsWith(`facet-`)), ...newFacets]);
          setEdges(prev => [...prev.filter(e => !e.id.startsWith(`edge-`) && !e.id.startsWith(`eave-`) && !e.id.startsWith(`rake-`) && !e.id.startsWith(`ridge-`)), ...newEdges]);
        }
      } catch (err: any) {
        updated[i] = { ...updated[i], loading: false, error: err.message || "Measurement failed" };
      }
      setPins([...updated]);
    }
    
    setMeasuring(false);
    toast({ title: "Measurement complete", description: `${updated.filter(p => p.result).length} of ${updated.length} sections measured` });
  };

  const handleFacetComplete = (facet: Omit<RoofFacet, "id" | "name" | "color">) => {
    const idx = facets.length;
    setFacets(prev => [...prev, {
      ...facet,
      id: `manual-facet-${Date.now()}`,
      name: `Facet ${idx + 1}`,
      color: FACET_COLORS[idx % FACET_COLORS.length],
    }]);
  };

  const handleEdgeComplete = (edge: Omit<RoofEdge, "id">) => {
    setEdges(prev => [...prev, { ...edge, id: `manual-edge-${Date.now()}` }]);
  };

  const handleClearAll = () => {
    setFacets([]);
    setEdges([]);
    setPins(prev => prev.map(p => ({ ...p, result: null, error: null })));
  };

  if (!center) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-lg border border-dashed">
        <p className="text-muted-foreground text-sm">Enter a property address in Step 1 to load the satellite map</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={mode === "ai" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("ai"); setActiveTool("select"); }}
        >
          <BrainCircuit className="mr-1 h-4 w-4" />
          AI Fast Measure
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("manual")}
        >
          <Pencil className="mr-1 h-4 w-4" />
          Manual Polygon
        </Button>
        {(facets.length > 0 || edges.length > 0) && (
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-destructive">
            <Trash2 className="mr-1 h-3 w-3" />Clear All
          </Button>
        )}
      </div>

      {/* Map + Controls */}
      <div className="flex gap-4">
        <div className="flex-1 h-[550px] rounded-lg overflow-hidden border border-border">
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
          />
        </div>
      </div>

      {/* AI Pin List or Manual Drawing Toolbar */}
      {mode === "ai" ? (
        <PinListPanel
          pins={pins}
          onAddPin={handleAddPin}
          onRemovePin={handleRemovePin}
          onUpdatePin={handleUpdatePin}
          onMeasureAll={handleMeasureAll}
          measuring={measuring}
        />
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={activeTool === "select" ? "default" : "outline"} size="sm" onClick={() => setActiveTool("select")}>
            <MousePointer className="mr-1 h-3 w-3" />Select
          </Button>
          <Button variant={activeTool === "facet" ? "default" : "outline"} size="sm" onClick={() => setActiveTool("facet")}>
            <Pencil className="mr-1 h-3 w-3" />Draw Facet
          </Button>
          <div className="h-6 w-px bg-border" />
          <span className="text-xs text-muted-foreground">Edge Type:</span>
          {(Object.keys(EDGE_COLORS) as EdgeType[]).slice(0, 6).map(et => (
            <button
              key={et}
              onClick={() => { setActiveTool("edge"); setActiveEdgeType(et); }}
              className={`w-7 h-7 rounded-full border-2 transition-all ${activeTool === "edge" && activeEdgeType === et ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-70 hover:opacity-100"}`}
              style={{ backgroundColor: EDGE_COLORS[et], borderColor: "white" }}
              title={EDGE_LABELS[et]}
            />
          ))}
          {facets.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {facets.length} facet{facets.length !== 1 ? "s" : ""} · {Math.round(facets.reduce((s, f) => s + f.areaSqft, 0)).toLocaleString()} sqft
            </Badge>
          )}
        </div>
      )}

      {/* Summary */}
      {(pins.some(p => p.result) || facets.length > 0) && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total SF", value: mode === "ai" ? Math.round(pins.filter(p => p.result).reduce((s, p) => s + (calcPin(p)?.flatSqft || 0), 0)).toLocaleString() : Math.round(facets.reduce((s, f) => s + f.areaSqft, 0)).toLocaleString() },
            { label: "Total Squares", value: mode === "ai" ? pins.filter(p => p.result).reduce((s, p) => s + (calcPin(p)?.squares || 0), 0).toFixed(2) : (facets.reduce((s, f) => s + f.areaSqft, 0) / 100).toFixed(2) },
            { label: "Sections", value: mode === "ai" ? pins.filter(p => p.result).length.toString() : facets.length.toString() },
            { label: "Edges", value: edges.length.toString() },
          ].map(item => (
            <div key={item.label} className="bg-muted/50 rounded-lg p-3 text-center border">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
