import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PropertyType, TradeAnswers } from "./InstantQuoteWizard";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unusedTypes = (_: TradeAnswers) => _;
import { RoofMapMeasureStep, type MeasurementResult } from "./roofing/RoofMapMeasureStep";
import { WasteFactorStep, type RoofShape } from "./roofing/WasteFactorStep";
import { RoofConditionStep, type ConditionAnalysis } from "./roofing/RoofConditionStep";
import { RoofPackagesStep } from "./roofing/RoofPackagesStep";

interface Props {
  propertyType: PropertyType;
  onComplete: (answers: TradeAnswers) => void;
  onBack: () => void;
}

type SubStep = "stories" | "map" | "waste" | "condition" | "packages";

export function RoofingWizardSteps({ propertyType, onComplete, onBack }: Props) {
  const [substep, setSubstep] = useState<SubStep>("stories");
  const [stories, setStories] = useState<number>(1);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [measurement, setMeasurement] = useState<MeasurementResult | null>(null);
  const [wasteFactor, setWasteFactor] = useState<number>(0.12);
  const [roofShape, setRoofShape] = useState<RoofShape>("gable");
  const [condition, setCondition] = useState<ConditionAnalysis | null>(null);

  // Step 0: stories quick-pick (kept lightweight)
  if (substep === "stories") {
    return (
      <div className="max-w-2xl mx-auto pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="bg-card rounded-2xl border p-6 mb-6 space-y-4">
          <Label className="text-lg font-semibold">How many stories is your home?</Label>
          <div className="flex gap-3">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setStories(s)}
                className={`flex-1 py-4 rounded-xl border-2 text-lg font-medium transition-all ${
                  stories === s ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                {s === 3 ? "3+" : s}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => setSubstep("map")} className="w-full h-12 text-base gap-2">
          Next <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (substep === "map") {
    return (
      <RoofMapMeasureStep
        onBack={() => setSubstep("stories")}
        onComplete={({ address: a, coords: c, measurement: m }) => {
          setAddress(a);
          setCoords(c);
          setMeasurement(m);
          setSubstep("waste");
        }}
      />
    );
  }

  if (substep === "waste" && measurement) {
    return (
      <WasteFactorStep
        measurement={measurement}
        onBack={() => setSubstep("map")}
        onComplete={(shape, waste) => {
          setRoofShape(shape);
          setWasteFactor(waste);
          setSubstep("condition");
        }}
      />
    );
  }

  if (substep === "condition" && measurement && coords) {
    return (
      <RoofConditionStep
        measurement={measurement}
        coords={coords}
        address={address}
        onBack={() => setSubstep("waste")}
        onComplete={(c) => {
          setCondition(c);
          setSubstep("packages");
        }}
      />
    );
  }

  if (substep === "packages" && measurement && condition) {
    return (
      <RoofPackagesStep
        measurement={measurement}
        wasteFactor={wasteFactor}
        condition={condition}
        stories={stories}
        address={address}
        onBack={() => setSubstep("condition")}
      />
    );
  }

  return null;
}
