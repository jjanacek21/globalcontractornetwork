import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, ArrowRight } from "lucide-react";
import { RoofingPackage } from "./PackageBrowser";

interface PackageComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages: RoofingPackage[];
  measurements?: { totalSquares: number } | null;
  onSelectPackage: (pkg: RoofingPackage) => void;
}

const parsePrice = (priceStr: string): { low: number; high: number } | null => {
  // Handle formats like "$575-$650", "$860/sq", "$1,000-$1,200"
  const cleaned = priceStr.replace(/[,$]/g, '').replace('/sq', '');
  const parts = cleaned.split('-').map(p => parseFloat(p.trim()));
  
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { low: parts[0], high: parts[1] };
  }
  if (parts.length === 1 && !isNaN(parts[0])) {
    return { low: parts[0], high: parts[0] };
  }
  return null;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Get all unique features across packages
const getAllFeatures = (packages: RoofingPackage[]) => {
  const allFeatures = new Set<string>();
  packages.forEach(pkg => {
    pkg.features.forEach(f => allFeatures.add(f));
  });
  return Array.from(allFeatures);
};

export function PackageComparisonDialog({ 
  open, 
  onOpenChange, 
  packages, 
  measurements,
  onSelectPackage 
}: PackageComparisonDialogProps) {
  const allFeatures = getAllFeatures(packages);
  const totalSquares = measurements?.totalSquares || 0;

  const calculateEstimate = (pkg: RoofingPackage) => {
    if (!totalSquares) return null;
    const price = parsePrice(pkg.pricePerSquare);
    if (!price) return null;
    return {
      low: Math.round(price.low * totalSquares),
      high: Math.round(price.high * totalSquares)
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Package Comparison</DialogTitle>
          <DialogDescription>
            Compare features and pricing side by side
            {totalSquares > 0 && (
              <span className="block mt-1 text-primary font-medium">
                Estimated roof size: {totalSquares.toFixed(1)} squares
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 bg-muted/50 border-b w-1/4">Feature</th>
                {packages.map((pkg) => (
                  <th key={pkg.name} className="text-center p-3 bg-muted/50 border-b">
                    <div className="font-semibold">{pkg.name}</div>
                    <Badge variant="outline" className="mt-1">
                      {pkg.pricePerSquare}/sq
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price Row */}
              <tr className="bg-primary/5">
                <td className="p-3 font-medium border-b">Price per Square</td>
                {packages.map((pkg) => (
                  <td key={pkg.name} className="text-center p-3 border-b">
                    <span className="text-lg font-bold text-primary">{pkg.pricePerSquare}</span>
                  </td>
                ))}
              </tr>

              {/* Estimated Total Row (if measurements available) */}
              {totalSquares > 0 && (
                <tr className="bg-green-500/10">
                  <td className="p-3 font-medium border-b">
                    Estimated Total
                    <span className="block text-xs text-muted-foreground">
                      Based on {totalSquares.toFixed(1)} squares
                    </span>
                  </td>
                  {packages.map((pkg) => {
                    const estimate = calculateEstimate(pkg);
                    return (
                      <td key={pkg.name} className="text-center p-3 border-b">
                        {estimate ? (
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(estimate.low)} - {formatCurrency(estimate.high)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Contact for quote</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Feature Rows */}
              {allFeatures.map((feature, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                  <td className="p-3 text-sm border-b">{feature}</td>
                  {packages.map((pkg) => (
                    <td key={pkg.name} className="text-center p-3 border-b">
                      {pkg.features.includes(feature) ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* CTA Row */}
              <tr>
                <td className="p-3 border-b"></td>
                {packages.map((pkg) => (
                  <td key={pkg.name} className="text-center p-4 border-b">
                    <Button
                      onClick={() => {
                        onSelectPackage(pkg);
                        onOpenChange(false);
                      }}
                      className="w-full"
                    >
                      Get Instant Estimate
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
