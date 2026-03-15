import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import type { MaterialTakeoff } from "./types";

interface MaterialTakeoffPanelProps {
  takeoff: MaterialTakeoff;
  totalSquares: number;
}

export function MaterialTakeoffPanel({ takeoff, totalSquares }: MaterialTakeoffPanelProps) {
  const items = [
    { label: "Shingle Bundles", value: takeoff.shingleBundles, unit: "bundles" },
    { label: "Felt/Underlayment", value: takeoff.feltRolls, unit: "rolls" },
    { label: "Ice & Water Shield", value: takeoff.iceWaterShieldRolls, unit: "rolls" },
    { label: "Ridge Cap", value: takeoff.ridgeCapBundles, unit: "bundles" },
    { label: "Drip Edge", value: takeoff.dripEdgeFt, unit: "lin ft" },
    { label: "Starter Strip", value: takeoff.starterStripFt, unit: "lin ft" },
    { label: "Step Flashing", value: takeoff.stepFlashingPcs, unit: "pcs" },
    { label: "Pipe Boots", value: takeoff.pipeBoots, unit: "pcs" },
    { label: "Roof Vents", value: takeoff.ventCount, unit: "pcs" },
    { label: "Roofing Nails", value: takeoff.nailBoxes, unit: "boxes" },
    { label: "Caulk/Sealant", value: takeoff.caulkTubes, unit: "tubes" },
  ];

  return (
    <Card className="shadow-xl border-border/50 bg-background/95 backdrop-blur-sm w-72">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Material Takeoff
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {totalSquares.toFixed(1)} sq
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between py-1 text-sm">
            <span className="text-muted-foreground text-xs">{item.label}</span>
            <span className="font-medium text-xs">
              {item.value > 0 ? `${item.value} ${item.unit}` : "—"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
