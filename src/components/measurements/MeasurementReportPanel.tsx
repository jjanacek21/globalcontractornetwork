import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Ruler, Layers, Package, Calculator
} from "lucide-react";
import type { RoofFacet, RoofEdge, RoofComponents, MaterialTakeoff, EdgeType } from "./types";
import { EDGE_COLORS, EDGE_LABELS, PITCH_MULTIPLIERS } from "./types";
import { formatFeetInches } from "./utils";

interface MeasurementReportPanelProps {
  address: string;
  facets: RoofFacet[];
  edges: RoofEdge[];
  components: RoofComponents;
  takeoff: MaterialTakeoff;
  onComponentsChange: (c: RoofComponents) => void;
}

const WASTE_LEVELS = [0, 10, 12, 15, 17, 20, 22];

function facetPitchedArea(f: RoofFacet): number {
  return f.areaSqft * (PITCH_MULTIPLIERS[f.pitch] ?? 1);
}

function facetSquares(f: RoofFacet): number {
  const pitched = facetPitchedArea(f);
  return pitched * (1 + f.wastePercent / 100) / 100;
}

export function MeasurementReportPanel({
  address, facets, edges, components, takeoff, onComponentsChange,
}: MeasurementReportPanelProps) {
  // Edge totals by type
  const edgeTotals = edges.reduce<Partial<Record<EdgeType, number>>>((acc, e) => {
    acc[e.edgeType] = (acc[e.edgeType] || 0) + e.lengthFt;
    return acc;
  }, {});

  const totalFlatArea = facets.reduce((s, f) => s + f.areaSqft, 0);
  const totalPitchedArea = facets.reduce((s, f) => s + facetPitchedArea(f), 0);
  const totalSquares = facets.reduce((s, f) => s + facetSquares(f), 0);

  // For waste comparison: base pitched area (no waste)
  const basePitchedArea = facets.reduce((s, f) => s + facetPitchedArea(f), 0);

  const ridgeHipFt = (edgeTotals.ridge || 0) + (edgeTotals.hip || 0);
  const eaveRakeFt = (edgeTotals.eave || 0) + (edgeTotals.rake || 0);
  const totalEdgeFt = edges.reduce((s, e) => s + e.lengthFt, 0);

  const EDGE_TYPE_ORDER: EdgeType[] = ["ridge", "hip", "valley", "eave", "rake", "drip_edge", "flashing", "transition"];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Roof Measurement Report</h2>
          <p className="text-sm text-muted-foreground">{address || "No address"}</p>
        </div>
        <Badge className="text-lg px-4 py-2 font-bold">{totalSquares.toFixed(2)} squares</Badge>
      </div>

      {/* ─── Per-Facet Breakdown ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Facet Breakdown ({facets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No facets measured yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Facet</TableHead>
                  <TableHead className="text-xs text-center">Pitch</TableHead>
                  <TableHead className="text-xs text-center">Waste</TableHead>
                  <TableHead className="text-xs text-right">Flat Area</TableHead>
                  <TableHead className="text-xs text-right">Pitched Area</TableHead>
                  <TableHead className="text-xs text-right">Squares</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facets.map(f => {
                  const pitched = facetPitchedArea(f);
                  const sq = facetSquares(f);
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="text-xs font-medium">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: f.color.replace("0.30", "0.8").replace("0.35", "0.8") }}
                          />
                          {f.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <Badge variant={f.type === "flat" ? "secondary" : "outline"} className="text-[10px]">
                          {f.pitch}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-center">{f.wastePercent}%</TableCell>
                      <TableCell className="text-xs text-right">{Math.round(f.areaSqft).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">{Math.round(pitched).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-primary">{sq.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="text-xs font-semibold">Totals</TableCell>
                  <TableCell className="text-xs text-right font-bold">{Math.round(totalFlatArea).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-bold">{Math.round(totalPitchedArea).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-bold text-primary">{totalSquares.toFixed(2)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Edge Totals Table ──────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ruler className="h-4 w-4 text-primary" />
              Edge Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Edge Type</TableHead>
                  <TableHead className="text-xs text-right">Length</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EDGE_TYPE_ORDER.filter(et => edgeTotals[et]).map(et => (
                  <TableRow key={et}>
                    <TableCell className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: EDGE_COLORS[et] }} />
                        {EDGE_LABELS[et]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      {formatFeetInches(edgeTotals[et]!)} <span className="text-muted-foreground">({Math.round(edgeTotals[et]!)} ft)</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                {ridgeHipFt > 0 && (
                  <TableRow className="bg-muted/30">
                    <TableCell className="text-xs font-medium">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-1.5 rounded-full bg-gradient-to-r" style={{ background: `linear-gradient(90deg, ${EDGE_COLORS.ridge}, ${EDGE_COLORS.hip})` }} />
                        Ridges + Hips
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right font-bold">{Math.round(ridgeHipFt)} ft</TableCell>
                  </TableRow>
                )}
                {eaveRakeFt > 0 && (
                  <TableRow className="bg-muted/30">
                    <TableCell className="text-xs font-medium">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-1.5 rounded-full bg-gradient-to-r" style={{ background: `linear-gradient(90deg, ${EDGE_COLORS.eave}, ${EDGE_COLORS.rake})` }} />
                        Eaves + Rakes
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right font-bold">{Math.round(eaveRakeFt)} ft</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/50">
                  <TableCell className="text-xs font-semibold">Total All Edges</TableCell>
                  <TableCell className="text-xs text-right font-bold">{Math.round(totalEdgeFt)} ft</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        {/* ─── Waste Comparison Table ─────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Waste Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Waste %</TableHead>
                  <TableHead className="text-xs text-right">Total Sqft</TableHead>
                  <TableHead className="text-xs text-right">Squares</TableHead>
                  <TableHead className="text-xs text-right">Bundles (3/sq)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {WASTE_LEVELS.map(w => {
                  const withWaste = basePitchedArea * (1 + w / 100);
                  const sq = withWaste / 100;
                  const bundles = Math.ceil(sq * 3);
                  const isCurrentWaste = w === components.wastePercent;
                  return (
                    <TableRow key={w} className={isCurrentWaste ? "bg-primary/10 font-semibold" : ""}>
                      <TableCell className="text-xs">
                        <span className="flex items-center gap-1.5">
                          {w}%
                          {isCurrentWaste && (
                            <Badge variant="default" className="text-[9px] px-1 py-0">current</Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-right">{Math.round(withWaste).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-medium">{sq.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right">{bundles}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ─── Material Takeoff ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Material Takeoff
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-6 sm:grid-cols-2">
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
  );
}
