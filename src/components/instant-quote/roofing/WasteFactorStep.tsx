import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import type { MeasurementResult } from "./RoofMapMeasureStep";

export type RoofShape = "gable" | "hip" | "complex";

const OPTIONS: {
  id: RoofShape;
  label: string;
  range: string;
  waste: number;
  description: string;
  svg: string;
}[] = [
  {
    id: "gable",
    label: "Gable Roof",
    range: "10–12% waste",
    waste: 0.11,
    description: "Two sloping sides meeting at a ridge — simplest shape.",
    svg: "/roof-gable.svg",
  },
  {
    id: "hip",
    label: "Hip Roof",
    range: "12–15% waste",
    waste: 0.135,
    description: "All sides slope down to walls — moderate complexity.",
    svg: "/roof-hip.svg",
  },
  {
    id: "complex",
    label: "Complex Hip",
    range: "15–20% waste",
    waste: 0.18,
    description: "Multiple valleys, dormers, ridges — most cuts & waste.",
    svg: "/roof-complex.svg",
  },
];

interface Props {
  measurement: MeasurementResult;
  onBack: () => void;
  onComplete: (shape: RoofShape, wasteFactor: number) => void;
}

export function WasteFactorStep({ measurement, onBack, onComplete }: Props) {
  const [selected, setSelected] = useState<RoofShape | null>(null);

  const pitchedSqft = measurement.total_roof_area_sqft ?? measurement.total_pitched_area_sqft ?? 0;
  const flatSqft = measurement.user_added_flat_sqft ?? 0;
  const baseSqft = pitchedSqft + flatSqft;
  const selectedOption = OPTIONS.find((o) => o.id === selected);
  const finalSqft = selectedOption ? baseSqft * (1 + selectedOption.waste) : baseSqft;

  return (
    <div className="max-w-3xl mx-auto pt-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
        <p className="text-sm text-muted-foreground">Measured roof area</p>
        <p className="text-2xl font-bold text-primary">
          {Math.round(baseSqft).toLocaleString()} sqft
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Avg pitch {measurement.average_pitch_degrees.toFixed(1)}° •{" "}
          {measurement.roof_segments_count} segments • {measurement.complexity}
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-3">Select your roof shape</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Roof shape determines how much extra material is needed for cuts and overlap (waste factor).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center ${
              selected === opt.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
          >
            <img src={opt.svg} alt={opt.label} className="w-full h-24 object-contain mb-3" />
            <p className="font-semibold">{opt.label}</p>
            <p className="text-xs text-primary font-medium">{opt.range}</p>
            <p className="text-xs text-muted-foreground text-center mt-2 leading-tight">
              {opt.description}
            </p>
          </button>
        ))}
      </div>

      {selectedOption && (
        <div className="rounded-xl border bg-card p-4 mb-6 text-center">
          <p className="text-xs text-muted-foreground">Final area with {(selectedOption.waste * 100).toFixed(0)}% waste</p>
          <p className="text-2xl font-bold">{Math.round(finalSqft).toLocaleString()} sqft</p>
          <p className="text-xs text-muted-foreground">≈ {(finalSqft / 100).toFixed(1)} squares</p>
        </div>
      )}

      <Button
        onClick={() => selectedOption && onComplete(selectedOption.id, selectedOption.waste)}
        disabled={!selectedOption}
        className="w-full h-12 text-base gap-2"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
