import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AddressAutocomplete } from "@/components/homeowner/AddressAutocomplete";
import type { PropertyType, TradeAnswers } from "./InstantQuoteWizard";

interface Props {
  propertyType: PropertyType;
  onComplete: (answers: TradeAnswers) => void;
  onBack: () => void;
}

const roofTypes = ["Shingle (Asphalt)", "Tile (Concrete/Clay)", "Metal", "Flat/TPO/Modified Bitumen", "Wood Shake", "Slate", "Not Sure"];
const roofConditions = ["Good - Minor wear", "Fair - Some damage visible", "Poor - Significant damage", "Emergency - Active leak/damage", "Not Sure"];
const projectTypes = ["Full Replacement", "Repair Only", "Coating/Restoration", "Inspection", "Not Sure"];

export function RoofingWizardSteps({ propertyType, onComplete, onBack }: Props) {
  const [substep, setSubstep] = useState(0);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [roofType, setRoofType] = useState("");
  const [condition, setCondition] = useState("");
  const [projectType, setProjectType] = useState("");
  const [stories, setStories] = useState("1");
  const [approxSqft, setApproxSqft] = useState("");

  const steps = [
    // Step 0: Address
    <div key="address" className="space-y-4">
      <Label className="text-lg font-semibold">Property Address</Label>
      <AddressAutocomplete
        value={address}
        onChange={setAddress}
        onSelect={(addr, c) => {
          setAddress(addr);
          setCoords({ lat: c.lat, lng: c.lng });
        }}
        placeholder="Start typing your address..."
      />
      {coords && (
        <p className="text-sm text-muted-foreground">📍 Location captured</p>
      )}
    </div>,
    // Step 1: Roof type
    <div key="rooftype" className="space-y-4">
      <Label className="text-lg font-semibold">What type of roof do you have?</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roofTypes.map((t) => (
          <button
            key={t}
            onClick={() => setRoofType(t)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${roofType === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>,
    // Step 2: Condition
    <div key="condition" className="space-y-4">
      <Label className="text-lg font-semibold">Current roof condition?</Label>
      <div className="grid grid-cols-1 gap-3">
        {roofConditions.map((c) => (
          <button
            key={c}
            onClick={() => setCondition(c)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${condition === c ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>,
    // Step 3: Project type
    <div key="project" className="space-y-4">
      <Label className="text-lg font-semibold">What work is needed?</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {projectTypes.map((p) => (
          <button
            key={p}
            onClick={() => setProjectType(p)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${projectType === p ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>,
    // Step 4: Details
    <div key="details" className="space-y-4">
      <Label className="text-lg font-semibold">A few more details</Label>
      <div className="space-y-3">
        <div>
          <Label className="text-sm">Number of stories</Label>
          <div className="flex gap-3 mt-1">
            {["1", "2", "3+"].map((s) => (
              <button
                key={s}
                onClick={() => setStories(s)}
                className={`px-6 py-3 rounded-xl border-2 transition-all ${stories === s ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-sm">Approximate roof size (sq ft) — optional</Label>
          <input
            type="number"
            value={approxSqft}
            onChange={(e) => setApproxSqft(e.target.value)}
            placeholder="e.g. 2000"
            className="mt-1 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>,
  ];

  const canNext = () => {
    switch (substep) {
      case 0: return address.length > 3;
      case 1: return roofType !== "";
      case 2: return condition !== "";
      case 3: return projectType !== "";
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (substep < steps.length - 1) {
      setSubstep(substep + 1);
    } else {
      onComplete({
        address,
        lat: coords?.lat || 0,
        lng: coords?.lng || 0,
        roofType,
        condition,
        projectType,
        stories,
        approxSqft: approxSqft ? Number(approxSqft) : 0,
        propertyType,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <button onClick={substep === 0 ? onBack : () => setSubstep(substep - 1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-4">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= substep ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Roofing • Step {substep + 1} of {steps.length}</p>
      </div>

      <div className="bg-card rounded-2xl border p-6 mb-6">
        {steps[substep]}
      </div>

      <Button onClick={handleNext} disabled={!canNext()} className="w-full h-12 text-base gap-2">
        {substep === steps.length - 1 ? "Continue to Photo Analysis" : "Next"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
