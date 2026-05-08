import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Camera, Satellite, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { MeasurementResult } from "./RoofMapMeasureStep";

export interface ConditionAnalysis {
  severity: "minor" | "moderate" | "severe" | "unknown";
  material: string;
  issues: string[];
  recommendations: string[];
  notes?: string;
  source: "satellite" | "photos";
}

interface Props {
  measurement: MeasurementResult;
  coords: { lat: number; lng: number };
  address: string;
  onBack: () => void;
  onSkip?: () => void;
  onComplete: (condition: ConditionAnalysis) => void;
}

interface UploadedPhoto {
  file: File;
  previewUrl: string;
  analyzing: boolean;
  result: { material?: string; condition?: string; issues?: string[]; recommendations?: string[] } | null;
  error: string | null;
}

const SEVERITY_FROM_TEXT = (text: string): ConditionAnalysis["severity"] => {
  const t = text.toLowerCase();
  if (/severe|major|extensive|hurricane|catastrophic|leak/.test(t)) return "severe";
  if (/moderate|some|noticeable|aging|wear/.test(t)) return "moderate";
  if (/minor|good|fair|light/.test(t)) return "minor";
  return "unknown";
};

export function RoofConditionStep({ measurement, coords, address, onBack, onComplete }: Props) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [satelliteAnalyzing, setSatelliteAnalyzing] = useState(false);
  const [satelliteResult, setSatelliteResult] = useState<ConditionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 8);
    setPhotos((prev) => [
      ...prev,
      ...files.map((f) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        analyzing: false,
        result: null,
        error: null,
      })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const analyzePhoto = async (i: number) => {
    setPhotos((prev) => prev.map((p, idx) => (idx === i ? { ...p, analyzing: true, error: null } : p)));
    try {
      const base64 = await fileToBase64(photos[i].file);
      const { data, error: fnErr } = await supabase.functions.invoke("instant-quote-ai", {
        body: {
          action: "analyze-photo",
          photoBase64: base64,
          serviceType: "roofing",
          propertyType: "residential",
          tradeAnswers: {},
        },
      });
      if (fnErr) throw new Error(fnErr.message);
      setPhotos((prev) =>
        prev.map((p, idx) =>
          idx === i
            ? {
                ...p,
                analyzing: false,
                result: {
                  material: data?.material,
                  condition: data?.condition,
                  issues: data?.issues || [],
                  recommendations: data?.recommendations || [],
                },
              }
            : p,
        ),
      );
    } catch (err) {
      setPhotos((prev) =>
        prev.map((p, idx) =>
          idx === i ? { ...p, analyzing: false, error: err instanceof Error ? err.message : "Failed" } : p,
        ),
      );
    }
  };

  const analyzeSatellite = async () => {
    setSatelliteAnalyzing(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("roof-vision-ai", {
        body: { latitude: coords.lat, longitude: coords.lng, address, zoomLevel: 20 },
      });
      if (fnErr || !data?.estimation) throw new Error(fnErr?.message || "Satellite analysis failed");
      const est = data.estimation;
      const issues: string[] = [];
      if (est.degradationNotes) issues.push(est.degradationNotes);
      const severity =
        est.estimatedAgeYears && est.estimatedAgeYears > 18
          ? "severe"
          : est.estimatedAgeYears && est.estimatedAgeYears > 12
          ? "moderate"
          : "minor";
      const result: ConditionAnalysis = {
        severity,
        material: est.primaryRoofColor ? `${est.primaryRoofColor} roofing material` : "Unknown",
        issues,
        recommendations: severity === "severe" ? ["Full replacement recommended"] : ["Inspection recommended"],
        notes: est.degradationNotes ?? undefined,
        source: "satellite",
      };
      setSatelliteResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Satellite analysis failed");
    } finally {
      setSatelliteAnalyzing(false);
    }
  };

  const buildCondition = (): ConditionAnalysis => {
    const photoIssues = photos.flatMap((p) => p.result?.issues ?? []);
    const photoRecs = photos.flatMap((p) => p.result?.recommendations ?? []);
    const photoMat = photos.find((p) => p.result?.material)?.result?.material;
    const photoSev = photos
      .map((p) => SEVERITY_FROM_TEXT(p.result?.condition ?? ""))
      .find((s) => s !== "unknown");

    if (photos.some((p) => p.result)) {
      return {
        severity: photoSev ?? satelliteResult?.severity ?? "unknown",
        material: photoMat || satelliteResult?.material || "Unknown",
        issues: [...new Set([...photoIssues, ...(satelliteResult?.issues ?? [])])],
        recommendations: [...new Set([...photoRecs, ...(satelliteResult?.recommendations ?? [])])],
        source: "photos",
      };
    }
    return (
      satelliteResult ?? {
        severity: "unknown",
        material: "Unknown",
        issues: [],
        recommendations: [],
        source: "satellite",
      }
    );
  };

  const hasAnyResult = satelliteResult || photos.some((p) => p.result);

  return (
    <div className="max-w-3xl mx-auto pt-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h2 className="text-lg font-semibold mb-2">Analyze your roof's condition</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose one or both — we'll combine the findings into a more accurate estimate.
      </p>

      {/* Satellite analysis */}
      <div className="rounded-2xl border bg-card p-4 mb-4">
        <div className="flex items-start gap-3">
          <Satellite className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">AI satellite analysis</p>
            <p className="text-xs text-muted-foreground">
              Have AI inspect the satellite image of your roof for visible wear, age, and damage.
            </p>
          </div>
          <Button onClick={analyzeSatellite} disabled={satelliteAnalyzing} size="sm" variant="outline">
            {satelliteAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
          </Button>
        </div>
        {satelliteResult && (
          <div className="mt-3 p-3 rounded-lg bg-muted/40 text-sm space-y-1">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Satellite analysis complete
            </div>
            <p>
              <span className="font-medium">Severity:</span> {satelliteResult.severity}
            </p>
            <p>
              <span className="font-medium">Material:</span> {satelliteResult.material}
            </p>
            {satelliteResult.notes && <p className="text-muted-foreground">{satelliteResult.notes}</p>}
          </div>
        )}
      </div>

      {/* Photo upload */}
      <div className="rounded-2xl border bg-card p-4 mb-4">
        <div className="flex items-start gap-3 mb-3">
          <Camera className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Upload ground photos (optional)</p>
            <p className="text-xs text-muted-foreground">
              Close-up photos of damage, missing shingles, or leaks give the most accurate result.
            </p>
          </div>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <p className="text-sm font-medium">Click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG — up to 8 photos</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {photos.map((photo, i) => (
              <div key={i} className="border rounded-lg overflow-hidden bg-background">
                <div className="relative aspect-video">
                  <img src={photo.previewUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {photo.analyzing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                {photo.result ? (
                  <div className="p-2 text-xs">
                    <p className="font-medium truncate">{photo.result.condition}</p>
                    {photo.result.issues && photo.result.issues.length > 0 && (
                      <p className="text-destructive truncate">⚠️ {photo.result.issues[0]}</p>
                    )}
                  </div>
                ) : photo.error ? (
                  <div className="p-2">
                    <p className="text-xs text-destructive truncate">{photo.error}</p>
                    <Button onClick={() => analyzePhoto(i)} size="sm" variant="outline" className="w-full mt-1 h-7 text-xs">
                      Retry
                    </Button>
                  </div>
                ) : (
                  !photo.analyzing && (
                    <div className="p-2">
                      <Button
                        onClick={() => analyzePhoto(i)}
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs"
                      >
                        Analyze
                      </Button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mb-3 flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" /> {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() =>
            onComplete({
              severity: "unknown",
              material: "Unknown",
              issues: [],
              recommendations: [],
              source: "satellite",
            })
          }
          variant="outline"
          className="flex-1 h-12"
        >
          Skip
        </Button>
        <Button
          onClick={() => onComplete(buildCondition())}
          disabled={!hasAnyResult && photos.length > 0}
          className="flex-1 h-12 gap-2"
        >
          Continue to Estimate <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
