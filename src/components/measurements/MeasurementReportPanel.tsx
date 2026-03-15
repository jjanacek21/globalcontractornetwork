import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Ruler, Layers, Package, Triangle, Calculator,
  CornerDownRight, ArrowDownRight, Minus
} from "lucide-react";
import type { RoofFacet, RoofEdge, RoofComponents, MaterialTakeoff, EdgeType } from "./types";
import { EDGE_COLORS, EDGE_LABELS, ALL_PITCHES, PITCH_MULTIPLIERS } from "./types";
import { formatFeetInches } from "./utils";

interface MeasurementReportPanelProps {
  address: string;
  facets: RoofFacet[];
  edges: RoofEdge[];
  components: RoofComponents;
  takeoff: MaterialTakeoff;
  onComponentsChange: (c: RoofComponents) => void;
}

export function MeasurementReportPanel({
  address, facets, edges, components, takeoff, onComponentsChange,
}: MeasurementReportPanelProps) {
  // Edge totals by type
  const edgeTotals = edges.reduce<Record<EdgeType, number>>((acc, e) => {
    acc[e.edgeType] = (acc[e.edgeType] || 0) + e.lengthFt;
    return acc;
  }, {} as Record<EdgeType, number>);

  const totalFlatArea = facets.reduce((s, f) => s + f.areaSqft, 0);
  const totalPitchedArea = Math.round(facets.reduce((s, f) => {
    const mult = PITCH_MULTIPLIERS[f.pitch] ?? components.pitchMultiplier;
    return s + f.areaSqft * mult;
  }, 0));
  const totalSquares = components.totalSquares;
  const wasteSquares = +(totalSquares * (components.wastePercent / 100)).toFixed(2);
  const materialSquares = +(totalSquares + wasteSquares).toFixed(2);

  const update = (field: keyof RoofComponents, value: number | string) => {
    onComponentsChange({ ...components, [field]: value });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Roof Measurement Report</h2>
          <p className="text-sm text-muted-foreground">{address || "No address"}</p>
        </div>
        <Badge className="text-lg px-4 py-2 font-bold">{materialSquares.toFixed(2)} squares</Badge>
      </div>

      {/* Edge Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            Edge Components Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(EDGE_COLORS) as EdgeType[]).map(et => {
              const total = edgeTotals[et] || 0;
              return (
                <div key={et} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-1 rounded-full" style={{ backgroundColor: EDGE_COLORS[et] }} />
                  <span className="text-muted-foreground">{EDGE_LABELS[et]}</span>
                  {total > 0 && <span className="font-medium">{formatFeetInches(total)}</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Total Measurements Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Triangle className="h-4 w-4 text-primary" />
              Total Measurements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-md p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Flat Area</p>
                <p className="text-lg font-bold">{totalFlatArea.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">sqft</p>
              </div>
              <div className="bg-muted/50 rounded-md p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Pitched Area</p>
                <p className="text-lg font-bold">{totalPitchedArea.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">sqft</p>
              </div>
              <div className="bg-primary/10 rounded-md p-3 text-center col-span-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Squares</p>
                <p className="text-2xl font-bold text-primary">{totalSquares.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">area ÷ 100</p>
              </div>
            </div>

            <Separator />

            {/* Line Measurements */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Line Measurements</p>
              {[
                { label: "Ridge", value: edgeTotals.ridge, color: EDGE_COLORS.ridge },
                { label: "Hip", value: edgeTotals.hip, color: EDGE_COLORS.hip },
                { label: "Valley", value: edgeTotals.valley, color: EDGE_COLORS.valley },
                { label: "Eave", value: edgeTotals.eave, color: EDGE_COLORS.eave },
                { label: "Rake", value: edgeTotals.rake, color: EDGE_COLORS.rake },
                { label: "Flashing", value: edgeTotals.flashing, color: EDGE_COLORS.flashing },
                { label: "Drip Edge", value: edgeTotals.drip_edge, color: EDGE_COLORS.drip_edge },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-sm py-1">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-3 h-1 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                  <span className="font-medium">{value ? formatFeetInches(value) : "—"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Facets Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Roof Facets ({facets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {facets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No facets measured yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Pitch</TableHead>
                    <TableHead className="text-xs text-right">Area (sqft)</TableHead>
                    <TableHead className="text-xs text-right">Squares</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facets.map(f => {
                    const mult = PITCH_MULTIPLIERS[f.pitch] ?? 1.054;
                    const sq = (f.areaSqft * mult) / 100;
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: f.color.replace("0.3", "0.8") }} />
                            {f.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={f.type === "flat" ? "secondary" : "outline"} className="text-[10px]">
                            {f.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{f.pitch}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{f.areaSqft.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right font-bold text-primary">{sq.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Waste Calculator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Waste Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Waste %</Label>
                <Select
                  value={String(components.wastePercent)}
                  onValueChange={(v) => update("wastePercent", Number(v))}
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 10, 12, 13, 15, 17, 20].map(w => (
                      <SelectItem key={w} value={String(w)}>{w}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Predominant Pitch</Label>
                <Select
                  value={components.predominantPitch}
                  onValueChange={(v) => update("predominantPitch", v)}
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_PITCHES.map(p => (
                      <SelectItem key={p} value={p}>
                        {p} (×{PITCH_MULTIPLIERS[p].toFixed(3)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-muted/50 rounded-md p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Squares</span>
                <span className="font-medium">{totalSquares.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pitch Multiplier</span>
                <span className="font-medium">×{components.pitchMultiplier.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">+ Waste ({components.wastePercent}%)</span>
                <span className="font-medium">+{wasteSquares.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Material Estimate</span>
                <span className="font-bold text-primary">{materialSquares.toFixed(2)} squares</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Material Takeoff */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Material Takeoff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[
                { label: "Shingle Bundles", value: takeoff.shingleBundles, unit: "" },
                { label: "Felt/Underlayment", value: takeoff.feltRolls, unit: "rolls" },
                { label: "Ice & Water Shield", value: takeoff.iceWaterShieldRolls, unit: "rolls" },
                { label: "Ridge Cap", value: takeoff.ridgeCapBundles, unit: "bundles" },
                { label: "Drip Edge", value: takeoff.dripEdgeFt, unit: "lin ft" },
                { label: "Starter Strip", value: takeoff.starterStripFt, unit: "lin ft" },
                { label: "Step Flashing", value: takeoff.stepFlashingPcs, unit: "pcs" },
                { label: "Pipe Boots", value: takeoff.pipeBoots, unit: "pcs" },
                { label: "Roof Vents", value: takeoff.ventCount, unit: "pcs" },
                { label: "Nail Boxes", value: takeoff.nailBoxes, unit: "" },
                { label: "Caulk/Sealant", value: takeoff.caulkTubes, unit: "tubes" },
              ].map(({ label, value, unit }, idx) => (
                <div key={label} className={`flex justify-between text-sm py-1.5 px-2 rounded ${idx % 2 === 0 ? "bg-muted/30" : ""}`}>
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className="font-medium text-xs">{value > 0 ? `${value} ${unit}` : "—"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
