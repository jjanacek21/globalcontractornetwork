import { useState } from "react";
import { useRSCompany } from "@/hooks/useRoofScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Brain, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  photoUrl: string;
  material_type: string;
  condition: string;
  damage_items: { description: string; severity: string; recommended_action: string; estimated_quantity: number; estimated_unit: string; estimated_unit_price: number }[];
  is_storm_damage: boolean;
  storm_damage_type: string;
  overall_notes: string;
}

export default function RoofScopeAnalyzer() {
  const { company, loading: cl } = useRSCompany();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);

  if (cl) return <Skeleton className="h-64" />;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleAnalyze = async () => {
    if (!files.length || !company) return;
    setAnalyzing(true);

    try {
      const newResults: AnalysisResult[] = [];
      for (const file of files) {
        // Upload to storage
        const path = `${company.id}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("job-photos").upload(path, file);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(path);

        // Call AI analysis edge function
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(file);
        });

        const { data, error } = await supabase.functions.invoke("roofscope-analyze", {
          body: { image_base64: base64, mime_type: file.type },
        });

        if (error) throw error;

        newResults.push({
          photoUrl: urlData.publicUrl,
          ...(data?.analysis || {
            material_type: "Unknown",
            condition: "unknown",
            damage_items: [],
            is_storm_damage: false,
            storm_damage_type: "none",
            overall_notes: "Analysis unavailable",
          }),
        });
      }
      setResults(newResults);
      setFiles([]);
      toast({ title: `${newResults.length} photo(s) analyzed` });
    } catch (err: any) {
      toast({ title: "Analysis error", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Photo Analyzer</h1>
        <p className="text-sm text-muted-foreground">Upload roof photos for AI-powered damage assessment and line item suggestions</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-muted/20 transition-colors">
            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Drop photos here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP accepted</p>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} className="hidden" />
          </label>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">{files.length} file(s) ready</p>
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{f.name}</Badge>
                ))}
              </div>
              <Button onClick={handleAnalyze} disabled={analyzing} className="gap-2 mt-2">
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {analyzing ? "Analyzing..." : "Analyze Photos"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {results.map((r, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Photo Analysis #{i + 1}
              {r.is_storm_damage && (
                <Badge className="bg-orange-500/20 text-orange-400 gap-1">
                  <AlertTriangle className="w-3 h-3" /> Storm Damage Detected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <img src={r.photoUrl} alt="Roof" className="w-full sm:w-48 h-36 object-cover rounded-lg" />
              <div className="space-y-2 flex-1">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{r.material_type}</Badge>
                  <Badge variant={r.condition === "good" ? "default" : "destructive"}>{r.condition}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.overall_notes}</p>
              </div>
            </div>

            {r.damage_items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Suggested Line Items</h4>
                <div className="space-y-2">
                  {r.damage_items.map((d, j) => (
                    <div key={j} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{d.description}</p>
                        <p className="text-xs text-muted-foreground">{d.recommended_action} — {d.severity}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono">{d.estimated_quantity} {d.estimated_unit} × ${d.estimated_unit_price}</p>
                        <p className="text-xs font-bold">${(d.estimated_quantity * d.estimated_unit_price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
