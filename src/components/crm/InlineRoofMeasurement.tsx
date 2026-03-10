import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, AlertCircle, MapPin, BrainCircuit,
  Save, CheckCircle, PenLine, DollarSign,
  Plus, Trash2, FileText, LocateFixed
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SolarMeasurementData {
  address: string;
  quality: "HIGH" | "MEDIUM";
  complexity: string;
  roof_segments_count: number;
  average_pitch_degrees: number;
  pitch_multiplier: number;
  waste_percent: number;
  total_flat_area_sqft: number;
  total_pitched_area_sqft: number;
  total_with_waste_sqft: number;
  total_squares: number;
  satellite_image: string;
  center: { latitude: number; longitude: number };
  segments: Array<{ id: string; area_sqft: number; pitch_degrees: number; azimuth_degrees: number }>;
  ai_roof_type_suggestion: string | null;
  ai_roof_type_warning: string | null;
}

type PinRoofType = "flat" | "pitched";

interface RoofPin {
  id: string;
  lat: number;
  lng: number;
  roofType: PinRoofType;
  label: string;
  loading: boolean;
  result: SolarMeasurementData | null;
  error: string | null;
}

interface PinCalc {
  flatSqft: number;
  multiplier: number;
  waste: number;
  pitchedSqft: number;
  withWaste: number;
  squares: number;
}

