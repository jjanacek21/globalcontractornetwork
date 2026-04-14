import { HardHat, DoorOpen, AlertTriangle, Trees, Sparkles, ArrowLeft } from "lucide-react";
import type { PropertyType, ServiceType } from "./InstantQuoteWizard";

interface ServiceTypeStepProps {
  propertyType: PropertyType;
  onSelect: (type: ServiceType) => void;
  onBack: () => void;
}

const services: { type: ServiceType; label: string; icon: typeof HardHat; description: string; color: string }[] = [
  { type: "roofing", label: "Roofing", icon: HardHat, description: "Replacements, repairs & coatings", color: "text-slate-600 bg-slate-600/10 hover:bg-slate-600/20" },
  { type: "windows", label: "Windows & Doors", icon: DoorOpen, description: "Impact-rated installations & repairs", color: "text-green-600 bg-green-600/10 hover:bg-green-600/20" },
  { type: "emergency", label: "Emergency Services", icon: AlertTriangle, description: "Water, fire & storm damage", color: "text-red-600 bg-red-600/10 hover:bg-red-600/20" },
  { type: "landscaping", label: "Tree & Landscaping", icon: Trees, description: "Tree removal, trimming & landscaping", color: "text-green-700 bg-green-700/10 hover:bg-green-700/20" },
  { type: "cleaning", label: "Property Cleaning", icon: Sparkles, description: "Pressure washing, interior & exterior", color: "text-purple-600 bg-purple-600/10 hover:bg-purple-600/20" },
];

export function ServiceTypeStep({ propertyType, onSelect, onBack }: ServiceTypeStepProps) {
  return (
    <div className="flex flex-col items-center pt-4">
      <button onClick={onBack} className="self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to property type
      </button>

      <h1 className="text-3xl font-bold mb-2 text-center">What service do you need?</h1>
      <p className="text-muted-foreground mb-10 text-center">
        For your <span className="font-medium text-foreground capitalize">{propertyType}</span> property
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-4xl">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.type}
              onClick={() => onSelect(s.type)}
              className="group flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className={`p-4 rounded-xl ${s.color} transition-colors`}>
                <Icon className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-semibold">{s.label}</h3>
              <p className="text-sm text-muted-foreground text-center">{s.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
