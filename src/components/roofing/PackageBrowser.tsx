import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Sparkles, Star, Zap, Crown, Shield, Hammer } from "lucide-react";
import { EnhancedInstantEstimate } from "./EnhancedInstantEstimate";
import { 
  PackageConfig, 
  PACKAGE_CONFIGS, 
  getPackageById,
  calculateEstimate,
  getGoodBetterBest
} from "@/lib/packagePricing";

export interface RoofingPackage {
  name: string;
  pricePerSquare: string;
  features: string[];
  tier?: "economy" | "standard" | "premium" | "luxury";
  isPopular?: boolean;
}

interface PackageBrowserProps {
  packages: RoofingPackage[];
  comparisonPackages: RoofingPackage[];
  onSelectPackage: (pkg: RoofingPackage) => void;
  onToggleComparison: (pkg: RoofingPackage) => void;
  onStartQuiz: () => void;
}

const getTierInfo = (packageName: string) => {
  const name = packageName.toLowerCase();
  if (name.includes("bronze") || name.includes("blue collar special")) {
    return { tier: "economy", icon: Hammer, color: "bg-amber-600", label: "Economy" };
  }
  if (name.includes("silver") || name.includes("tile roof package")) {
    return { tier: "standard", icon: Star, color: "bg-slate-400", label: "Standard" };
  }
  if (name.includes("gold") || name.includes("blue collar+") || name.includes("tile+")) {
    return { tier: "premium", icon: Crown, color: "bg-yellow-500", label: "Premium" };
  }
  if (name.includes("platinum") || name.includes("ultimate")) {
    return { tier: "luxury", icon: Shield, color: "bg-gradient-to-r from-purple-500 to-pink-500", label: "Luxury" };
  }
  if (name.includes("refresh")) {
    return { tier: "specialty", icon: Zap, color: "bg-blue-500", label: "Specialty" };
  }
  return { tier: "standard", icon: Star, color: "bg-slate-400", label: "Standard" };
};

const isPopularPackage = (name: string) => {
  const popular = ["gold roof package", "silver roof package", "platinum roof package"];
  return popular.includes(name.toLowerCase());
};

// Map legacy RoofingPackage to PackageConfig
const findPackageConfig = (pkg: RoofingPackage): PackageConfig | undefined => {
  const name = pkg.name.toLowerCase();
  
  if (name.includes("bronze")) return getPackageById("bronze");
  if (name.includes("silver") && !name.includes("tile")) return getPackageById("silver");
  if (name.includes("gold") && !name.includes("tile")) return getPackageById("gold");
  if (name.includes("platinum")) return getPackageById("platinum");
  if (name.includes("ultimate")) return getPackageById("ultimate");
  if (name.includes("blue collar+")) return getPackageById("blue-collar-plus");
  if (name.includes("blue collar")) return getPackageById("blue-collar");
  if (name.includes("tile+")) return getPackageById("tile-plus");
  if (name.includes("tile")) return getPackageById("tile");
  
  return undefined;
};

export function PackageBrowser({ 
  packages, 
  comparisonPackages, 
  onSelectPackage, 
  onToggleComparison,
  onStartQuiz 
}: PackageBrowserProps) {
  const [showEstimate, setShowEstimate] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<RoofingPackage | null>(null);

  const isInComparison = (pkg: RoofingPackage) => 
    comparisonPackages.some(p => p.name === pkg.name);

  const canAddToComparison = comparisonPackages.length < 3;

  const handlePackageClick = (pkg: RoofingPackage) => {
    setSelectedPkg(pkg);
    setShowEstimate(true);
  };

  const handleEstimateComplete = () => {
    setShowEstimate(false);
    if (selectedPkg) {
      onSelectPackage(selectedPkg);
    }
  };

  // Build packages for the EnhancedInstantEstimate dialog
  const getEstimatePackages = () => {
    if (!selectedPkg) return [];
    
    const selectedConfig = findPackageConfig(selectedPkg);
    if (!selectedConfig) return [];
    
    // Get Good/Better/Best based on category
    const gbb = getGoodBetterBest(selectedConfig.category);
    
    // Default measurement data (user will see MeasurementWizard if opening from here)
    const defaultSquares = 30;
    
    const goodEst = calculateEstimate(gbb.good, defaultSquares);
    const betterEst = calculateEstimate(gbb.better, defaultSquares);
    const bestEst = calculateEstimate(gbb.best, defaultSquares);
    
    return [
      {
        package: gbb.good,
        estimateLow: goodEst.low,
        estimateHigh: goodEst.high,
        tier: "good" as const,
        isRecommended: gbb.good.id === selectedConfig.id
      },
      {
        package: gbb.better,
        estimateLow: betterEst.low,
        estimateHigh: betterEst.high,
        tier: "better" as const,
        isRecommended: gbb.better.id === selectedConfig.id || (gbb.good.id !== selectedConfig.id && gbb.best.id !== selectedConfig.id)
      },
      {
        package: gbb.best,
        estimateLow: bestEst.low,
        estimateHigh: bestEst.high,
        tier: "best" as const,
        isRecommended: gbb.best.id === selectedConfig.id
      }
    ];
  };

  return (
    <>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Choose Your Roofing Package</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our comprehensive range of roofing solutions. Click any package to get your instant AI-powered estimate.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Package Cards */}
          {packages.map((pkg) => {
            const tierInfo = getTierInfo(pkg.name);
            const TierIcon = tierInfo.icon;
            const isPopular = isPopularPackage(pkg.name);
            const inComparison = isInComparison(pkg);

            return (
              <Card 
                key={pkg.name} 
                className={`relative shadow-card hover:shadow-elevated transition-all duration-300 group cursor-pointer ${
                  isPopular ? "ring-2 ring-primary" : ""
                } ${inComparison ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => handlePackageClick(pkg)}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Popular Choice
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{pkg.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`${tierInfo.color} text-white border-0`}>
                          <TierIcon className="h-3 w-3 mr-1" />
                          {tierInfo.label}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Comparison Checkbox */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        id={`compare-${pkg.name}`}
                        checked={inComparison}
                        disabled={!inComparison && !canAddToComparison}
                        onCheckedChange={() => onToggleComparison(pkg)}
                        className="h-5 w-5"
                      />
                      <label 
                        htmlFor={`compare-${pkg.name}`}
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        Compare
                      </label>
                    </div>
                  </div>

                  <CardDescription className="text-2xl font-bold text-primary mt-2">
                    {pkg.pricePerSquare}
                    <span className="text-sm font-normal text-muted-foreground"> / square</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {pkg.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{feature}</span>
                      </li>
                    ))}
                    {pkg.features.length > 4 && (
                      <li className="text-sm text-muted-foreground ml-6">
                        +{pkg.features.length - 4} more features
                      </li>
                    )}
                  </ul>

                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePackageClick(pkg);
                    }}
                    className="w-full group-hover:bg-primary/90"
                    size="lg"
                  >
                    Get Your Instant Estimate
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Enhanced Instant Estimate Dialog */}
      {selectedPkg && (
        <EnhancedInstantEstimate
          open={showEstimate}
          onOpenChange={setShowEstimate}
          measurements={{
            baseSqft: 3000,
            pitchMultiplier: 1.12,
            trueSqft: 3360,
            wastePct: 0.10,
            totalWithWaste: 3696,
            roofSquares: 30,
            roofComplexity: "moderate"
          }}
          propertyAddress="Enter your address to get accurate measurements"
          packages={getEstimatePackages()}
          selectedPackageId={findPackageConfig(selectedPkg)?.id}
          onComplete={handleEstimateComplete}
        />
      )}
    </>
  );
}