interface Props {
  contactId: string;
  contactAddress: string | null;
  companyId: string | null;
  leadId?: string;
  autoTrigger?: boolean;
  onMeasurementSaved: (measurementId?: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcPin(pin: RoofPin): PinCalc | null {
  if (!pin.result) return null;
  const flatSqft = pin.result.total_flat_area_sqft;
  const multiplier = pin.roofType === "flat" ? 1.0 : pin.result.pitch_multiplier;
  const waste = pin.roofType === "flat" ? 5 : pin.result.waste_percent;
  const pitchedSqft = flatSqft * multiplier;
  const withWaste = pitchedSqft * (1 + waste / 100);
  const squares = withWaste / 100;
  return { flatSqft, multiplier, waste, pitchedSqft, withWaste, squares };
}

const PIN_COLORS: Record<PinRoofType, string> = { flat: "#3b82f6", pitched: "#ef4444" };

// ─── Component ───────────────────────────────────────────────────────────────

export function InlineRoofMeasurement({ contactId, contactAddress, companyId, leadId, autoTrigger, onMeasurementSaved }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const hasAutoTriggered = useRef(false);

  const [pins, setPins] = useState<RoofPin[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedMeasurementId, setSavedMeasurementId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Manual entry
  const [showManual, setShowManual] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualData, setManualData] = useState({ squares: "", sqft: "", pitch: "4/12", complexity: "moderate" });

  // ── Geocode address → initial center ──
  const geocodeAndInit = useCallback(async () => {
    if (!contactAddress) return;
    setGeocoding(true);
    setError("");
    try {
      const { data: geoData, error: geoError } = await supabase.functions.invoke("geocode-address", {
        body: { query: contactAddress, limit: 1 },
      });
      if (geoError || !geoData?.success || !geoData?.features?.length) {
        setError("Could not geocode this address.");
        return;
      }
      const [lng, lat] = geoData.features[0].center;
      initMap(lat, lng);
    } catch {
      setError("Could not geocode this address.");
    } finally {
      setGeocoding(false);
    }
  }, [contactAddress]);

  // Pending center to init map after container mounts
  const pendingCenter = useRef<{ lat: number; lng: number } | null>(null);

  // ── Initialize Mapbox map ──
  const initMap = useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 19 });
      addPinAtLocation(lat, lng, "pitched", "Main Roof");
      return;
    }

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) return;

    // If container not yet mounted, store pending center and add pin to trigger render
    if (!mapContainerRef.current) {
      pendingCenter.current = { lat, lng };
      addPinAtLocation(lat, lng, "pitched", "Main Roof");
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [lng, lat],
      zoom: 19,
      pitch: 0,
      bearing: 0,
    });

    map.on("load", () => {
      mapRef.current = map;
      setMapReady(true);
      addPinAtLocation(lat, lng, "pitched", "Main Roof");
    });
  }, []);

  // ── Init map when container becomes available after pin triggers render ──
  useEffect(() => {
    if (pendingCenter.current && mapContainerRef.current && !mapRef.current) {
      const { lat, lng } = pendingCenter.current;
      pendingCenter.current = null;

      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!token) return;

      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: [lng, lat],
        zoom: 19,
        pitch: 0,
        bearing: 0,
      });

      map.on("load", () => {
        mapRef.current = map;
        setMapReady(true);
      });
    }
  }, [pins.length]);

  // ── Auto-trigger ──
  useEffect(() => {
    if (autoTrigger && contactAddress && !hasAutoTriggered.current && !geocoding && pins.length === 0) {
      hasAutoTriggered.current = true;
      geocodeAndInit();
    }
  }, [autoTrigger, contactAddress, geocoding, pins.length, geocodeAndInit]);

  // ── Sync markers with pins ──
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const currentIds = new Set(pins.map(p => p.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add / update markers
    pins.forEach((pin) => {
      let marker = markersRef.current.get(pin.id);
      if (!marker) {
        const el = document.createElement("div");
        el.style.width = "28px";
        el.style.height = "28px";
        el.style.borderRadius = "50%";
        el.style.border = "3px solid white";
        el.style.cursor = "grab";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
        el.style.transition = "background-color 0.2s";
        el.title = pin.label;

        marker = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map);

        marker.on("dragend", () => {
          const lngLat = marker!.getLngLat();
          setPins(prev => prev.map(p =>
            p.id === pin.id ? { ...p, lat: lngLat.lat, lng: lngLat.lng, result: null, error: null } : p
          ));
        });

        markersRef.current.set(pin.id, marker);
      }

      // Update color
      const el = marker.getElement();
      el.style.backgroundColor = PIN_COLORS[pin.roofType];
      el.title = pin.label;

      // Update position if not dragging
      const currentPos = marker.getLngLat();
      if (Math.abs(currentPos.lat - pin.lat) > 0.000001 || Math.abs(currentPos.lng - pin.lng) > 0.000001) {
        marker.setLngLat([pin.lng, pin.lat]);
      }
    });
  }, [pins]);

  // ── Pin management ──
  const addPinAtLocation = (lat: number, lng: number, roofType: PinRoofType, label: string) => {
    setPins(prev => {
      // Don't add if one already exists at almost the same spot
      const exists = prev.some(p => Math.abs(p.lat - lat) < 0.00001 && Math.abs(p.lng - lng) < 0.00001);
      if (exists) return prev;
      return [...prev, {
        id: crypto.randomUUID(),
        lat, lng, roofType, label,
        loading: false, result: null, error: null,
      }];
    });
  };

  const addPin = () => {
    if (pins.length === 0) return;
    const last = pins[pins.length - 1];
    // Offset slightly so the new pin is visible
    const offset = 0.00015;
    addPinAtLocation(
      last.lat + offset,
      last.lng + offset,
      "flat",
      `Flat Roof ${pins.filter(p => p.roofType === "flat").length + 1}`
    );
  };

  const removePin = (id: string) => {
    setPins(prev => prev.filter(p => p.id !== id));
  };

  const updatePinField = (id: string, field: Partial<RoofPin>) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, ...field, result: field.roofType !== undefined ? null : p.result } : p));
  };

  // ── Measure a single pin ──
  const measurePin = async (pin: RoofPin): Promise<RoofPin> => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("solar-roof-measure", {
        body: {
          latitude: pin.lat,
          longitude: pin.lng,
          address: contactAddress || "",
          roof_type_override: pin.roofType === "flat" ? "flat" : undefined,
        },
      });

      if (invokeError || !data?.success || !data?.data) {
        return { ...pin, loading: false, error: data?.error || "Unable to measure at this location.", result: null };
      }

      return { ...pin, loading: false, error: null, result: data.data as SolarMeasurementData };
    } catch {
      return { ...pin, loading: false, error: "Measurement failed.", result: null };
    }
  };

  // ── Measure all pins ──
  const measureAllPins = async () => {
    if (pins.length === 0) return;
    setMeasuring(true);
    setSaved(false);
    setSavedMeasurementId(null);

    // Mark all as loading
    setPins(prev => prev.map(p => ({ ...p, loading: true, error: null })));

    const results = await Promise.all(pins.map(p => measurePin(p)));
    setPins(results);
    setMeasuring(false);
  };

  // ── Computed totals ──
  const pinCalcs = pins.map(p => ({ pin: p, calc: calcPin(p) }));
  const measuredPins = pinCalcs.filter(pc => pc.calc !== null);
  const totalSquares = measuredPins.reduce((sum, pc) => sum + (pc.calc?.squares || 0), 0);
  const totalSqft = measuredPins.reduce((sum, pc) => sum + (pc.calc?.pitchedSqft || 0), 0);
  const hasMeasurements = measuredPins.length > 0;

  // ── Save ──
  const resolveCompanyId = async (): Promise<string | null> => {
    if (companyId) return companyId;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;
    const { data } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .limit(1)
      .single();
    return data?.company_id || null;
  };

  const saveMeasurement = async () => {
    if (!hasMeasurements) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast({ title: "Authentication required", description: "Please log in to save measurements.", variant: "destructive" });
        return;
      }
      const resolvedCompanyId = await resolveCompanyId();
      const firstMeasured = measuredPins[0];
      const primaryResult = firstMeasured.pin.result!;

      const { data: inserted, error: insertError } = await supabase.from("roof_measurements").insert({
        contact_id: contactId,
        company_id: resolvedCompanyId,
        lead_id: leadId || null,
        created_by: session.user.id,
        address: primaryResult.address || contactAddress || "",
        latitude: primaryResult.center.latitude,
        longitude: primaryResult.center.longitude,
        source: "ai_solar",
        quality: primaryResult.quality,
        complexity: primaryResult.complexity,
        segments_count: primaryResult.roof_segments_count,
        pitch_degrees: primaryResult.average_pitch_degrees,
        pitch_multiplier: firstMeasured.calc!.multiplier,
        waste_percent: firstMeasured.calc!.waste,
        total_area_sqft: Math.round(totalSqft),
        total_squares: totalSquares,
        roof_type: pins.some(p => p.roofType === "pitched") ? "pitched" : "flat",
        solar_api_response: {
          pins: pins.map(p => ({
            id: p.id,
            label: p.label,
            roofType: p.roofType,
            lat: p.lat,
            lng: p.lng,
            result: p.result,
            calc: calcPin(p),
          })),
          combined_squares: totalSquares,
          combined_sqft: Math.round(totalSqft),
        } as any,
      }).select("id").single();
      if (insertError) throw insertError;
      setSaved(true);
      setSavedMeasurementId(inserted.id);
      toast({ title: "Measurement saved", description: `${totalSquares.toFixed(2)} combined squares recorded.` });
      onMeasurementSaved(inserted.id);
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Manual save ──
  const saveManualMeasurement = async () => {
    const squares = parseFloat(manualData.squares);
    const sqft = parseFloat(manualData.sqft);
    if (!squares || !sqft) {
      toast({ title: "Missing fields", description: "Please enter both squares and sq ft.", variant: "destructive" });
      return;
    }
    setManualSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast({ title: "Authentication required", variant: "destructive" });
        return;
      }
      const resolvedCompanyId = await resolveCompanyId();
      const { data: inserted, error: insertError } = await supabase.from("roof_measurements").insert({
        contact_id: contactId,
        company_id: resolvedCompanyId,
        lead_id: leadId || null,
        created_by: session.user.id,
        address: contactAddress || "Manual entry",
        source: "manual",
        complexity: manualData.complexity,
        pitch: manualData.pitch,
        total_area_sqft: sqft,
        total_squares: squares,
        roof_type: manualData.pitch === "Flat" ? "flat" : "pitched",
      }).select("id").single();
      if (insertError) throw insertError;
      toast({ title: "Manual measurement saved", description: `${squares} squares recorded.` });
      setSavedMeasurementId(inserted.id);
      setManualData({ squares: "", sqft: "", pitch: "4/12", complexity: "moderate" });
      setShowManual(false);
      onMeasurementSaved(inserted.id);
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setManualSaving(false);
    }
  };

  // ── PDF Report ──
  const generateReport = () => {
    if (!hasMeasurements) return;
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(18);
    doc.text("Roof Measurement Report", margin, y); y += 12;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y); y += 14;
    doc.setTextColor(0);

    doc.setFontSize(12);
    doc.text("Property Details", margin, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Address: ${contactAddress || "N/A"}`, margin, y); y += 6;
    doc.text(`Total Pins Measured: ${measuredPins.length}`, margin, y); y += 12;

    measuredPins.forEach(({ pin, calc }, idx) => {
      if (y > 250) { doc.addPage(); y = margin; }
      doc.setFontSize(12);
      doc.text(`Pin ${idx + 1}: ${pin.label} (${pin.roofType === "flat" ? "Flat" : "Pitched"})`, margin, y); y += 7;
      doc.setFontSize(10);
      doc.text(`Coordinates: ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`, margin, y); y += 5;
      doc.text(`Flat Area: ${calc!.flatSqft.toLocaleString()} sq ft`, margin, y); y += 5;
      doc.text(`Multiplier: ×${calc!.multiplier.toFixed(2)} | Waste: ${calc!.waste}%`, margin, y); y += 5;
      doc.text(`Pitched Area: ${Math.round(calc!.pitchedSqft).toLocaleString()} sq ft`, margin, y); y += 5;
      doc.text(`Squares: ${calc!.squares.toFixed(2)}`, margin, y); y += 10;
    });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Combined Total: ${totalSquares.toFixed(2)} squares (${Math.round(totalSqft).toLocaleString()} sq ft)`, margin, y);
    doc.setFont("helvetica", "normal");

    const filename = `roof-report-${(contactAddress || "property").replace(/[^a-zA-Z0-9]/g, "-").substring(0, 40)}.pdf`;
    doc.save(filename);
    toast({ title: "Report downloaded", description: filename });
  };

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.remove());
      mapRef.current?.remove();
    };
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={geocodeAndInit}
          disabled={geocoding || !contactAddress}
          className="bg-primary hover:bg-primary/90"
        >
          {geocoding ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Locating...</>
          ) : (
            <><LocateFixed className="mr-2 h-4 w-4" />Load Satellite Map</>
          )}
        </Button>
        <Button variant="outline" onClick={() => setShowManual(!showManual)}>
          <PenLine className="mr-2 h-4 w-4" />Enter Manual Measurement
        </Button>
      </div>

      {/* Address info */}
      {pins.length === 0 && !showManual && (
        <p className="text-sm text-muted-foreground">
          {contactAddress
            ? `Will load satellite map for: ${contactAddress}`
            : "No property address found — add one in the Details tab first."}
        </p>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          {error}
        </div>
      )}

      {/* Manual Entry */}
      {showManual && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PenLine className="h-4 w-4" />Manual Measurement Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Total Squares</Label>
                <Input type="number" step="0.01" placeholder="e.g. 28.5" value={manualData.squares} onChange={(e) => setManualData(prev => ({ ...prev, squares: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Total Sq Ft</Label>
                <Input type="number" placeholder="e.g. 2850" value={manualData.sqft} onChange={(e) => setManualData(prev => ({ ...prev, sqft: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pitch</Label>
                <Select value={manualData.pitch} onValueChange={(v) => setManualData(prev => ({ ...prev, pitch: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Flat", "1/12", "2/12", "3/12", "4/12", "5/12", "6/12", "7/12", "8/12", "9/12", "10/12", "11/12", "12/12"].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Complexity</Label>
                <Select value={manualData.complexity} onValueChange={(v) => setManualData(prev => ({ ...prev, complexity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple (Gable)</SelectItem>
                    <SelectItem value="moderate">Moderate (Hip)</SelectItem>
                    <SelectItem value="complex">Complex (10+ facets)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={saveManualMeasurement} disabled={manualSaving} size="sm">
                {manualSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Manual Measurement
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowManual(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Map + Pins */}
      {pins.length > 0 && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-foreground flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Multi-Pin Measurement</p>
              <p className="text-muted-foreground mt-0.5">
                Drag each pin to the center of a roof section. Select Flat or Pitched for each.
                Click <strong>Measure All Pins</strong> to get area data at each location.
              </p>
            </div>
          </div>

          {/* Map */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-primary" />Satellite Map
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addPin}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />Add Pin
                  </Button>
                  <Button
                    size="sm"
                    onClick={measureAllPins}
                    disabled={measuring || pins.length === 0}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {measuring ? (
                      <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Measuring...</>
                    ) : (
                      <><BrainCircuit className="mr-1.5 h-3.5 w-3.5" />Measure All Pins</>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-full mr-1 align-middle" style={{ backgroundColor: PIN_COLORS.pitched }} /> Pitched
                <span className="inline-block w-3 h-3 rounded-full ml-3 mr-1 align-middle" style={{ backgroundColor: PIN_COLORS.flat }} /> Flat
              </p>
            </CardHeader>
            <CardContent>
              <div
                ref={mapContainerRef}
                className="w-full rounded-lg border border-border overflow-hidden"
                style={{ height: "400px" }}
              />
            </CardContent>
          </Card>

          {/* Pin List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Roof Pins ({pins.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pins.map((pin, idx) => {
                const pc = calcPin(pin);
                return (
                  <div
                    key={pin.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    {/* Pin indicator */}
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shrink-0 shadow-sm flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: PIN_COLORS[pin.roofType] }}
                    >
                      {idx + 1}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <Input
                        value={pin.label}
                        onChange={(e) => updatePinField(pin.id, { label: e.target.value })}
                        className="h-7 text-sm bg-background"
                      />
                    </div>

                    {/* Roof type */}
                    <Select
                      value={pin.roofType}
                      onValueChange={(v) => updatePinField(pin.id, { roofType: v as PinRoofType, label: v === "flat" ? `Flat Roof ${idx + 1}` : `Pitched Roof ${idx + 1}` })}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat Roof</SelectItem>
                        <SelectItem value="pitched">Pitched Roof</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Result or loading */}
                    <div className="w-24 text-right text-sm">
                      {pin.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-auto text-muted-foreground" />
                      ) : pin.error ? (
                        <span className="text-xs text-destructive">Error</span>
                      ) : pc ? (
                        <span className="font-bold text-primary">{pc.squares.toFixed(2)} sq</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not measured</span>
                      )}
                    </div>

                    {/* Remove */}
                    {pins.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                        onClick={() => removePin(pin.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* Per-pin detail cards when measured */}
              {measuredPins.length > 0 && (
                <div className="pt-3 border-t border-border space-y-2">
                  {measuredPins.map(({ pin, calc }) => (
                    <div key={pin.id} className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded bg-background border border-border">
                        <p className="text-muted-foreground">Flat Area</p>
                        <p className="font-semibold">{calc!.flatSqft.toLocaleString()} sqft</p>
                      </div>
                      <div className="p-2 rounded bg-background border border-border">
                        <p className="text-muted-foreground">Multiplier</p>
                        <p className="font-semibold">×{calc!.multiplier.toFixed(2)}</p>
                      </div>
                      <div className="p-2 rounded bg-background border border-border">
                        <p className="text-muted-foreground">Waste</p>
                        <p className="font-semibold">{calc!.waste}%</p>
                      </div>
                      <div className="p-2 rounded bg-background border border-border">
                        <p className="text-muted-foreground">{pin.label}</p>
                        <p className="font-bold text-primary">{calc!.squares.toFixed(2)} squares</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Combined Total */}
              {measuredPins.length > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-sm font-medium">Combined Total</p>
                    <p className="text-xs text-muted-foreground">{Math.round(totalSqft).toLocaleString()} sq ft across {measuredPins.length} sections</p>
                  </div>
                  <p className="text-xl font-bold text-primary">{totalSquares.toFixed(2)} squares</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save / Report / Estimate */}
          {hasMeasurements && (
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={saveMeasurement}
                disabled={saving || saved}
                className={saved ? "bg-green-600 hover:bg-green-600" : ""}
              >
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : saved ? (
                  <><CheckCircle className="mr-2 h-4 w-4" /> Saved</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Measurement</>
                )}
              </Button>
              <Button variant="outline" onClick={generateReport}>
                <FileText className="mr-2 h-4 w-4" /> Generate Report
              </Button>
              {saved && savedMeasurementId && (
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => navigate(`/member/crm/estimates/new?contact_id=${contactId}&measurement_id=${savedMeasurementId}`)}
                >
                  <DollarSign className="mr-2 h-4 w-4" /> Create Estimate
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
