import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { InstantQuoteDialog } from "./InstantQuoteDialog";

interface Package {
  name: string;
  pricePerSquare: string;
  features: string[];
}

interface PackageSelectorProps {
  packages: Package[];
  totalSquares: number;
  onSelectPackage: (packageName: string, estimatedPrice: string) => void;
}

export function PackageSelector({ packages, totalSquares, onSelectPackage }: PackageSelectorProps) {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);

  const calculatePriceRange = (pricePerSquare: string): string => {
    if (pricePerSquare === "TBD") {
      return "Contact for Pricing";
    }

    // Extract min and max prices from the price string
    const matches = pricePerSquare.match(/\$?([\d,]+)(?:-\$?([\d,]+))?/);
    if (!matches) return pricePerSquare;

    const minPrice = parseInt(matches[1].replace(/,/g, ""));
    const maxPrice = matches[2] ? parseInt(matches[2].replace(/,/g, "")) : minPrice;

    const minTotal = (minPrice * totalSquares).toFixed(0);
    const maxTotal = (maxPrice * totalSquares).toFixed(0);

    if (minPrice === maxPrice) {
      return `$${parseInt(minTotal).toLocaleString()}`;
    }

    return `$${parseInt(minTotal).toLocaleString()} - $${parseInt(maxTotal).toLocaleString()}`;
  };

  const getPriceLabel = (pricePerSquare: string): string => {
    if (pricePerSquare === "TBD") {
      return "Per Square";
    }
    return pricePerSquare.includes("/sq") ? pricePerSquare : `${pricePerSquare}/sq`;
  };

  const handlePackageClick = (pkg: Package) => {
    setSelectedPkg(pkg);
    setShowQuoteDialog(true);
  };

  const handleRequestQuote = () => {
    if (selectedPkg) {
      const estimatedPrice = calculatePriceRange(selectedPkg.pricePerSquare);
      onSelectPackage(selectedPkg.name, estimatedPrice);
      setShowQuoteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Package Recommendations</h2>
        <p className="text-lg text-muted-foreground">
          Based on your {totalSquares.toFixed(2)} squares measurement
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const estimatedPrice = calculatePriceRange(pkg.pricePerSquare);
          const isContactPricing = estimatedPrice === "Contact for Pricing";

          return (
            <Card 
              key={pkg.name} 
              className="shadow-card hover:shadow-elevated transition-all hover:border-primary/50 cursor-pointer"
              onClick={() => handlePackageClick(pkg)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <CardDescription className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {getPriceLabel(pkg.pricePerSquare)}
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {estimatedPrice}
                  </div>
                  {!isContactPricing && (
                    <div className="text-xs text-muted-foreground">
                      Estimated total for {totalSquares.toFixed(2)} squares
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePackageClick(pkg);
                  }}
                  className="w-full"
                  variant={isContactPricing ? "outline" : "default"}
                >
                  Get Instant Quote
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instant Quote Dialog */}
      {selectedPkg && (
        <InstantQuoteDialog
          open={showQuoteDialog}
          onOpenChange={setShowQuoteDialog}
          packageName={selectedPkg.name}
          pricePerSquare={selectedPkg.pricePerSquare}
          totalSquares={totalSquares}
          estimatedPrice={calculatePriceRange(selectedPkg.pricePerSquare)}
          onRequestQuote={handleRequestQuote}
        />
      )}
    </div>
  );
}
