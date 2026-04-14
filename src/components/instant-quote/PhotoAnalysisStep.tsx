import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Upload, Loader2, Camera, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ServiceType, PropertyType, TradeAnswers, PhotoAnalysisResult } from "./InstantQuoteWizard";

interface Props {
  serviceType: ServiceType;
  propertyType: PropertyType;
  tradeAnswers: TradeAnswers;
  onComplete: (results: PhotoAnalysisResult[]) => void;
  onSkip: () => void;
  onBack: () => void;
}

interface UploadedPhoto {
  file: File;
  previewUrl: string;
  analyzing: boolean;
  result: PhotoAnalysisResult | null;
  error: string | null;
}

export function PhotoAnalysisStep({ serviceType, propertyType, tradeAnswers, onComplete, onSkip, onBack }: Props) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: UploadedPhoto[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      analyzing: false,
      result: null,
      error: null,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const analyzePhoto = async (index: number) => {
    setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, analyzing: true, error: null } : p));

    try {
      // Convert to base64
      const file = photos[index].file;
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("instant-quote-ai", {
        body: {
          action: "analyze-photo",
          photoBase64: base64,
          serviceType,
          propertyType,
          tradeAnswers,
        },
      });

      if (error) throw new Error(error.message);

      const result: PhotoAnalysisResult = {
        photoUrl: photos[index].previewUrl,
        material: data.material || "Unknown",
        condition: data.condition || "Unknown",
        issues: data.issues || [],
        recommendations: data.recommendations || [],
      };

      setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, analyzing: false, result } : p));
    } catch (err) {
      setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, analyzing: false, error: err instanceof Error ? err.message : "Analysis failed" } : p));
    }
  };

  const analyzeAll = async () => {
    setIsAnalyzingAll(true);
    const unanalyzed = photos.map((p, i) => ({ p, i })).filter(({ p }) => !p.result && !p.analyzing);
    for (const { i } of unanalyzed) {
      await analyzePhoto(i);
    }
    setIsAnalyzingAll(false);
  };

  const allAnalyzed = photos.length > 0 && photos.every((p) => p.result !== null);
  const hasResults = photos.some((p) => p.result !== null);

  const handleContinue = () => {
    const results = photos.filter((p) => p.result).map((p) => p.result!);
    onComplete(results);
  };

  return (
    <div className="max-w-3xl mx-auto pt-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">📸 AI Photo Analysis</h1>
        <p className="text-muted-foreground">
          Upload photos of any building material — roof, flooring, walls, stucco, paint, soffits, drywall, concrete, etc. Our AI will identify the material, assess condition, and find issues.
        </p>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all mb-6"
      >
        <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">Click to upload photos</p>
        <p className="text-sm text-muted-foreground mt-1">JPG, PNG — up to 10 photos</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{photos.length} photo(s) uploaded</p>
            {!allAnalyzed && photos.length > 0 && (
              <Button onClick={analyzeAll} disabled={isAnalyzingAll} size="sm" className="gap-2">
                {isAnalyzingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Analyze All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((photo, i) => (
              <div key={i} className="border rounded-xl overflow-hidden bg-card">
                <div className="relative aspect-video">
                  <img src={photo.previewUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
                    <X className="h-4 w-4" />
                  </button>
                  {photo.analyzing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex items-center gap-2 bg-background/90 px-4 py-2 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analyzing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {photo.result && (
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Analysis Complete</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Material:</span> {photo.result.material}</p>
                      <p><span className="font-medium">Condition:</span> {photo.result.condition}</p>
                      {photo.result.issues.length > 0 && (
                        <div>
                          <span className="font-medium">Issues Found:</span>
                          <ul className="list-disc list-inside text-muted-foreground ml-1">
                            {photo.result.issues.map((issue, j) => <li key={j}>{issue}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {photo.error && (
                  <div className="p-4">
                    <p className="text-sm text-destructive">{photo.error}</p>
                    <Button onClick={() => analyzePhoto(i)} size="sm" variant="outline" className="mt-2">
                      Retry
                    </Button>
                  </div>
                )}

                {!photo.result && !photo.analyzing && !photo.error && (
                  <div className="p-4">
                    <Button onClick={() => analyzePhoto(i)} size="sm" variant="outline" className="w-full">
                      Analyze This Photo
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onSkip} variant="outline" className="flex-1 h-12">
          Skip Photos
        </Button>
        <Button onClick={handleContinue} disabled={!hasResults && photos.length > 0} className="flex-1 h-12 gap-2">
          {photos.length === 0 ? "Skip to Results" : "View Results"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
