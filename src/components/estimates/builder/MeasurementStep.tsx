import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ruler, ArrowRight, ArrowLeft, MapPin, TriangleAlert } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type RoofMeasurement = Database["public"]["Tables"]["roof_measurements"]["Row"];

interface MeasurementStepProps {
  measurements: RoofMeasurement[];
  selectedMeasurementId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MeasurementStep({ measurements, selectedMeasurementId, onSelect, onNext, onBack }: MeasurementStepProps) {
  const selected = measurements.find(m => m.id === selectedMeasurementId);

  const sourceColor = (s: string) => {
    if (s === "ai") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (s === "manual") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    return "bg-green-500/10 text-green-600 border-green-500/20";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ruler className="h-5 w-5 text-primary" />
            Link Roof Measurement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {measurements.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <TriangleAlert className="h-8 w-8 mx-auto text-amber-500" />
              <p className="text-sm text-muted-foreground">
                No roof measurements available. You can skip this step and add measurements later, or create one from the Measurements page.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 max-h-80 overflow-y-auto">
              {measurements.map(m => (
                <button
                  key={m.id}
                  onClick={() => onSelect(m.id)}
                  className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                    selectedMeasurementId === m.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{m.address}</span>
                    </div>
                    <Badge variant="outline" className={sourceColor(m.source)}>
                      {m.source.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Squares</p>
                      <p className="text-sm font-bold">{m.total_squares?.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sq Ft</p>
                      <p className="text-sm font-bold">{m.total_area_sqft?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pitch</p>
                      <p className="text-sm font-bold">{m.pitch || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Date</p>
                      <p className="text-sm font-bold">{format(new Date(m.created_at), "M/d/yy")}</p>
                    </div>
                  </div>
                  {(m.ridge_ft || m.hip_ft || m.valley_ft || m.eave_ft) && (
                    <div className="grid grid-cols-4 gap-3 mt-2 pt-2 border-t border-border/50">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Ridge</p>
                        <p className="text-xs font-medium">{m.ridge_ft ? `${m.ridge_ft} ft` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Hip</p>
                        <p className="text-xs font-medium">{m.hip_ft ? `${m.hip_ft} ft` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Valley</p>
                        <p className="text-xs font-medium">{m.valley_ft ? `${m.valley_ft} ft` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Eave</p>
                        <p className="text-xs font-medium">{m.eave_ft ? `${m.eave_ft} ft` : "—"}</p>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext}>
          {selected ? "Next: Line Items" : "Skip Measurement"} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
