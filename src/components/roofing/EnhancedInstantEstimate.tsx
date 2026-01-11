import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  Download, 
  Edit2, 
  Ruler, 
  DollarSign,
  Crown,
  Star,
  Hammer,
  ArrowRight,
  Square,
  Home,
  Percent
} from "lucide-react";
import { InlineFinancingSelector, SelectedFinancing } from "./InlineFinancingSelector";
import { SchedulingDialog } from "./SchedulingDialog";
import { 
  PackageConfig, 
  formatPriceRange, 
  formatPerSquarePrice,
  calculateEstimate 
} from "@/lib/packagePricing";
import { 
  generateProfessionalEstimatePdf, 
  downloadProfessionalPdf,
  ProfessionalEstimatePdfData 
} from "@/lib/generateProfessionalEstimatePdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card3D, GlassPanel } from "@/components/crm-ui";
import { cn } from "@/lib/utils";

interface MeasurementData {
  baseSqft: number;
  pitchMultiplier: number;
  trueSqft: number;
  wastePct: number;
  totalWithWaste: number;
  roofSquares: number;
  roofComplexity: string;
}

interface PackageOption {
  package: PackageConfig;
  estimateLow: number;
  estimateHigh: number;
  tier: "good" | "better" | "best";
  isRecommended?: boolean;
}

interface EnhancedInstantEstimateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  measurements: MeasurementData;
  propertyAddress: string;
  cityState?: string;
  packages: PackageOption[];
  selectedPackageId?: string;
  quizResponseId?: string | null;
  onComplete: () => void;
}

const getTierIcon = (tier: string) => {
  switch (tier) {
    case "good": return Hammer;
    case "better": return Star;
    case "best": return Crown;
    default: return Star;
  }
};

