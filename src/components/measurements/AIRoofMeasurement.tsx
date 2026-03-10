import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AddressGeocoder } from "@/components/crm/AddressGeocoder";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Ruler, House, AlertCircle, MapPin, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, BrainCircuit } from "lucide-react";

interface Segment {
  id: string;
  area_sqft: number;
  pitch_degrees: number;
  pitch_over_12: number;
  azimuth_degrees: number;
}

interface SolarMeasurementData {
  address: string;
  quality: "HIGH" | "MEDIUM";
  complexity: string;
  roof_segments_count: number;
  average_pitch_degrees: number;
  average_pitch_over_12: number;
  pitch_multiplier: number;
  waste_percent: number;
  total_flat_area_sqft: number;
  total_pitched_area_sqft: number;
  total_with_waste_sqft: number;
  total_squares: number;
  max_panels_count: number;
  satellite_image: string;
  center: { latitude: number; longitude: number };
  segments: Segment[];
  ai_roof_type_suggestion: string | null;
  ai_roof_type_warning: string | null;
}

type RoofTypeOverride = "flat" | "low" | "pitched";

const OVERRIDE_CONFIG: Record<RoofTypeOverride, { label: string; multiplier: number; pitchDisplay: string }> = {
  flat: { label: "Flat Roof", multiplier: 1.00, pitchDisplay: "0°" },
  low: { label: "Low Slope", multiplier: 1.05, pitchDisplay: "~3°" },
  pitched: { label: "Pitched", multiplier: 0, pitchDisplay: "" },
};

const AI_TO_OVERRIDE: Record<string, RoofTypeOverride> = {
  flat: "flat",
  low_slope: "low",
  pitched: "pitched",
};

const NUDGE_AMOUNT = 0.00015;

