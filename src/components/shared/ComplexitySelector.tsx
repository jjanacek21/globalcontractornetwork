import { cn } from "@/lib/utils";
import { COMPLEXITY_OPTIONS, ComplexityLevel, ServiceType } from "@/lib/roofMeasurements";

interface ComplexitySelectorProps {
  value: ComplexityLevel;
  onChange: (complexity: ComplexityLevel) => void;
  serviceType: ServiceType;
}

export function ComplexitySelector({ value, onChange, serviceType }: ComplexitySelectorProps) {
  const options = serviceType === 'coating' 
    ? COMPLEXITY_OPTIONS.coating 
    : COMPLEXITY_OPTIONS.reroof;

  // For coating, only show simple option but don't make it interactive
  if (serviceType === 'coating') {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Roof Complexity</p>
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <img
            src={options[0].image}
            alt={options[0].label}
            className="w-12 h-12 object-contain"
          />
          <div>
            <span className="text-sm font-medium">{options[0].label}</span>
            <p className="text-xs text-muted-foreground">{options[0].description}</p>
            <span className="text-xs text-primary font-medium">+{(options[0].wastePct * 100).toFixed(0)}% waste</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Select Roof Complexity</p>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id as ComplexityLevel)}
            className={cn(
              "flex flex-col items-center p-3 rounded-lg border-2 transition-all hover:border-primary/50",
              value === option.id
                ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                : "border-muted bg-background hover:bg-muted/50"
            )}
          >
            <img
              src={option.image}
              alt={option.label}
              className="w-full h-16 object-contain mb-2"
            />
            <span className="text-xs font-medium text-center">{option.label}</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight mt-1">
              {option.description}
            </span>
            <span className="text-xs text-primary font-medium mt-1">
              +{(option.wastePct * 100).toFixed(0)}% waste
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
