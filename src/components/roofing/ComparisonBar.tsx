import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, Scale } from "lucide-react";
import { RoofingPackage } from "./PackageBrowser";

interface ComparisonBarProps {
  packages: RoofingPackage[];
  onRemove: (pkg: RoofingPackage) => void;
  onCompare: () => void;
  onClear: () => void;
}

export function ComparisonBar({ packages, onRemove, onCompare, onClear }: ComparisonBarProps) {
  if (packages.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg animate-in slide-in-from-bottom-4">
      <div className="container py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Scale className="h-4 w-4 text-primary" />
              <span>Compare ({packages.length}/3):</span>
            </div>
            
            {packages.map((pkg) => (
              <Badge 
                key={pkg.name} 
                variant="secondary" 
                className="text-sm py-1.5 px-3 flex items-center gap-2"
              >
                {pkg.name}
                <button
                  onClick={() => onRemove(pkg)}
                  className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground"
            >
              Clear All
            </Button>
            
            <Button
              onClick={onCompare}
              disabled={packages.length < 2}
              className="gap-2"
            >
              Compare {packages.length} Packages
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
