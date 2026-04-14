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

const windowTypes = ["Single Hung", "Double Hung", "Sliding", "Casement", "Awning", "Fixed/Picture", "Impact-Rated", "Not Sure"];
const doorTypes = ["Entry Door", "Sliding Glass Door", "French Doors", "Garage Door", "Storm Door", "Not Sure"];
const projectScopes = ["Full Home Window Replacement", "Partial (select windows)", "Door Only", "Windows + Doors", "Repair/Fix Existing"];

export function WindowsWizardSteps({ propertyType, onComplete, onBack }: Props) {
  const [substep, setSubstep] = useState(0);
  const [address, setAddress] = useState("");
  const [windowType, setWindowType] = useState<string[]>([]);
  const [doorType, setDoorType] = useState<string[]>([]);
  const [scope, setScope] = useState("");
  const [windowCount, setWindowCount] = useState("");
  const [doorCount, setDoorCount] = useState("");

  const toggleSelection = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const steps = [
    <div key="address" className="space-y-4">
      <Label className="text-lg font-semibold">Property Address</Label>
      <AddressAutocomplete value={address} onChange={setAddress} placeholder="Start typing your address..." />
    </div>,
    <div key="scope" className="space-y-4">
      <Label className="text-lg font-semibold">What's the scope of your project?</Label>
      <div className="grid grid-cols-1 gap-3">
        {projectScopes.map((s) => (
          <button key={s} onClick={() => setScope(s)} className={`p-4 rounded-xl border-2 text-left transition-all ${scope === s ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{s}</button>
        ))}
      </div>
    </div>,
    <div key="windows" className="space-y-4">
      <Label className="text-lg font-semibold">Window types needed (select all that apply)</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {windowTypes.map((t) => (
          <button key={t} onClick={() => toggleSelection(windowType, t, setWindowType)} className={`p-4 rounded-xl border-2 text-left transition-all ${windowType.includes(t) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{t}</button>
        ))}
      </div>
    </div>,
    <div key="doors" className="space-y-4">
      <Label className="text-lg font-semibold">Door types needed (select all that apply)</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {doorTypes.map((t) => (
          <button key={t} onClick={() => toggleSelection(doorType, t, setDoorType)} className={`p-4 rounded-xl border-2 text-left transition-all ${doorType.includes(t) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{t}</button>
        ))}
      </div>
    </div>,
    <div key="counts" className="space-y-4">
      <Label className="text-lg font-semibold">Quantities</Label>
      <div className="space-y-3">
        <div>
          <Label className="text-sm">Approximate number of windows</Label>
          <input type="number" value={windowCount} onChange={(e) => setWindowCount(e.target.value)} placeholder="e.g. 12" className="mt-1 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <Label className="text-sm">Number of doors</Label>
          <input type="number" value={doorCount} onChange={(e) => setDoorCount(e.target.value)} placeholder="e.g. 3" className="mt-1 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" />
        </div>
      </div>
    </div>,
  ];

  const canNext = () => {
    switch (substep) {
      case 0: return address.length > 3;
      case 1: return scope !== "";
      case 2: return windowType.length > 0;
      case 3: return doorType.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (substep < steps.length - 1) setSubstep(substep + 1);
    else onComplete({ address, scope, windowTypes: windowType, doorTypes: doorType, windowCount: Number(windowCount) || 0, doorCount: Number(doorCount) || 0, propertyType });
  };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <button onClick={substep === 0 ? onBack : () => setSubstep(substep - 1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="mb-4">
        <div className="flex gap-1">{steps.map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= substep ? "bg-primary" : "bg-muted"}`} />))}</div>
        <p className="text-xs text-muted-foreground mt-2">Windows & Doors • Step {substep + 1} of {steps.length}</p>
      </div>
      <div className="bg-card rounded-2xl border p-6 mb-6">{steps[substep]}</div>
      <Button onClick={handleNext} disabled={!canNext()} className="w-full h-12 text-base gap-2">
        {substep === steps.length - 1 ? "Continue to Photo Analysis" : "Next"} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
