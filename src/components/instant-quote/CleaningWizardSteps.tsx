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

const cleaningTypes = ["Pressure Washing (Exterior)", "Roof Cleaning/Soft Wash", "Carpet Cleaning", "Interior Deep Clean", "Post-Construction Cleanup", "Pool Deck / Paver Cleaning", "Gutter Cleaning", "Window Cleaning"];
const stainTypes = ["Mold/Mildew", "Rust Stains", "Oil/Grease", "Paint Overspray", "Hard Water Deposits", "Algae/Moss", "Smoke/Soot", "Not Sure"];
const propertySizes = ["Small (under 1,500 sqft)", "Medium (1,500-3,000 sqft)", "Large (3,000-5,000 sqft)", "Very Large (5,000+ sqft)"];

export function CleaningWizardSteps({ propertyType, onComplete, onBack }: Props) {
  const [substep, setSubstep] = useState(0);
  const [address, setAddress] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [stains, setStains] = useState<string[]>([]);
  const [size, setSize] = useState("");
  const [description, setDescription] = useState("");

  const toggle = (list: string[], item: string, setter: (v: string[]) => void) => setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const steps = [
    <div key="address" className="space-y-4"><Label className="text-lg font-semibold">Property Address</Label><AddressAutocomplete value={address} onChange={setAddress} placeholder="Start typing your address..." /></div>,
    <div key="types" className="space-y-4">
      <Label className="text-lg font-semibold">What cleaning services? (select all)</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{cleaningTypes.map((t) => (<button key={t} onClick={() => toggle(selectedTypes, t, setSelectedTypes)} className={`p-4 rounded-xl border-2 text-left transition-all ${selectedTypes.includes(t) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{t}</button>))}</div>
    </div>,
    <div key="stains" className="space-y-4">
      <Label className="text-lg font-semibold">Any specific stains or issues? (select all)</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{stainTypes.map((s) => (<button key={s} onClick={() => toggle(stains, s, setStains)} className={`p-4 rounded-xl border-2 text-left transition-all ${stains.includes(s) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{s}</button>))}</div>
    </div>,
    <div key="size" className="space-y-4">
      <Label className="text-lg font-semibold">Property size</Label>
      <div className="grid grid-cols-1 gap-3">{propertySizes.map((s) => (<button key={s} onClick={() => setSize(s)} className={`p-4 rounded-xl border-2 text-left transition-all ${size === s ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{s}</button>))}</div>
    </div>,
    <div key="desc" className="space-y-4">
      <Label className="text-lg font-semibold">Additional details</Label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe any specific areas, access issues, or stains you want addressed..." rows={4} className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none" />
    </div>,
  ];

  const canNext = () => { switch (substep) { case 0: return address.length > 3; case 1: return selectedTypes.length > 0; case 2: return true; case 3: return size !== ""; default: return true; } };
  const handleNext = () => { if (substep < steps.length - 1) setSubstep(substep + 1); else onComplete({ address, cleaningTypes: selectedTypes, stains, propertySize: size, description, propertyType }); };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <button onClick={substep === 0 ? onBack : () => setSubstep(substep - 1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="mb-4"><div className="flex gap-1">{steps.map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= substep ? "bg-primary" : "bg-muted"}`} />))}</div><p className="text-xs text-muted-foreground mt-2">Cleaning • Step {substep + 1} of {steps.length}</p></div>
      <div className="bg-card rounded-2xl border p-6 mb-6">{steps[substep]}</div>
      <Button onClick={handleNext} disabled={!canNext()} className="w-full h-12 text-base gap-2">{substep === steps.length - 1 ? "Continue to Photo Analysis" : "Next"} <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}
