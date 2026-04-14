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

const serviceTypes = ["Tree Removal", "Tree Trimming/Pruning", "Stump Grinding", "Full Landscaping Design", "Lawn Maintenance", "Irrigation/Sprinklers", "Hardscaping (Pavers/Walkways)", "Fence Installation/Repair"];
const treeSizes = ["Small (under 20ft)", "Medium (20-40ft)", "Large (40-60ft)", "Very Large (60ft+)", "N/A"];
const lotSizes = ["Small (under 5,000 sqft)", "Medium (5,000-10,000 sqft)", "Large (10,000-20,000 sqft)", "Very Large (20,000+ sqft)"];

export function LandscapingWizardSteps({ propertyType, onComplete, onBack }: Props) {
  const [substep, setSubstep] = useState(0);
  const [address, setAddress] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [treeSize, setTreeSize] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [treeCount, setTreeCount] = useState("");
  const [description, setDescription] = useState("");

  const toggleService = (s: string) => setSelectedServices(selectedServices.includes(s) ? selectedServices.filter((x) => x !== s) : [...selectedServices, s]);

  const steps = [
    <div key="address" className="space-y-4"><Label className="text-lg font-semibold">Property Address</Label><AddressAutocomplete value={address} onChange={setAddress} placeholder="Start typing your address..." /></div>,
    <div key="services" className="space-y-4">
      <Label className="text-lg font-semibold">What services do you need? (select all)</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{serviceTypes.map((s) => (<button key={s} onClick={() => toggleService(s)} className={`p-4 rounded-xl border-2 text-left transition-all ${selectedServices.includes(s) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{s}</button>))}</div>
    </div>,
    <div key="treesize" className="space-y-4">
      <Label className="text-lg font-semibold">Largest tree size involved</Label>
      <div className="grid grid-cols-1 gap-3">{treeSizes.map((s) => (<button key={s} onClick={() => setTreeSize(s)} className={`p-4 rounded-xl border-2 text-left transition-all ${treeSize === s ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{s}</button>))}</div>
    </div>,
    <div key="details" className="space-y-4">
      <Label className="text-lg font-semibold">Property details</Label>
      <div className="space-y-3">
        <div><Label className="text-sm">Lot size</Label><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">{lotSizes.map((l) => (<button key={l} onClick={() => setLotSize(l)} className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${lotSize === l ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>{l}</button>))}</div></div>
        <div><Label className="text-sm">Number of trees (if applicable)</Label><input type="number" value={treeCount} onChange={(e) => setTreeCount(e.target.value)} placeholder="e.g. 3" className="mt-1 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" /></div>
      </div>
    </div>,
    <div key="desc" className="space-y-4">
      <Label className="text-lg font-semibold">Additional details</Label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any special considerations, obstacles, or goals for the project..." rows={4} className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none" />
    </div>,
  ];

  const canNext = () => { switch (substep) { case 0: return address.length > 3; case 1: return selectedServices.length > 0; case 2: return treeSize !== ""; case 3: return lotSize !== ""; default: return true; } };
  const handleNext = () => { if (substep < steps.length - 1) setSubstep(substep + 1); else onComplete({ address, services: selectedServices, treeSize, lotSize, treeCount: Number(treeCount) || 0, description, propertyType }); };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <button onClick={substep === 0 ? onBack : () => setSubstep(substep - 1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="mb-4"><div className="flex gap-1">{steps.map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= substep ? "bg-primary" : "bg-muted"}`} />))}</div><p className="text-xs text-muted-foreground mt-2">Landscaping • Step {substep + 1} of {steps.length}</p></div>
      <div className="bg-card rounded-2xl border p-6 mb-6">{steps[substep]}</div>
      <Button onClick={handleNext} disabled={!canNext()} className="w-full h-12 text-base gap-2">{substep === steps.length - 1 ? "Continue to Photo Analysis" : "Next"} <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}
