import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, MapPin, BrainCircuit } from "lucide-react";
import type { RoofPin } from "./types";
import { PIN_COLORS } from "./types";
import { calcPin } from "./utils";

interface PinListPanelProps {
  pins: RoofPin[];
  onAddPin: () => void;
  onRemovePin: (id: string) => void;
  onUpdatePin: (id: string, field: Partial<RoofPin>) => void;
  onMeasureAll: () => void;
  measuring: boolean;
}

export function PinListPanel({ pins, onAddPin, onRemovePin, onUpdatePin, onMeasureAll, measuring }: PinListPanelProps) {
  const measuredPins = pins.filter(p => p.result).map(p => ({ pin: p, calc: calcPin(p)! }));
  const totalSquares = measuredPins.reduce((s, pc) => s + pc.calc.squares, 0);
  const totalSqft = measuredPins.reduce((s, pc) => s + pc.calc.pitchedSqft, 0);

  return (
    <Card className="shadow-xl border-border/50 bg-background/95 backdrop-blur-sm w-80">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Measurement Pins
          </CardTitle>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onAddPin}>
              <Plus className="mr-1 h-3 w-3" />Pin
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={onMeasureAll}
              disabled={measuring || pins.length === 0}
            >
              {measuring ? (
                <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Measuring...</>
              ) : (
                <><BrainCircuit className="mr-1 h-3 w-3" />Measure All</>
              )}
            </Button>
          </div>
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIN_COLORS.pitched }} />Pitched
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIN_COLORS.flat }} />Flat
          </span>
          <span className="ml-auto italic">Drag pins to reposition</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2 max-h-[40vh] overflow-y-auto">
        {pins.map((pin, idx) => {
          const pc = calcPin(pin);
          return (
            <div
              key={pin.id}
              className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border"
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-background shrink-0 flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                style={{ backgroundColor: PIN_COLORS[pin.roofType] }}
              >
                {idx + 1}
              </div>
              <Input
                value={pin.label}
                onChange={(e) => onUpdatePin(pin.id, { label: e.target.value })}
                className="h-6 text-xs bg-background flex-1"
              />
              <Select
                value={pin.roofType}
                onValueChange={(v) => onUpdatePin(pin.id, {
                  roofType: v as "flat" | "pitched",
                  label: v === "flat" ? `Flat ${idx + 1}` : `Pitched ${idx + 1}`,
                })}
              >
                <SelectTrigger className="h-6 w-20 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pitched">Pitched</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-16 text-right text-xs">
                {pin.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin ml-auto text-muted-foreground" />
                ) : pin.error ? (
                  <span className="text-destructive text-[10px]">Error</span>
                ) : pc ? (
                  <span className="font-bold text-primary">{pc.squares.toFixed(1)}</span>
                ) : (
                  <span className="text-muted-foreground text-[10px]">—</span>
                )}
              </div>
              {pins.length > 1 && (
                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive shrink-0" onClick={() => onRemovePin(pin.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}

        {/* Totals */}
        {measuredPins.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-xs font-medium">Total</p>
              <p className="text-[10px] text-muted-foreground">{Math.round(totalSqft).toLocaleString()} sqft</p>
            </div>
            <Badge className="text-sm font-bold">{totalSquares.toFixed(2)} squares</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