export function AIRoofMeasurement() {
  const [selectedAddress, setSelectedAddress] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SolarMeasurementData | null>(null);
  const [roofType, setRoofType] = useState<RoofTypeOverride>("pitched");

  const canMeasure = useMemo(() => !!coordinates && !loading, [coordinates, loading]);

  const isOverrideActive = roofType !== "pitched";

  // Auto-select roof type when AI suggests a mismatch
  useEffect(() => {
    if (result?.ai_roof_type_suggestion && result.ai_roof_type_warning) {
      const mapped = AI_TO_OVERRIDE[result.ai_roof_type_suggestion];
      if (mapped) {
        setRoofType(mapped);
      }
    }
  }, [result?.ai_roof_type_suggestion, result?.ai_roof_type_warning]);

  const displayValues = useMemo(() => {
    if (!result) return null;
    if (!isOverrideActive) {
      return {
        pitchedArea: result.total_pitched_area_sqft,
        totalWithWaste: result.total_with_waste_sqft,
        totalSquares: result.total_squares,
        pitchDisplay: `${result.average_pitch_degrees.toFixed(1)}° (${result.average_pitch_over_12}/12)`,
        pitchMultiplier: result.pitch_multiplier,
      };
    }
    const cfg = OVERRIDE_CONFIG[roofType];
    const pitchedArea = Math.round(result.total_flat_area_sqft * cfg.multiplier);
    const totalWithWaste = Math.round(pitchedArea * (1 + result.waste_percent / 100));
    const totalSquares = totalWithWaste / 100;
    return {
      pitchedArea,
      totalWithWaste,
      totalSquares,
      pitchDisplay: cfg.pitchDisplay,
      pitchMultiplier: cfg.multiplier,
    };
  }, [result, roofType, isOverrideActive]);

  const handleAddressSelect = (address: string, coords: [number, number]) => {
    setSelectedAddress(address);
    setCoordinates(coords);
    setError("");
  };

  const runMeasurement = async (latOverride?: number, lngOverride?: number) => {
    const coords = coordinates;
    if (!coords && latOverride == null) return;

    setLoading(true);
    setError("");

    try {
      const longitude = lngOverride ?? coords![0];
      const latitude = latOverride ?? coords![1];
      const { data, error: invokeError } = await supabase.functions.invoke("solar-roof-measure", {
        body: { latitude, longitude, address: selectedAddress },
      });

      if (invokeError || !data?.success || !data?.data) {
        setResult(null);
        setError(data?.error || "Unable to measure this roof right now.");
        return;
      }

      setResult(data.data as SolarMeasurementData);
    } catch {
      setResult(null);
      setError("Unable to measure this roof right now.");
    } finally {
      setLoading(false);
    }
  };

  const nudge = (dLat: number, dLng: number) => {
    if (!result) return;
    const newLat = result.center.latitude + dLat;
    const newLng = result.center.longitude + dLng;
    runMeasurement(newLat, newLng);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <House className="h-5 w-5 text-primary" />
            AI Roof Measurement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddressGeocoder
            onSelect={handleAddressSelect}
            placeholder="Search property address to measure roof..."
          />

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">Roof Type</p>
            <ToggleGroup
              type="single"
              value={roofType}
              onValueChange={(v) => { if (v) setRoofType(v as RoofTypeOverride); }}
              className="justify-start"
            >
              <ToggleGroupItem value="flat" className="text-xs px-3">Flat Roof</ToggleGroupItem>
              <ToggleGroupItem value="low" className="text-xs px-3">Low Slope</ToggleGroupItem>
              <ToggleGroupItem value="pitched" className="text-xs px-3">Pitched</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              {roofType === "flat" && "Forces pitch multiplier to 1.00 — no slope adjustment"}
              {roofType === "low" && "Forces pitch multiplier to 1.05 — slight slope adjustment"}
              {roofType === "pitched" && "Uses Google Solar API pitch data as-is"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => runMeasurement()} disabled={!canMeasure} className="shadow-soft">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Measuring...
                </>
              ) : (
                <>
                  <Ruler className="mr-2 h-4 w-4" />
                  Measure Roof
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Uses Google Solar API + Mapbox satellite imagery + AI verification.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          {/* AI Roof Type Suggestion Banner */}
          {result.ai_roof_type_warning && (
            <div className="rounded-md border border-primary/40 bg-primary/10 p-4 text-sm text-foreground flex items-start gap-3">
              <BrainCircuit className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">AI Roof Analysis</p>
                <p className="text-muted-foreground mt-1">{result.ai_roof_type_warning}</p>
              </div>
            </div>
          )}

          {/* Satellite Verification Card */}
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-primary" />
                Verify Property Location
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Confirm the red marker is on the correct roof. Use arrows to nudge.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative w-full">
                {result.satellite_image ? (
                  <img
                    src={result.satellite_image}
                    alt={`Satellite view of ${result.address || "property"}`}
                    className="w-full rounded-lg border border-border"
                    loading="eager"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-48 rounded-lg border border-border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                    Satellite image unavailable for this location
                  </div>
                )}
                {/* Nudge controls overlay */}
                <div className="absolute bottom-3 right-3 grid grid-cols-3 gap-0.5">
                  <div />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 opacity-80 hover:opacity-100"
                    onClick={() => nudge(NUDGE_AMOUNT, 0)}
                    disabled={loading}
                    title="Nudge North"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <div />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 opacity-80 hover:opacity-100"
                    onClick={() => nudge(0, -NUDGE_AMOUNT)}
                    disabled={loading}
                    title="Nudge West"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 opacity-80 hover:opacity-100"
                    onClick={() => nudge(0, NUDGE_AMOUNT)}
                    disabled={loading}
                    title="Nudge East"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 opacity-80 hover:opacity-100"
                    onClick={() => nudge(-NUDGE_AMOUNT, 0)}
                    disabled={loading}
                    title="Nudge South"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <div />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground">
                <span>{result.address}</span>
                <span>
                  {result.center.latitude.toFixed(6)}, {result.center.longitude.toFixed(6)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Measurement Summary Cards */}
          {displayValues && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Flat Area</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{result.total_flat_area_sqft.toLocaleString()} sq ft</p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pitched Area</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{displayValues.pitchedArea.toLocaleString()} sq ft</p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total Squares</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{displayValues.totalSquares.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Includes {result.waste_percent}% waste</p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    Avg Pitch
                    {isOverrideActive && (
                      <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-600 bg-yellow-500/10">
                        User Override
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{displayValues.pitchDisplay}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isOverrideActive
                      ? `API reported ${result.average_pitch_degrees.toFixed(1)}° — overridden to ${OVERRIDE_CONFIG[roofType].label}`
                      : `${result.complexity} • ${result.quality} quality`}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Segments Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Roof Segments ({result.roof_segments_count})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment</TableHead>
                    <TableHead>Area (sq ft)</TableHead>
                    <TableHead>Pitch</TableHead>
                    <TableHead>Azimuth (°)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.segments.map((segment, index) => (
                    <TableRow key={`${segment.id}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{segment.area_sqft.toLocaleString()}</TableCell>
                      <TableCell>{segment.pitch_degrees.toFixed(1)}</TableCell>
                      <TableCell>{segment.azimuth_degrees.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