const getTierLabel = (tier: string) => {
  switch (tier) {
    case "good": return "Good";
    case "better": return "Better";
    case "best": return "Best";
    default: return tier;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case "good": return "bg-amber-600";
    case "better": return "bg-blue-500";
    case "best": return "bg-purple-500";
    default: return "bg-slate-500";
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function EnhancedInstantEstimate({
  open,
  onOpenChange,
  measurements,
  propertyAddress,
  cityState,
  packages,
  selectedPackageId,
  quizResponseId,
  onComplete
}: EnhancedInstantEstimateProps) {
  // Find the recommended package or default to first
  const recommendedPkg = packages.find(p => p.isRecommended) || packages.find(p => p.tier === "better") || packages[0];
  
  const [selectedTier, setSelectedTier] = useState<string>(
    selectedPackageId ? packages.find(p => p.package.id === selectedPackageId)?.tier || recommendedPkg?.tier || "better" : recommendedPkg?.tier || "better"
  );
  const [manualSquares, setManualSquares] = useState<number | null>(null);
  const [isEditingSquares, setIsEditingSquares] = useState(false);
  const [selectedFinancing, setSelectedFinancing] = useState<SelectedFinancing | null>(null);
  const [showScheduling, setShowScheduling] = useState(false);
  const [appointmentType, setAppointmentType] = useState<"zoom" | "in_person">("zoom");

  const currentPackage = packages.find(p => p.tier === selectedTier) || packages[0];
  
  const displaySquares = manualSquares ?? measurements.roofSquares;
  
  // Recalculate estimates based on potentially adjusted squares
  const currentEstimates = useMemo(() => {
    if (!currentPackage) return { low: 0, high: 0 };
    return calculateEstimate(currentPackage.package, displaySquares);
  }, [currentPackage, displaySquares]);

  const averageEstimate = Math.round((currentEstimates.low + currentEstimates.high) / 2);

  // Save user-adjusted measurements to cache for future use
  const saveUserAdjustment = async () => {
    if (!manualSquares || manualSquares === measurements.roofSquares) return;
    
    try {
      const normalizedAddr = propertyAddress.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      const { error } = await supabase
        .from('roof_analysis_cache')
        .update({
          user_adjusted_squares: manualSquares,
          user_adjusted_sqft: manualSquares * 100,
          updated_at: new Date().toISOString()
        })
        .eq('normalized_address', normalizedAddr);
      
      if (!error) {
        toast.success("Measurements saved! Future estimates will use these values.");
      }
    } catch (error) {
      console.error("Error saving user adjustment:", error);
    }
  };

  const handleDownloadPdf = async () => {
    if (!currentPackage) return;

    // Save user adjustments if any
    await saveUserAdjustment();

    const comparisonPackages = packages.map(p => ({
      package: p.package,
      estimateLow: calculateEstimate(p.package, displaySquares).low,
      estimateHigh: calculateEstimate(p.package, displaySquares).high,
      isRecommended: p.isRecommended || p.tier === "better"
    }));

    const pdfData: ProfessionalEstimatePdfData = {
      customerName: "Homeowner",
      customerEmail: "",
      customerPhone: "",
      propertyAddress: propertyAddress,
      roofSquares: displaySquares,
      pitch: measurements.roofComplexity,
      complexity: measurements.roofComplexity,
      selectedPackage: currentPackage.package,
      estimateLow: currentEstimates.low,
      estimateHigh: currentEstimates.high,
      comparisonPackages,
      financing: selectedFinancing ? {
        lenderName: selectedFinancing.lenderName,
        rate: selectedFinancing.rate,
        termYears: selectedFinancing.termYears,
        monthlyPayment: selectedFinancing.monthlyPayment,
        totalCost: selectedFinancing.totalCost
      } : null
    };

    const { blob } = generateProfessionalEstimatePdf(pdfData);
    downloadProfessionalPdf(blob, "Homeowner");
    toast.success("Your professional estimate PDF has been downloaded!");
  };

  const handleContinue = async (type: "zoom" | "in_person") => {
    // Save user adjustments if any
    await saveUserAdjustment();
    
    setAppointmentType(type);
    setShowScheduling(true);
  };

  const handleSchedulingComplete = () => {
    setShowScheduling(false);
    onComplete();
    onOpenChange(false);
  };

  if (!currentPackage || packages.length === 0) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-muted/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Your Instant Estimate
            </DialogTitle>
            <DialogDescription>
              Based on your roof measurement at {propertyAddress}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Measurement Stats Grid - 3D Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card3D glassEffect tiltIntensity={8} className="p-4 text-center">
                <Square className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Base Sq Ft</p>
                <p className="text-xl font-bold">{measurements.baseSqft.toLocaleString()}</p>
              </Card3D>
              
              <Card3D glassEffect tiltIntensity={8} className="p-4 text-center">
                <Home className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">True Sq Ft</p>
                <p className="text-xl font-bold">{measurements.trueSqft.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">×{measurements.pitchMultiplier.toFixed(2)} pitch</p>
              </Card3D>
              
              <Card3D glassEffect tiltIntensity={8} className="p-4 text-center bg-primary/5">
                <Percent className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">With Waste</p>
                <p className="text-xl font-bold text-primary">{measurements.totalWithWaste.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">+{Math.round(measurements.wastePct * 100)}%</p>
              </Card3D>
              
              <Card3D glassEffect tiltIntensity={8} className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/20">
                <Ruler className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Roof Squares</p>
                <p className="text-2xl font-bold text-primary">{displaySquares.toFixed(1)}</p>
              </Card3D>
            </div>

            {/* Confidence Badge */}
            <div className="flex justify-center">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                High Confidence Measurement
              </Badge>
            </div>

            {/* Adjustable Squares - 3D Card */}
            <Card3D glassEffect className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-primary" />
                    <span className="font-medium">Adjust Roof Squares</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingSquares(!isEditingSquares)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    {isEditingSquares ? "Done" : "Adjust"}
                  </Button>
                </div>
                
                <p className="text-3xl font-bold text-center bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  {displaySquares.toFixed(1)} squares
                </p>
                
                {isEditingSquares && (
                  <div className="mt-4 space-y-3">
                    <Slider
                      value={[displaySquares]}
                      onValueChange={(v) => setManualSquares(v[0])}
                      min={10}
                      max={100}
                      step={0.5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10 sq</span>
                      <span>100 sq</span>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      AI detected: {measurements.roofSquares.toFixed(1)} squares
                    </p>
                  </div>
                )}
                
                {manualSquares && (
                  <Button
                    variant="link"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setManualSquares(null)}
                  >
                    Reset to AI measurement
                  </Button>
                )}
              </CardContent>
            </Card3D>

            {/* Price Estimate Display - GlassPanel with glow */}
            <GlassPanel 
              blur="md" 
              glowBorder 
              className="p-6 text-center bg-gradient-to-br from-emerald-500/10 via-green-500/15 to-teal-500/10"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl rounded-full mx-auto w-16 h-16" />
                <DollarSign className="h-10 w-10 text-green-500 mx-auto mb-2 relative z-10" />
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatPriceRange(currentEstimates.low, currentEstimates.high)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Estimated Total</p>
            </GlassPanel>

            {/* Good/Better/Best Package Tabs */}
            <div className="space-y-3">
              <h3 className="font-semibold text-center">Compare Options</h3>
              <Tabs value={selectedTier} onValueChange={setSelectedTier}>
                <TabsList className="grid w-full grid-cols-3">
                  {packages.map((pkg) => {
                    const TierIcon = getTierIcon(pkg.tier);
                    return (
                      <TabsTrigger key={pkg.tier} value={pkg.tier} className="gap-1">
                        <TierIcon className="h-4 w-4" />
                        {getTierLabel(pkg.tier)}
                        {pkg.isRecommended && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {packages.map((pkg) => {
                  const estimates = calculateEstimate(pkg.package, displaySquares);
                  return (
                    <TabsContent key={pkg.tier} value={pkg.tier} className="mt-3">
                      <Card3D 
                        glassEffect 
                        tiltIntensity={6}
                        className={cn(
                          "overflow-hidden transition-all duration-300",
                          pkg.isRecommended && "ring-2 ring-primary shadow-lg shadow-primary/20"
                        )}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${getTierColor(pkg.tier)} text-white`}>
                                  {pkg.package.displayName}
                                </Badge>
                                {pkg.isRecommended && (
                                  <Badge variant="outline" className="text-xs border-primary/50 bg-primary/5">Recommended</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {formatPerSquarePrice(pkg.package)} per square
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                                {formatPriceRange(estimates.low, estimates.high)}
                              </p>
                            </div>
                          </div>
                          
                          <ul className="text-sm space-y-1">
                            {pkg.package.highlights.map((highlight, idx) => (
                              <li key={idx} className="flex gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <p className="text-xs text-muted-foreground">
                            {pkg.package.warranty} • {pkg.package.installDays}
                          </p>
                        </CardContent>
                      </Card3D>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>

            {/* Financing Section */}
            <InlineFinancingSelector
              estimateAmount={averageEstimate}
              onSelect={setSelectedFinancing}
              selectedPlanId={selectedFinancing?.planId}
            />

            {/* Monthly Payment Display - GlassPanel */}
            {selectedFinancing && (
              <GlassPanel blur="sm" className="p-4 text-center bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {formatCurrency(selectedFinancing.monthlyPayment)}/mo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedFinancing.lenderName} • {selectedFinancing.rate}% APR • {selectedFinancing.termYears} years
                </p>
              </GlassPanel>
            )}

            {/* Action Buttons - Enhanced with gradients */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handleDownloadPdf} 
                className="gap-2 hover:shadow-md transition-all duration-300"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button 
                onClick={() => handleContinue("zoom")} 
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              >
                Continue to Schedule
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              * Final price may vary based on inspection and site conditions
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scheduling Dialog */}
      <SchedulingDialog
        open={showScheduling}
        onOpenChange={setShowScheduling}
        appointmentType={appointmentType}
        consultationData={{
          roofType: currentPackage.package.category,
          priority: "",
          timeline: "medium",
          budget: currentPackage.package.tier,
          zipCode: propertyAddress,
          sqft: displaySquares * 100,
          recommendedPackage: currentPackage.package.name,
          estimatedPrice: currentEstimates.high
        }}
        measurementData={{
          baseSqft: measurements.baseSqft,
          pitchMultiplier: measurements.pitchMultiplier,
          trueSqft: measurements.trueSqft,
          wastePct: measurements.wastePct,
          totalWithWaste: measurements.totalWithWaste,
          roofSquares: displaySquares,
          roofComplexity: measurements.roofComplexity
        }}
        packageData={{
          name: currentPackage.package.name,
          features: currentPackage.package.highlights,
          pricePerSquare: formatPerSquarePrice(currentPackage.package),
          estimateLow: currentEstimates.low,
          estimateHigh: currentEstimates.high
        }}
        financingData={selectedFinancing}
        quizData={quizResponseId ? {
          quizResponseId,
          recommendations: packages.map(p => ({
            tier: p.tier,
            name: p.package.name,
            estimateLow: calculateEstimate(p.package, displaySquares).low,
            estimateHigh: calculateEstimate(p.package, displaySquares).high,
            reason: p.package.highlights[0] || "",
            features: p.package.highlights
          })),
          address: propertyAddress,
          cityState: cityState || "",
          roofSquares: displaySquares
        } : undefined}
        onComplete={handleSchedulingComplete}
      />
    </>
  );
}
