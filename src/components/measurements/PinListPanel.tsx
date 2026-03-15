import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, MapPin, BrainCircuit } from "lucide-react";
import type { RoofPin } from "./types";
import { ALL_PITCHES, PITCH_MULTIPLIERS, WASTE_OPTIONS, getPinColor } from "./types";
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
  const totalSqft = measuredPins.reduce((s, pc) => s + pc.calc.flatSqft, 0);

  return (
    <Card className="shadow-xl border-border/50 bg-background/95 backdrop-blur-sm w-[420px]">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Roof Sections
          </CardTitle>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onAddPin}>
              <Plus className="mr-1 h-3 w-3" />Add Section
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
        {/* Column headers */}
        <div className="grid grid-cols-[20px_1fr_80px_52px_48px_54px_20px] gap-1 text-[9px] text-muted-foreground mt-2 px-1 uppercase tracking-wider font-medium">
          <span></span>
          <span>Name</span>
          <span>Pitch</span>
          <span className="text-right">Area</span>
          <span className="text-right">×Mult</span>
          <span className="text-right">Sqrs</span>
          <span></span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1.5 max-h-[45vh] overflow-y-auto">
        {pins.map((pin, idx) => {
          const pc = calcPin(pin);
          const pinColor = getPinColor(pin.pitch);
          const multiplier = PITCH_MULTIPLIERS[pin.pitch] ?? 1.0;
          return (
            <div
              key={pin.id}
              className="grid grid-cols-[20px_1fr_80px_52px_48px_54px_20px] gap-1 items-center p-1.5 rounded-md bg-muted/50 border border-border"
            >
              {/* Color dot */}
              <div
                className="w-5 h-5 rounded-full border-2 border-background shrink-0 flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                style={{ backgroundColor: pinColor }}
              >
                {idx + 1}
              </div>

              {/* Name */}
              <Input
                value={pin.label}
                onChange={(e) => onUpdatePin(pin.id, { label: e.target.value })}
                className="h-6 text-[11px] bg-background px-1.5"
              />

              {/* Pitch dropdown */}
              <Select
                value={pin.pitch}
                onValueChange={(v) => onUpdatePin(pin.id, { pitch: v })}
              >
                <SelectTrigger className="h-6 text-[10px] px-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {ALL_PITCHES.map(p => (
                    <SelectItem key={p} value={p} className="text-xs">
                      <span className="flex justify-between gap-2 w-full">
                        <span>{p}</span>
                        <span className="text-muted-foreground">×{PITCH_MULTIPLIERS[p].toFixed(3)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Area */}
              <div className="text-right text-[10px]">
                {pin.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin ml-auto text-muted-foreground" />
                ) : pin.error ? (
                  <span className="text-destructive">Err</span>
                ) : pc ? (
                  <span className="text-foreground">{Math.round(pc.flatSqft).toLocaleString()}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>

              {/* Multiplier */}
              <div className="text-right text-[10px] text-muted-foreground font-mono">
                ×{multiplier.toFixed(2)}
              </div>

              {/* Squares */}
              <div className="text-right text-[11px]">
                {pc ? (
                  <span className="font-bold text-primary">{pc.squares.toFixed(1)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>

              {/* Delete */}
              {pins.length > 1 ? (
                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive shrink-0" onClick={() => onRemovePin(pin.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              ) : <div />}
            </div>
          );
        })}

        {/* Per-pin waste row */}
        {pins.some(p => p.result) && (
          <div className="pt-1 space-y-1">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium px-1">Waste % Per Section</p>
            {pins.filter(p => p.result).map((pin) => (
              <div key={`waste-${pin.id}`} className="flex items-center gap-2 px-1">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getPinColor(pin.pitch) }} />
                <span className="text-[10px] text-muted-foreground flex-1 truncate">{pin.label}</span>
                <Select
                  value={String(pin.wastePercent)}
                  onValueChange={(v) => onUpdatePin(pin.id, { wastePercent: Number(v) })}
                >
                  <SelectTrigger className="h-5 w-16 text-[10px] px-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WASTE_OPTIONS.map(w => (
                      <SelectItem key={w} value={String(w)} className="text-xs">{w}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {measuredPins.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-xs font-medium">Total</p>
              <p className="text-[10px] text-muted-foreground">{Math.round(totalSqft).toLocaleString()} sqft (flat)</p>
            </div>
            <Badge className="text-sm font-bold">{totalSquares.toFixed(2)} squares</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
