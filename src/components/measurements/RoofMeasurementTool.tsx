import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Save, FileText, Link2, Loader2, ArrowLeft,
  Satellite, Pencil, CheckCircle, Share2
} from "lucide-react";
import { MeasurementMap } from "./MeasurementMap";
import { AddressBar } from "./AddressBar";
import { PinListPanel } from "./PinListPanel";
import { DrawingPanel } from "./DrawingPanel";
import { RoofComponentsPanel } from "./RoofComponentsPanel";
import { MaterialTakeoffPanel } from "./MaterialTakeoffPanel";
import { generateMeasurementPDF } from "./reportGenerator";
import {
  calcPin,
  calculateMaterialTakeoff,
  estimateComponentsFromSolar,
} from "./utils";
import type {
  RoofPin,
  SolarMeasurementData,
  DrawnPolygon,
  RoofComponents,
  MeasurementMode,
} from "./types";
import { DEFAULT_COMPONENTS } from "./types";

export function RoofMeasurementTool() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core state
  const [address, setAddress] = useState("");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mode, setMode] = useState<MeasurementMode>("ai");
  const [satelliteImage, setSatelliteImage] = useState<string>("");

  // AI mode state
  const [pins, setPins] = useState<RoofPin[]>([]);
  const [measuring, setMeasuring] = useState(false);

  // Draw mode state
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygons, setPolygons] = useState<DrawnPolygon[]>([]);

  // Components & takeoff
  const [components, setComponents] = useState<RoofComponents>(DEFAULT_COMPONENTS);
  const [showComponents, setShowComponents] = useState(false);
  const [showTakeoff, setShowTakeoff] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Address selection
  const handleAddressSelect = useCallback((addr: string, coords: { lat: number; lng: number }) => {
    setAddress(addr);
    setCenter(coords);
    setSaved(false);
    setSavedId(null);
    setShareUrl(null);
    // Auto-add initial pin in AI mode
    setPins([{
      id: crypto.randomUUID(),
      lat: coords.lat,
      lng: coords.lng,
      roofType: "pitched",
      label: "Main Roof",
      loading: false,
      result: null,
      error: null,
    }]);
  }, []);

  // Pin management
  const addPin = () => {
    if (pins.length === 0 || !center) return;
    const last = pins[pins.length - 1];
    setPins(prev => [...prev, {
      id: crypto.randomUUID(),
      lat: last.lat + 0.00015,
      lng: last.lng + 0.00015,
      roofType: "flat",
      label: `Flat ${prev.filter(p => p.roofType === "flat").length + 1}`,
      loading: false,
      result: null,
      error: null,
    }]);
  };

  const removePin = (id: string) => setPins(prev => prev.filter(p => p.id !== id));

  const updatePin = (id: string, field: Partial<RoofPin>) => {
    setPins(prev => prev.map(p =>
      p.id === id ? { ...p, ...field, result: field.roofType !== undefined ? null : p.result } : p
    ));
  };

  const handlePinDrag = useCallback((id: string, lat: number, lng: number) => {
    setPins(prev => prev.map(p =>
      p.id === id ? { ...p, lat, lng, result: null, error: null } : p
    ));
  }, []);

  // Measure all pins
  const measureAllPins = async () => {
    if (pins.length === 0) return;
    setMeasuring(true);
    setSaved(false);

    setPins(prev => prev.map(p => ({ ...p, loading: true, error: null })));

    const results = await Promise.all(pins.map(async (pin) => {
      try {
        const { data, error } = await supabase.functions.invoke("solar-roof-measure", {
          body: {
            latitude: pin.lat,
            longitude: pin.lng,
            address,
            roof_type_override: pin.roofType === "flat" ? "flat" : undefined,
          },
        });
        if (error || !data?.success || !data?.data) {
          return { ...pin, loading: false, error: data?.error || "Measurement failed", result: null };
        }
        // Capture satellite image from first result
        if (!satelliteImage && data.data.satellite_image) {
          setSatelliteImage(data.data.satellite_image);
        }
        return { ...pin, loading: false, error: null, result: data.data as SolarMeasurementData };
      } catch {
        return { ...pin, loading: false, error: "Measurement failed", result: null };
      }
    }));

    setPins(results);
    setMeasuring(false);

    // Auto-populate components from results
    const measuredPins = results.filter(p => p.result);
    if (measuredPins.length > 0) {
      const totalSqft = measuredPins.reduce((s, p) => s + (calcPin(p)?.pitchedSqft || 0), 0);
      const totalSquares = measuredPins.reduce((s, p) => s + (calcPin(p)?.squares || 0), 0);
      const estimated = estimateComponentsFromSolar(results, totalSqft, totalSquares);
      setComponents(prev => ({ ...prev, ...estimated }));
      setShowComponents(true);
    }
  };

  // Drawing mode
  const handlePolygonComplete = useCallback((polygon: DrawnPolygon) => {
    setPolygons(prev => [...prev, polygon]);
    setIsDrawing(false);

    // Update components with drawn data
    setTimeout(() => {
      setPolygons(current => {
        const totalArea = current.reduce((s, p) => s + p.areaSqft, 0);
        const totalPerimeter = current.reduce((s, p) => s + p.perimeterFt, 0);
        const pitched = totalArea * components.pitchMultiplier;
        const withWaste = pitched * (1 + components.wastePercent / 100);
        setComponents(prev => ({
          ...prev,
          totalAreaSqft: Math.round(totalArea),
          totalSquares: +(withWaste / 100).toFixed(2),
          perimeterFt: Math.round(totalPerimeter),
          eaveFt: Math.round(totalPerimeter * 0.5),
          rakeFt: Math.round(totalPerimeter * 0.25),
          ridgeFt: Math.round(Math.sqrt(totalArea) * 0.45),
        }));
        return current;
      });
      setShowComponents(true);
    }, 0);
  }, [components.pitchMultiplier, components.wastePercent]);

  // Computed values
  const measuredPins = pins.filter(p => p.result).map(p => ({ pin: p, calc: calcPin(p)! }));
  const aiTotalSquares = measuredPins.reduce((s, pc) => s + pc.calc.squares, 0);
  const drawTotalArea = polygons.reduce((s, p) => s + p.areaSqft, 0);
  const drawTotalSquares = (drawTotalArea * components.pitchMultiplier * (1 + components.wastePercent / 100)) / 100;

  const activeSquares = mode === "ai" ? aiTotalSquares : drawTotalSquares;
  const hasMeasurements = mode === "ai" ? measuredPins.length > 0 : polygons.length > 0;

  const takeoff = calculateMaterialTakeoff(components);

  // Save measurement
  const saveMeasurement = async () => {
    if (!hasMeasurements) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast({ title: "Authentication required", description: "Please log in to save.", variant: "destructive" });
        return;
      }

      // Get company_id
      const { data: memberData } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      const { data: inserted, error: insertError } = await supabase.from("roof_measurements").insert({
        created_by: session.user.id,
        company_id: memberData?.company_id || null,
        address: address || "Unknown",
        latitude: center?.lat || null,
        longitude: center?.lng || null,
        source: mode === "ai" ? "ai_solar" : "manual",
        quality: mode === "ai" ? measuredPins[0]?.pin.result?.quality || null : null,
        complexity: components.complexity,
        segments_count: components.facetsCount,
        pitch: components.predominantPitch,
        pitch_degrees: mode === "ai" ? measuredPins[0]?.pin.result?.average_pitch_degrees || null : null,
        pitch_multiplier: components.pitchMultiplier,
        waste_percent: components.wastePercent,
        total_area_sqft: Math.round(components.totalAreaSqft),
        total_squares: +components.totalSquares.toFixed(2),
        roof_type: pins.some(p => p.roofType === "flat") ? "flat" : "pitched",
        ridge_ft: components.ridgeFt || null,
        hip_ft: components.hipFt || null,
        valley_ft: components.valleyFt || null,
        eave_ft: components.eaveFt || null,
        perimeter_ft: components.perimeterFt || null,
        rake_ft: components.rakeFt || null,
        step_flashing_ft: components.stepFlashingFt || null,
        headwall_ft: components.headwallFt || null,
        drip_edge_ft: components.dripEdgeFt || null,
        flashing_ft: components.flashingFt || null,
        pipe_boots_count: components.pipeBootsCount,
        skylights_count: components.skylightsCount,
        chimney_count: components.chimneyCount,
        facets_count: components.facetsCount,
        stories: components.stories,
        predominant_pitch: components.predominantPitch,
        material_takeoff: takeoff as any,
        solar_api_response: mode === "ai" ? {
          pins: pins.map(p => ({
            id: p.id, label: p.label, roofType: p.roofType,
            lat: p.lat, lng: p.lng, calc: calcPin(p),
          })),
        } as any : null,
      }).select("id").single();

      if (insertError) throw insertError;

      setSaved(true);
      setSavedId(inserted.id);
      toast({ title: "Measurement saved", description: `${components.totalSquares.toFixed(2)} squares recorded.` });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Generate shareable link
  const generateShareLink = async () => {
    if (!savedId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.from("measurement_reports").insert({
        measurement_id: savedId,
        created_by: session?.user?.id || null,
        report_data: {
          address,
          components,
          takeoff,
        } as any,
      }).select("share_token").single();

      if (error) throw error;

      const url = `${window.location.origin}/report/${data.share_token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      toast({ title: "Share link copied!", description: "Link copied to clipboard." });
    } catch (err: any) {
      toast({ title: "Failed to generate link", description: err.message, variant: "destructive" });
    }
  };

  // Download PDF
  const downloadPDF = () => {
    const doc = generateMeasurementPDF(address, components, takeoff, satelliteImage);
    const filename = `roof-report-${(address || "property").replace(/[^a-zA-Z0-9]/g, "-").substring(0, 40)}.pdf`;
    doc.save(filename);
    toast({ title: "Report downloaded", description: filename });
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col relative">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 shadow-lg bg-background/95 backdrop-blur-sm shrink-0"
          onClick={() => navigate("/member/crm")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <AddressBar onSelect={handleAddressSelect} />

        {center && (
          <Tabs value={mode} onValueChange={(v) => {
            setMode(v as MeasurementMode);
            setIsDrawing(false);
          }}>
            <TabsList className="shadow-lg bg-background/95 backdrop-blur-sm">
              <TabsTrigger value="ai" className="gap-1.5 text-xs">
                <Satellite className="h-3.5 w-3.5" />AI Solar
              </TabsTrigger>
              <TabsTrigger value="draw" className="gap-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" />Manual Draw
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {hasMeasurements && (
          <Badge variant="secondary" className="ml-auto text-sm font-bold shadow-lg bg-background/95 backdrop-blur-sm px-3 py-1.5">
            {activeSquares.toFixed(2)} squares
          </Badge>
        )}
      </div>

      {/* Full-screen map */}
      <div className="flex-1">
        <MeasurementMap
          center={center}
          pins={mode === "ai" ? pins : []}
          onPinDrag={handlePinDrag}
          drawingMode={mode === "draw" && isDrawing}
          polygons={mode === "draw" ? polygons : []}
          onPolygonComplete={handlePolygonComplete}
        />
      </div>

      {/* Left floating panels */}
      {center && (
        <div className="absolute top-20 left-4 z-10 space-y-3">
          {mode === "ai" && (
            <PinListPanel
              pins={pins}
              onAddPin={addPin}
              onRemovePin={removePin}
              onUpdatePin={updatePin}
              onMeasureAll={measureAllPins}
              measuring={measuring}
            />
          )}
          {mode === "draw" && (
            <DrawingPanel
              polygons={polygons}
              isDrawing={isDrawing}
              onStartDrawing={() => setIsDrawing(true)}
              onStopDrawing={() => setIsDrawing(false)}
              onRemovePolygon={(id) => setPolygons(prev => prev.filter(p => p.id !== id))}
              onClearAll={() => setPolygons([])}
              pitchMultiplier={components.pitchMultiplier}
              wastePercent={components.wastePercent}
            />
          )}
        </div>
      )}

      {/* Right floating panels */}
      {showComponents && (
        <div className="absolute top-20 right-4 z-10 space-y-3">
          <RoofComponentsPanel components={components} onChange={setComponents} />
        </div>
      )}

      {showTakeoff && (
        <div className="absolute top-20 right-[22rem] z-10">
          <MaterialTakeoffPanel takeoff={takeoff} totalSquares={components.totalSquares} />
        </div>
      )}

      {/* Bottom action bar */}
      {center && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {hasMeasurements && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="shadow-lg bg-background/95 backdrop-blur-sm text-xs"
                onClick={() => setShowComponents(!showComponents)}
              >
                {showComponents ? "Hide" : "Show"} Components
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="shadow-lg bg-background/95 backdrop-blur-sm text-xs"
                onClick={() => setShowTakeoff(!showTakeoff)}
              >
                {showTakeoff ? "Hide" : "Show"} Materials
              </Button>
              <Button
                size="sm"
                className="shadow-lg text-xs"
                onClick={saveMeasurement}
                disabled={saving || saved}
              >
                {saving ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving...</>
                ) : saved ? (
                  <><CheckCircle className="mr-1.5 h-3.5 w-3.5" />Saved</>
                ) : (
                  <><Save className="mr-1.5 h-3.5 w-3.5" />Save</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shadow-lg bg-background/95 backdrop-blur-sm text-xs"
                onClick={downloadPDF}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />PDF Report
              </Button>
              {saved && savedId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-lg bg-background/95 backdrop-blur-sm text-xs"
                  onClick={generateShareLink}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  {shareUrl ? "Link Copied!" : "Share Link"}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
