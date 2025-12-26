import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Fixed multipliers
const FIXED_PITCH_MULTIPLIER = 1.1;
const FIXED_WASTE_MULTIPLIER = 1.13;

interface MeasurementPanelProps {
  area: number; // sq ft
  perimeter: number; // linear ft
}

export function MeasurementPanel({
  area,
  perimeter,
}: MeasurementPanelProps) {
  const pitchedArea = area * FIXED_PITCH_MULTIPLIER;
  const totalWithWaste = pitchedArea * FIXED_WASTE_MULTIPLIER;
  const squares = totalWithWaste / 100;

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader>
        <CardTitle>Roof Measurements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fixed Multipliers Display */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground text-center mb-2">Standard Calculation Applied</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center">
              <span className="text-muted-foreground">Pitch:</span>
              <span className="font-bold text-primary ml-1">×1.10</span>
            </div>
            <div className="text-center">
              <span className="text-muted-foreground">Waste:</span>
              <span className="font-bold text-primary ml-1">13%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Flat Area:</span>
            <span className="text-sm font-medium">{area.toFixed(2)} sq ft</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Pitched Area (×1.10):</span>
            <span className="text-sm font-medium">{pitchedArea.toFixed(2)} sq ft</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total with 13% Waste:</span>
            <span className="text-sm font-medium">{totalWithWaste.toFixed(2)} sq ft</span>
          </div>
          
          <div className="flex justify-between border-t pt-2">
            <span className="text-sm font-semibold">Total Squares:</span>
            <span className="text-lg font-bold text-primary">{squares.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Perimeter:</span>
            <span className="text-sm font-medium">{perimeter.toFixed(2)} ft</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
