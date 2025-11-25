import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MeasurementPanelProps {
  area: number; // sq ft
  perimeter: number; // linear ft
  pitchMultiplier: number;
  onPitchChange: (multiplier: number) => void;
  wasteFactor: number;
  onWasteFactorChange: (factor: number) => void;
}

const PITCH_OPTIONS = [
  { pitch: "3/12", multiplier: 1.031 },
  { pitch: "4/12", multiplier: 1.054 },
  { pitch: "5/12", multiplier: 1.083 },
  { pitch: "6/12", multiplier: 1.118 },
  { pitch: "7/12", multiplier: 1.158 },
  { pitch: "8/12", multiplier: 1.202 },
  { pitch: "9/12", multiplier: 1.25 },
  { pitch: "10/12", multiplier: 1.302 },
  { pitch: "11/12", multiplier: 1.357 },
  { pitch: "12/12", multiplier: 1.414 },
];

const WASTE_FACTOR_OPTIONS = [
  { label: "5%", value: 5 },
  { label: "10%", value: 10 },
  { label: "15%", value: 15 },
  { label: "20%", value: 20 },
];

export function MeasurementPanel({
  area,
  perimeter,
  pitchMultiplier,
  onPitchChange,
  wasteFactor,
  onWasteFactorChange,
}: MeasurementPanelProps) {
  const pitchedArea = area * pitchMultiplier;
  const totalWithWaste = pitchedArea * (1 + wasteFactor / 100);
  const squares = totalWithWaste / 100;

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader>
        <CardTitle>Roof Measurements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Roof Pitch</Label>
          <Select
            value={pitchMultiplier.toString()}
            onValueChange={(value) => onPitchChange(parseFloat(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PITCH_OPTIONS.map((option) => (
                <SelectItem
                  key={option.pitch}
                  value={option.multiplier.toString()}
                >
                  {option.pitch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Waste Factor</Label>
          <Select
            value={wasteFactor.toString()}
            onValueChange={(value) => onWasteFactorChange(parseFloat(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WASTE_FACTOR_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value.toString()}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Flat Area:</span>
            <span className="text-sm font-medium">{area.toFixed(2)} sq ft</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Pitched Area:</span>
            <span className="text-sm font-medium">{pitchedArea.toFixed(2)} sq ft</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total with Waste:</span>
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
