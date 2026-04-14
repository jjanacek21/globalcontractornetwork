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

const emergencyTypes = ["Water Damage", "Fire/Smoke Damage", "Storm/Wind Damage", "Mold Remediation", "Flood Damage", "Tree Impact", "Roof Leak (Active)", "Other"];
const urgencyLevels = ["Immediate - Happening now", "Within 24 hours", "Within a few days", "Planning ahead"];
const affectedAreas = ["Roof", "Interior Walls/Ceiling", "Flooring", "Foundation", "Electrical", "Plumbing", "Exterior/Siding", "Multiple Areas"];

export function EmergencyWizardSteps({ propertyType, onComplete, onBack }: Props) {
  const [substep, setSubstep] = useState(0);
  const [address, setAddress] = useState("");
  const [emergencyType, setEmergencyType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const toggleArea = (a: string) => setAreas(areas.includes(a) ? areas.filter((x) => x !== a) : [...areas, a]);

  const steps = [
    <div key="address" className="space-y-4">
      <Label className="text-lg font-semibold">Property Address</Label>
      <AddressAutocomplete value={address} onChange={setAddress} placeholder="Start typing your address..." />
    </div>,
    <div key="type" className="space-y-4">
      <Label className="text-lg font-semibold">Type of emergency</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {emergencyTypes.map((t) => (
          <button key={t} onClick={() => setEmergencyType(t)} className={`p-4 rounded-xl border-2 text-left transition-all ${emergencyType === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{t}</button>
        ))}
      </div>
    </div>,
    <div key="urgency" className="space-y-4">
      <Label className="text-lg font-semibold">How urgent is this?</Label>
      <div className="grid grid-cols-1 gap-3">
        {urgencyLevels.map((u) => (
          <button key={u} onClick={() => setUrgency(u)} className={`p-4 rounded-xl border-2 text-left transition-all ${urgency === u ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{u}</button>
        ))}
      </div>
    </div>,
    <div key="areas" className="space-y-4">
      <Label className="text-lg font-semibold">Affected areas (select all)</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {affectedAreas.map((a) => (
          <button key={a} onClick={() => toggleArea(a)} className={`p-4 rounded-xl border-2 text-left transition-all ${areas.includes(a) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{a}</button>
        ))}
      </div>
    </div>,
    <div key="desc" className="space-y-4">
      <Label className="text-lg font-semibold">Describe what happened</Label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us what happened and any details that could help..." rows={4} className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none" />
    </div>,
  ];

  const canNext = () => {
    switch (substep) {
      case 0: return address.length > 3;
      case 1: return emergencyType !== "";
      case 2: return urgency !== "";
      case 3: return areas.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (substep < steps.length - 1) setSubstep(substep + 1);
    else onComplete({ address, emergencyType, urgency, affectedAreas: areas, description, propertyType });
  };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <button onClick={substep === 0 ? onBack : () => setSubstep(substep - 1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="mb-4">
        <div className="flex gap-1">{steps.map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= substep ? "bg-primary" : "bg-muted"}`} />))}</div>
        <p className="text-xs text-muted-foreground mt-2">Emergency • Step {substep + 1} of {steps.length}</p>
      </div>
      <div className="bg-card rounded-2xl border p-6 mb-6">{steps[substep]}</div>
      <Button onClick={handleNext} disabled={!canNext()} className="w-full h-12 text-base gap-2">
        {substep === steps.length - 1 ? "Continue to Photo Analysis" : "Next"} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
