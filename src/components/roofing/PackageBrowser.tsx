import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Sparkles, Star, Zap, Crown, Shield, Hammer } from "lucide-react";
import { NotSurePackageCard } from "./NotSurePackageCard";

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

export function PackageBrowser({ 
  packages, 
  comparisonPackages, 
  onSelectPackage, 
  onToggleComparison,
  onStartQuiz 
}: PackageBrowserProps) {
  const isInComparison = (pkg: RoofingPackage) => 
    comparisonPackages.some(p => p.name === pkg.name);

  const canAddToComparison = comparisonPackages.length < 3;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Choose Your Roofing Package</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse our comprehensive range of roofing solutions. Click any package to get your instant AI-powered estimate.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Not Sure Card - First Position */}
        <NotSurePackageCard onStartQuiz={onStartQuiz} />

        {/* Package Cards */}
        {packages.map((pkg) => {
          const tierInfo = getTierInfo(pkg.name);
          const TierIcon = tierInfo.icon;
          const isPopular = isPopularPackage(pkg.name);
          const inComparison = isInComparison(pkg);

          return (
            <Card 
              key={pkg.name} 
              className={`relative shadow-card hover:shadow-elevated transition-all duration-300 group ${
                isPopular ? "ring-2 ring-primary" : ""
              } ${inComparison ? "ring-2 ring-blue-500" : ""}`}
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
                  <div className="flex items-center gap-1.5">
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
                  onClick={() => onSelectPackage(pkg)}
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
  );
}
