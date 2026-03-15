import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, X } from "lucide-react";
import type { DrawnPolygon } from "./types";

interface DrawingPanelProps {
  polygons: DrawnPolygon[];
  isDrawing: boolean;
  onStartDrawing: () => void;
  onStopDrawing: () => void;
  onRemovePolygon: (id: string) => void;
  onClearAll: () => void;
  pitchMultiplier: number;
  wastePercent: number;
}

export function DrawingPanel({
  polygons,
  isDrawing,
  onStartDrawing,
  onStopDrawing,
  onRemovePolygon,
  onClearAll,
  pitchMultiplier,
  wastePercent,
}: DrawingPanelProps) {
  const totalFlatArea = polygons.reduce((s, p) => s + p.areaSqft, 0);
  const totalPitched = totalFlatArea * pitchMultiplier;
  const totalWithWaste = totalPitched * (1 + wastePercent / 100);
  const totalSquares = totalWithWaste / 100;
  const totalPerimeter = polygons.reduce((s, p) => s + p.perimeterFt, 0);

  return (
    <Card className="shadow-xl border-border/50 bg-background/95 backdrop-blur-sm w-80">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            Manual Drawing
          </CardTitle>
          <div className="flex gap-1.5">
            {!isDrawing ? (
              <Button size="sm" className="h-7 text-xs" onClick={onStartDrawing}>
                <Pencil className="mr-1 h-3 w-3" />Draw Outline
              </Button>
            ) : (
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={onStopDrawing}>
                <X className="mr-1 h-3 w-3" />Stop
              </Button>
            )}
          </div>
        </div>
        {isDrawing && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Click to add vertices. Double-click to complete the polygon.
          </p>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2 max-h-[40vh] overflow-y-auto">
        {polygons.length === 0 && !isDrawing && (
          <p className="text-xs text-muted-foreground text-center py-3">
            Draw roof outlines on the satellite map to measure area manually.
          </p>
        )}

        {polygons.map((p, idx) => (
          <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border">
            <div>
              <p className="text-xs font-medium">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {Math.round(p.areaSqft).toLocaleString()} sqft · {Math.round(p.perimeterFt)} ft perimeter
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => onRemovePolygon(p.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {polygons.length > 0 && (
          <>
            <div className="pt-2 border-t border-border space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Flat Area</span>
                <span>{Math.round(totalFlatArea).toLocaleString()} sqft</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pitched (×{pitchMultiplier.toFixed(2)})</span>
                <span>{Math.round(totalPitched).toLocaleString()} sqft</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">+ {wastePercent}% waste</span>
                <span>{Math.round(totalWithWaste).toLocaleString()} sqft</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Perimeter</span>
                <span>{Math.round(totalPerimeter)} ft</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-xs font-medium">Total</span>
                <Badge className="text-sm font-bold">{totalSquares.toFixed(2)} squares</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={onClearAll}>
              <Trash2 className="mr-1 h-3 w-3" />Clear All Drawings
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
