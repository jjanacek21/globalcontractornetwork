import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Ruler, House, AlertCircle, MapPin, BrainCircuit,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Save, CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface Props {
  contactId: string;
  contactAddress: string | null;
  companyId: string | null;
  leadId?: string;
  onMeasurementSaved: () => void;
}

const NUDGE_AMOUNT = 0.00015;

export function InlineRoofMeasurement({ contactId, contactAddress, companyId, leadId, onMeasurementSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SolarMeasurementData | null>(null);
  const { toast } = useToast();

  const runMeasurement = async (latOverride?: number, lngOverride?: number) => {
    if (!contactAddress && latOverride == null) {
      setError("No property address found for this contact. Add a property first.");
      return;
    }

    setLoading(true);
    setError("");
    setSaved(false);

    try {
      let latitude = latOverride;
      let longitude = lngOverride;
      const address = contactAddress || "";

      // Geocode if we don't have overrides
      if (latitude == null || longitude == null) {
        const { data: geoData, error: geoError } = await supabase.functions.invoke("geocode-address", {
          body: { address },
        });
        if (geoError || !geoData?.latitude || !geoData?.longitude) {
          setError("Could not geocode this address. Please verify the property address is correct.");
          setLoading(false);
          return;
        }
        latitude = geoData.latitude;
        longitude = geoData.longitude;
      }

      const { data, error: invokeError } = await supabase.functions.invoke("solar-roof-measure", {
        body: { latitude, longitude, address },
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
    runMeasurement(result.center.latitude + dLat, result.center.longitude + dLng);
  };

  const saveMeasurement = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error: insertError } = await supabase.from("roof_measurements").insert({
        contact_id: contactId,
        company_id: companyId,
        lead_id: leadId || null,
        created_by: session?.user?.id || null,
        address: result.address,
        latitude: result.center.latitude,
        longitude: result.center.longitude,
        source: "ai_solar",
        quality: result.quality,
        complexity: result.complexity,
        segments_count: result.roof_segments_count,
        pitch_degrees: result.average_pitch_degrees,
        pitch_multiplier: result.pitch_multiplier,
        waste_percent: result.waste_percent,
        total_area_sqft: result.total_pitched_area_sqft,
        total_squares: result.total_squares,
        solar_api_response: result as any,
      });
      if (insertError) throw insertError;
      setSaved(true);
      toast({ title: "Measurement saved", description: `${result.total_squares.toFixed(2)} squares recorded for this contact.` });
      onMeasurementSaved();
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Run Measurement CTA */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">AI Roof Measurement</p>
                <p className="text-xs text-muted-foreground">
                  {contactAddress
                    ? `Measure roof at: ${contactAddress}`
                    : "No property address — add one in the Details tab"}
                </p>
              </div>
            </div>
            <Button
              onClick={() => runMeasurement()}
              disabled={loading || !contactAddress}
              className="sm:ml-auto bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Measuring...
                </>
              ) : (
                <>
                  <Ruler className="mr-2 h-4 w-4" />
                  Run AI Measurement
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inline Results */}
      {result && (
        <div className="space-y-4">
          {/* AI Warning Banner */}
          {result.ai_roof_type_warning && (
            <div className="rounded-md border border-primary/40 bg-primary/10 p-4 text-sm text-foreground flex items-start gap-3">
              <BrainCircuit className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">AI Roof Analysis</p>
                <p className="text-muted-foreground mt-1">{result.ai_roof_type_warning}</p>
              </div>
            </div>
          )}

          {/* Satellite Image with Nudge Controls */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-primary" />
                Satellite Verification
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Confirm the marker is on the correct roof. Use arrows to nudge.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative w-full">
                {result.satellite_image ? (
                  <img
                    src={result.satellite_image}
                    alt={`Satellite view of ${result.address}`}
                    className="w-full rounded-lg border border-border"
                    loading="eager"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-48 rounded-lg border border-border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                    Satellite image unavailable
                  </div>
                )}
                <div className="absolute bottom-3 right-3 grid grid-cols-3 gap-0.5">
                  <div />
                  <Button size="icon" variant="secondary" className="h-7 w-7 opacity-80 hover:opacity-100" onClick={() => nudge(NUDGE_AMOUNT, 0)} disabled={loading}><ChevronUp className="h-4 w-4" /></Button>
                  <div />
                  <Button size="icon" variant="secondary" className="h-7 w-7 opacity-80 hover:opacity-100" onClick={() => nudge(0, -NUDGE_AMOUNT)} disabled={loading}><ChevronLeft className="h-4 w-4" /></Button>
                  <div />
                  <Button size="icon" variant="secondary" className="h-7 w-7 opacity-80 hover:opacity-100" onClick={() => nudge(0, NUDGE_AMOUNT)} disabled={loading}><ChevronRight className="h-4 w-4" /></Button>
                  <div />
                  <Button size="icon" variant="secondary" className="h-7 w-7 opacity-80 hover:opacity-100" onClick={() => nudge(-NUDGE_AMOUNT, 0)} disabled={loading}><ChevronDown className="h-4 w-4" /></Button>
                  <div />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground">
                <span>{result.address}</span>
                <span>{result.center.latitude.toFixed(6)}, {result.center.longitude.toFixed(6)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Flat Area</p>
                <p className="text-xl font-bold">{result.total_flat_area_sqft.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">sq ft</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Pitched Area</p>
                <p className="text-xl font-bold">{result.total_pitched_area_sqft.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">sq ft</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Squares</p>
                <p className="text-xl font-bold text-primary">{result.total_squares.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Incl. {result.waste_percent}% waste</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs text-muted-foreground">Avg Pitch</p>
                  <Badge variant="outline" className="text-[10px]">{result.quality}</Badge>
                </div>
                <p className="text-xl font-bold">{result.average_pitch_degrees.toFixed(1)}°</p>
                <p className="text-[10px] text-muted-foreground">{result.complexity} · {result.roof_segments_count} segments</p>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3">
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
                <><Save className="mr-2 h-4 w-4" /> Save Measurement to Contact</>
              )}
            </Button>
            {saved && (
              <p className="text-sm text-green-600">Measurement linked to this contact and ready for estimates.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
