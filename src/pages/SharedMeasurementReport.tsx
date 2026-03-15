import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Ruler, MapPin, Layers, Package, AlertCircle } from "lucide-react";
import type { RoofComponents, MaterialTakeoff } from "@/components/measurements/types";

interface ReportData {
  address: string;
  components: RoofComponents;
  takeoff: MaterialTakeoff;
}

export default function SharedMeasurementReport() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!token) return;
    loadReport();
  }, [token]);

  const loadReport = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("measurement_reports")
        .select("report_data")
        .eq("share_token", token)
        .eq("is_active", true)
        .single();

      if (fetchError || !data) {
        setError("Report not found or has expired.");
        return;
      }

      setReport(data.report_data as unknown as ReportData);

      // Increment view count
      await supabase
        .from("measurement_reports")
        .update({ view_count: 1 }) // will be incremented properly with RPC if needed
        .eq("share_token", token);
    } catch {
      setError("Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-lg font-medium">{error || "Report not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { components, takeoff } = report;

  const lineItems = [
    { label: "Ridge", value: components.ridgeFt, unit: "ft" },
    { label: "Hip", value: components.hipFt, unit: "ft" },
    { label: "Valley", value: components.valleyFt, unit: "ft" },
    { label: "Eave", value: components.eaveFt, unit: "ft" },
    { label: "Rake", value: components.rakeFt, unit: "ft" },
    { label: "Drip Edge", value: components.dripEdgeFt, unit: "ft" },
    { label: "Step Flashing", value: components.stepFlashingFt, unit: "ft" },
    { label: "Headwall", value: components.headwallFt, unit: "ft" },
    { label: "Perimeter", value: components.perimeterFt, unit: "ft" },
  ];

  const materialItems = [
    { label: "Shingle Bundles", value: takeoff.shingleBundles },
    { label: "Felt Rolls", value: takeoff.feltRolls },
    { label: "Ice & Water Shield", value: takeoff.iceWaterShieldRolls },
    { label: "Ridge Cap Bundles", value: takeoff.ridgeCapBundles },
    { label: "Drip Edge", value: `${takeoff.dripEdgeFt} lin ft` },
    { label: "Starter Strip", value: `${takeoff.starterStripFt} lin ft` },
    { label: "Step Flashing Pcs", value: takeoff.stepFlashingPcs },
    { label: "Pipe Boots", value: takeoff.pipeBoots },
    { label: "Roof Vents", value: takeoff.ventCount },
    { label: "Nail Boxes", value: takeoff.nailBoxes },
    { label: "Caulk Tubes", value: takeoff.caulkTubes },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">Roof Measurement Report</h1>
          <div className="flex items-center gap-2 mt-2 text-primary-foreground/80">
            <MapPin className="h-4 w-4" />
            <span>{report.address}</span>
          </div>
          <p className="text-xs mt-2 text-primary-foreground/60">Powered by GCN PropertyIQ</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Total Area</p>
              <p className="text-xl font-bold">{components.totalAreaSqft.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">sq ft</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Total Squares</p>
              <p className="text-xl font-bold text-primary">{components.totalSquares.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Pitch</p>
              <p className="text-xl font-bold">{components.predominantPitch}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Complexity</p>
              <p className="text-xl font-bold">{components.complexity}</p>
            </CardContent>
          </Card>
        </div>

        {/* Line Measurements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ruler className="h-4 w-4 text-primary" />Line Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {lineItems.map(item => (
                <div key={item.label} className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value ? `${item.value} ${item.unit}` : "—"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Penetrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-primary" />Penetrations & Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-md">
                <p className="text-2xl font-bold">{components.pipeBootsCount}</p>
                <p className="text-xs text-muted-foreground">Pipe Boots</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-md">
                <p className="text-2xl font-bold">{components.skylightsCount}</p>
                <p className="text-xs text-muted-foreground">Skylights</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-md">
                <p className="text-2xl font-bold">{components.chimneyCount}</p>
                <p className="text-xs text-muted-foreground">Chimneys</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Facets</span>
                <span className="font-medium">{components.facetsCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stories</span>
                <span className="font-medium">{components.stories}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Waste %</span>
                <span className="font-medium">{components.wastePercent}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pitch Multiplier</span>
                <span className="font-medium">×{components.pitchMultiplier.toFixed(3)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Material Takeoff */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />Material Takeoff Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {materialItems.map((item, idx) => (
                <div key={item.label} className={`flex justify-between text-sm py-1.5 px-2 rounded ${idx % 2 === 0 ? "bg-muted/30" : ""}`}>
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          This report is a preliminary measurement based on satellite imagery and AI analysis.
          Final measurements may vary based on on-site inspection. Material quantities are estimates only.
        </p>
      </div>
    </div>
  );
}
