import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Ruler, Triangle, CornerDownRight, ArrowDownRight,
  Minus, CircleDot, Square, Flame, Layers
} from "lucide-react";
import type { RoofComponents } from "./types";

interface RoofComponentsPanelProps {
  components: RoofComponents;
  onChange: (components: RoofComponents) => void;
}

const PITCHES = ["Flat", "1/12", "2/12", "3/12", "4/12", "5/12", "6/12", "7/12", "8/12", "9/12", "10/12", "11/12", "12/12", "14/12", "16/12"];
const COMPLEXITIES = ["Simple", "Moderate", "Complex", "Very Complex"];

export function RoofComponentsPanel({ components, onChange }: RoofComponentsPanelProps) {
  const update = (field: keyof RoofComponents, value: number | string) => {
    onChange({ ...components, [field]: value });
  };

  const numField = (label: string, field: keyof RoofComponents, unit: string, icon: React.ReactNode) => (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      <div className="relative">
        <Input
          type="number"
          step="1"
          min="0"
          value={components[field] as number || ""}
          onChange={(e) => update(field, parseFloat(e.target.value) || 0)}
          className="h-8 text-sm pr-10"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );

  return (
    <Card className="shadow-xl border-border/50 bg-background/95 backdrop-blur-sm w-80">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Roof Components
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {components.totalSquares.toFixed(1)} sq
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScrollArea className="h-[calc(100vh-300px)] pr-2">
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-md bg-primary/10 text-center">
                <p className="text-[10px] text-muted-foreground">Total Area</p>
                <p className="text-sm font-bold text-primary">{components.totalAreaSqft.toLocaleString()} sqft</p>
              </div>
              <div className="p-2 rounded-md bg-primary/10 text-center">
                <p className="text-[10px] text-muted-foreground">Total Squares</p>
                <p className="text-sm font-bold text-primary">{components.totalSquares.toFixed(2)}</p>
              </div>
            </div>

            <Separator />

            {/* Roof Configuration */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Configuration</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Predominant Pitch</Label>
                  <Select value={components.predominantPitch} onValueChange={(v) => update("predominantPitch", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PITCHES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Complexity</Label>
                  <Select value={components.complexity} onValueChange={(v) => update("complexity", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COMPLEXITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {numField("Waste %", "wastePercent", "%", <Flame className="h-3 w-3" />)}
                {numField("Stories", "stories", "", <Square className="h-3 w-3" />)}
                {numField("Facets", "facetsCount", "", <Triangle className="h-3 w-3" />)}
              </div>
            </div>

            <Separator />

            {/* Line Lengths */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Line Lengths</p>
              <div className="grid grid-cols-2 gap-2">
                {numField("Ridge", "ridgeFt", "ft", <Minus className="h-3 w-3" />)}
                {numField("Hip", "hipFt", "ft", <ArrowDownRight className="h-3 w-3" />)}
                {numField("Valley", "valleyFt", "ft", <CornerDownRight className="h-3 w-3" />)}
                {numField("Eave", "eaveFt", "ft", <Minus className="h-3 w-3" />)}
                {numField("Rake", "rakeFt", "ft", <Ruler className="h-3 w-3" />)}
                {numField("Drip Edge", "dripEdgeFt", "ft", <Minus className="h-3 w-3" />)}
                {numField("Perimeter", "perimeterFt", "ft", <Square className="h-3 w-3" />)}
              </div>
            </div>

            <Separator />

            {/* Flashing */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Flashing</p>
              <div className="grid grid-cols-2 gap-2">
                {numField("Step Flashing", "stepFlashingFt", "ft", <Ruler className="h-3 w-3" />)}
                {numField("Headwall", "headwallFt", "ft", <Minus className="h-3 w-3" />)}
                {numField("General Flashing", "flashingFt", "ft", <Minus className="h-3 w-3" />)}
              </div>
            </div>

            <Separator />

            {/* Penetrations */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Penetrations</p>
              <div className="grid grid-cols-3 gap-2">
                {numField("Pipe Boots", "pipeBootsCount", "", <CircleDot className="h-3 w-3" />)}
                {numField("Skylights", "skylightsCount", "", <Square className="h-3 w-3" />)}
                {numField("Chimneys", "chimneyCount", "", <Flame className="h-3 w-3" />)}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
