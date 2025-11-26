import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileText, Home, Ruler } from "lucide-react";

interface RoofMeasurements {
  flatArea: number;
  pitchedArea: number;
  totalSquares: number;
  address: string;
  pitchMultiplier: number;
  wasteFactor: number;
}

interface MeasurementReportProps {
  measurements: RoofMeasurements;
}

export function MeasurementReport({ measurements }: MeasurementReportProps) {
  const totalAreaWithWaste = measurements.pitchedArea * (1 + measurements.wasteFactor / 100);

  return (
    <Card className="border-primary">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Your Free Roof Measurement Report</CardTitle>
            <CardDescription>Professional measurements for accurate pricing</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Property Address */}
        <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg">
          <Home className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-muted-foreground">Property Address</div>
            <div className="text-lg font-medium">{measurements.address}</div>
          </div>
        </div>

        {/* Measurement Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Ruler className="h-5 w-5 text-primary" />
            Measurement Details
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Flat Area</div>
              <div className="text-2xl font-bold">{measurements.flatArea.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">square feet</div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Pitch Multiplier</div>
              <div className="text-2xl font-bold">×{measurements.pitchMultiplier.toFixed(3)}</div>
              <div className="text-xs text-muted-foreground">adjustment factor</div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Pitched Area</div>
              <div className="text-2xl font-bold">{measurements.pitchedArea.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">square feet</div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Waste Factor</div>
              <div className="text-2xl font-bold">{measurements.wasteFactor}%</div>
              <div className="text-xs text-muted-foreground">for cuts/overlap</div>
            </div>
          </div>

          <div className="p-6 bg-primary/10 border-2 border-primary rounded-lg">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Total Area with Waste</div>
              <div className="text-4xl font-bold text-primary">{totalAreaWithWaste.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">square feet</div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg">
            <div className="text-center space-y-2">
              <div className="text-sm opacity-90">Total Roofing Squares</div>
              <div className="text-5xl font-bold">{measurements.totalSquares.toFixed(2)}</div>
              <div className="text-sm opacity-90">squares (100 sq ft each)</div>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="space-y-3">
          <div className="font-semibold">What This Measurement Includes:</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>Accurate square footage based on satellite imagery</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>Pitch adjustment for sloped roofs</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>Waste factor for material cuts and overlap</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>Total squares calculation for pricing estimates</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg">
          <strong>Note:</strong> This is a preliminary measurement based on satellite imagery. Final measurements 
          may vary slightly based on on-site inspection. Complex roof features like dormers, valleys, and 
          chimneys may require additional materials. An official inspection will provide the most accurate estimate.
        </div>
      </CardContent>
    </Card>
  );
}
