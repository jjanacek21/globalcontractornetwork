import { Building2, Home } from "lucide-react";
import type { PropertyType } from "./InstantQuoteWizard";

interface PropertyTypeStepProps {
  onSelect: (type: PropertyType) => void;
}

export function PropertyTypeStep({ onSelect }: PropertyTypeStepProps) {
  return (
    <div className="flex flex-col items-center pt-8">
      <h1 className="text-3xl font-bold mb-2 text-center">What type of property is this for?</h1>
      <p className="text-muted-foreground mb-10 text-center">Select your property type to get started</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          onClick={() => onSelect("residential")}
          className="group relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <div className="p-5 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Home className="h-12 w-12 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold">Residential</h3>
            <p className="text-sm text-muted-foreground mt-1">Houses, condos, townhomes</p>
          </div>
        </button>

        <button
          onClick={() => onSelect("commercial")}
          className="group relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <div className="p-5 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
            <Building2 className="h-12 w-12 text-blue-500" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold">Commercial</h3>
            <p className="text-sm text-muted-foreground mt-1">Office, retail, warehouses</p>
          </div>
        </button>
      </div>
    </div>
  );
}
