import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, TrendingUp, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RoofMeasurements {
  totalSquares: number;
  flatArea: number;
  pitchedArea: number;
  pitchMultiplier: number;
  wasteFactor: number;
  address?: string;
}

interface Package {
  name: string;
  pricePerSquare: string;
  features: string[];
}

interface AIQuoteGeneratorProps {
  measurements: RoofMeasurements;
  packages: Package[];
  onSelectPackage: (packageName: string, estimatedPrice: string) => void;
}

interface QuoteData {
  recommendedPackage: string;
  reasoning: string;
  estimatedPriceRange: {
    low: number;
    high: number;
  };
  priceBreakdown?: {
    materials: string;
    labor: string;
    permits: string;
    contingency: string;
  };
  timeline?: {
    preparationDays: number;
    installationDays: number;
    totalDays: number;
  };
  keyConsiderations: string[];
  upgradeSuggestions?: Array<{
    item: string;
    benefit: string;
    estimatedCost: string;
  }>;
  warnings: string[];
  financingOptions?: string;
}

export function AIQuoteGenerator({ measurements, packages, onSelectPackage }: AIQuoteGeneratorProps) {
  const [step, setStep] = useState<"details" | "generating" | "results">("details");
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  
  const [propertyDetails, setPropertyDetails] = useState({
    roofAge: "",
    currentCondition: "",
    roofType: "",
    priority: "balanced",
    hasLeaks: false,
    hasStormDamage: false,
    specialFeatures: [] as string[],
  });

  const specialFeatureOptions = [
    { id: "skylights", label: "Skylights" },
    { id: "solar_panels", label: "Solar Panels" },
    { id: "chimney", label: "Chimney" },
    { id: "dormers", label: "Dormers" },
    { id: "multiple_levels", label: "Multiple Levels" },
    { id: "steep_pitch", label: "Steep Pitch (>8/12)" },
  ];

  const handleGenerateQuote = async () => {
    setStep("generating");

    try {
      const { data, error } = await supabase.functions.invoke("ai-quote-generator", {
        body: {
          measurements,
          propertyDetails,
          packages,
        },
      });

      if (error) throw error;
      
      setQuoteData(data);
      setStep("results");
    } catch (error) {
      console.error("Error generating quote:", error);
      toast.error("Failed to generate AI quote. Please try again.");
      setStep("details");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (step === "details") {
    return (
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Quote Generator
          </CardTitle>
          <CardDescription>
            Tell us about your roof and we'll generate a personalized quote recommendation
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Roof Age */}
          <div className="space-y-3">
            <Label className="text-base font-medium">How old is your current roof?</Label>
            <RadioGroup
              value={propertyDetails.roofAge}
              onValueChange={(value) => setPropertyDetails({ ...propertyDetails, roofAge: value })}
              className="grid grid-cols-2 md:grid-cols-4 gap-2"
            >
              {["0-5 years", "5-10 years", "10-20 years", "20+ years"].map((age) => (
                <div key={age} className="flex items-center space-x-2">
                  <RadioGroupItem value={age} id={`age-${age}`} />
                  <Label htmlFor={`age-${age}`} className="cursor-pointer">{age}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Current Condition */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Current roof condition?</Label>
            <RadioGroup
              value={propertyDetails.currentCondition}
              onValueChange={(value) => setPropertyDetails({ ...propertyDetails, currentCondition: value })}
              className="grid grid-cols-2 md:grid-cols-4 gap-2"
            >
              {["Excellent", "Good", "Fair", "Poor"].map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <RadioGroupItem value={condition} id={`condition-${condition}`} />
                  <Label htmlFor={`condition-${condition}`} className="cursor-pointer">{condition}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Roof Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Current roof type?</Label>
            <RadioGroup
              value={propertyDetails.roofType}
              onValueChange={(value) => setPropertyDetails({ ...propertyDetails, roofType: value })}
              className="grid grid-cols-2 md:grid-cols-3 gap-2"
            >
              {["Shingle", "Metal", "Tile", "Flat", "Mixed", "Unknown"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={`type-${type}`} />
                  <Label htmlFor={`type-${type}`} className="cursor-pointer">{type}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label className="text-base font-medium">What's your priority?</Label>
            <RadioGroup
              value={propertyDetails.priority}
              onValueChange={(value) => setPropertyDetails({ ...propertyDetails, priority: value })}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="budget" id="priority-budget" />
                <Label htmlFor="priority-budget" className="cursor-pointer">Budget-Friendly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="balanced" id="priority-balanced" />
                <Label htmlFor="priority-balanced" className="cursor-pointer">Balanced</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="premium" id="priority-premium" />
                <Label htmlFor="priority-premium" className="cursor-pointer">Premium Quality</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Issues */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Any current issues?</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasLeaks"
                  checked={propertyDetails.hasLeaks}
                  onCheckedChange={(checked) => 
                    setPropertyDetails({ ...propertyDetails, hasLeaks: checked as boolean })
                  }
                />
                <Label htmlFor="hasLeaks" className="cursor-pointer">Active Leaks</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasStormDamage"
                  checked={propertyDetails.hasStormDamage}
                  onCheckedChange={(checked) => 
                    setPropertyDetails({ ...propertyDetails, hasStormDamage: checked as boolean })
                  }
                />
                <Label htmlFor="hasStormDamage" className="cursor-pointer">Storm Damage</Label>
              </div>
            </div>
          </div>

          {/* Special Features */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Special features on your roof?</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specialFeatureOptions.map((feature) => (
                <div key={feature.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature.id}
                    checked={propertyDetails.specialFeatures.includes(feature.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPropertyDetails({
                          ...propertyDetails,
                          specialFeatures: [...propertyDetails.specialFeatures, feature.id],
                        });
                      } else {
                        setPropertyDetails({
                          ...propertyDetails,
                          specialFeatures: propertyDetails.specialFeatures.filter((f) => f !== feature.id),
                        });
                      }
                    }}
                  />
                  <Label htmlFor={feature.id} className="cursor-pointer">{feature.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerateQuote} size="lg" className="w-full">
            <Sparkles className="mr-2 h-5 w-5" />
            Generate AI Quote Recommendation
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "generating") {
    return (
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="py-16 text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h3 className="text-xl font-semibold">Analyzing Your Property...</h3>
          <p className="text-muted-foreground">
            Our AI is reviewing your measurements and property details to generate the best recommendation.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === "results" && quoteData) {
    return (
      <div className="space-y-6">
        {/* Recommended Package */}
        <Card className="border-primary shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Recommendation: {quoteData.recommendedPackage}
            </CardTitle>
            <CardDescription className="text-base">
              Based on your {measurements.totalSquares.toFixed(1)} squares and property details
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Price Range */}
            <div className="bg-primary/5 rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Estimated Total Cost</p>
              <p className="text-4xl font-bold text-primary">
                {formatCurrency(quoteData.estimatedPriceRange.low)} - {formatCurrency(quoteData.estimatedPriceRange.high)}
              </p>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="font-semibold mb-2">Why We Recommend This:</h4>
              <p className="text-muted-foreground">{quoteData.reasoning}</p>
            </div>

            {/* Price Breakdown */}
            {quoteData.priceBreakdown && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Materials</p>
                    <p className="font-semibold">{quoteData.priceBreakdown.materials}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Labor</p>
                    <p className="font-semibold">{quoteData.priceBreakdown.labor}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Permits</p>
                    <p className="font-semibold">{quoteData.priceBreakdown.permits}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Contingency</p>
                    <p className="font-semibold">{quoteData.priceBreakdown.contingency}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            {quoteData.timeline && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Estimated Timeline
                </h4>
                <div className="flex gap-4 flex-wrap">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Preparation</p>
                    <p className="font-semibold">{quoteData.timeline.preparationDays} days</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Installation</p>
                    <p className="font-semibold">{quoteData.timeline.installationDays} days</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-semibold text-primary">{quoteData.timeline.totalDays} days</p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Considerations */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Key Considerations
              </h4>
              <ul className="space-y-2">
                {quoteData.keyConsiderations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Warnings */}
            {quoteData.warnings && quoteData.warnings.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Important Notes
                </h4>
                <ul className="space-y-1">
                  {quoteData.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-destructive">{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Upgrade Suggestions */}
            {quoteData.upgradeSuggestions && quoteData.upgradeSuggestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Optional Upgrades
                </h4>
                <div className="space-y-2">
                  {quoteData.upgradeSuggestions.map((upgrade, idx) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-3 flex justify-between items-start">
                      <div>
                        <p className="font-medium">{upgrade.item}</p>
                        <p className="text-sm text-muted-foreground">{upgrade.benefit}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">{upgrade.estimatedCost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financing */}
            {quoteData.financingOptions && (
              <div className="bg-accent/10 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Financing Available</h4>
                <p className="text-sm text-muted-foreground">{quoteData.financingOptions}</p>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={() => onSelectPackage(
                  quoteData.recommendedPackage,
                  `${formatCurrency(quoteData.estimatedPriceRange.low)} - ${formatCurrency(quoteData.estimatedPriceRange.high)}`
                )}
              >
                Request Official Quote for {quoteData.recommendedPackage}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setStep("details")}
              >
                Adjust Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
