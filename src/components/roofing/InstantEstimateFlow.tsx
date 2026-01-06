import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, CheckCircle2, ArrowLeft, Home, Ruler, DollarSign, Edit2, Video, Users, Clock, Palette, AlertTriangle, FileText, Mail } from "lucide-react";
import { RoofingPackage } from "./PackageBrowser";
import { SchedulingDialog } from "./SchedulingDialog";
import { RoofPhotoUpload } from "./RoofPhotoUpload";
import { Roof3DVisualization } from "@/components/shared/Roof3DVisualization";
import { MeasurementWizard } from "@/components/shared/MeasurementWizard";
import { MeasurementResult } from "@/lib/roofMeasurements";
import { InlineFinancingSelector, SelectedFinancing } from "./InlineFinancingSelector";
import { generateRoofEstimatePdf, downloadPdf } from "@/lib/generateRoofEstimatePdf";
import { toast } from "sonner";

interface InstantEstimateFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPackage: RoofingPackage | null;
  onRequestQuote: (pkg: RoofingPackage, estimate: EstimateResult) => void;
  onCompareOthers: () => void;
}

interface EstimateResult {
  address: string;
  totalSquares: number;
  confidence: string;
  estimateLow: number;
  estimateHigh: number;
  roofComplexity?: string;
  flatSqft?: number;
  adjustedSqft?: number;
  hasMixedRoof?: boolean;
  shingleSection?: { sqft: number; color: string };
  flatSection?: { sqft: number; color: string };
  primaryRoofColor?: string;
  estimatedAgeYears?: number;
  ageConfidence?: string;
  degradationNotes?: string;
}

const parsePrice = (priceStr: string): { low: number; high: number } | null => {
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

const normalizeAddress = (addr: string): string => {
  return addr.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9\s]/g, '').trim();
};

type Step = "measurement" | "results";

export function InstantEstimateFlow({ 
  open, 
  onOpenChange, 
  selectedPackage,
  onRequestQuote,
  onCompareOthers
}: InstantEstimateFlowProps) {
  const [step, setStep] = useState<Step>("measurement");
  const [measurementResult, setMeasurementResult] = useState<MeasurementResult | null>(null);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [manualSquares, setManualSquares] = useState<number | null>(null);
  const [isEditingSquares, setIsEditingSquares] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [appointmentType, setAppointmentType] = useState<"zoom" | "in_person">("zoom");
  const [selectedFinancing, setSelectedFinancing] = useState<SelectedFinancing | null>(null);

  const resetFlow = () => {
    setStep("measurement");
    setMeasurementResult(null);
    setEstimate(null);
    setManualSquares(null);
    setIsEditingSquares(false);
    setSelectedFinancing(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetFlow();
    }
    onOpenChange(open);
  };

  const handleMeasurementComplete = (result: MeasurementResult) => {
    setMeasurementResult(result);
    
    if (!selectedPackage) return;
    
    // Calculate price based on package
    const price = parsePrice(selectedPackage.pricePerSquare);
    const estimateLow = price ? Math.round(price.low * result.squares) : 0;
    const estimateHigh = price ? Math.round(price.high * result.squares) : 0;

    setEstimate({
      address: result.address,
      totalSquares: result.squares,
      confidence: result.confidence,
      estimateLow,
      estimateHigh,
      roofComplexity: result.complexity,
      flatSqft: result.baseSqFt,
      adjustedSqft: result.totalWithWaste,
    });

    setStep("results");
  };

  const getDisplaySquares = () => manualSquares ?? estimate?.totalSquares ?? 0;
  
  const getDisplayEstimates = () => {
    if (!selectedPackage || !estimate) return { low: 0, high: 0 };
    const squares = getDisplaySquares();
    const price = parsePrice(selectedPackage.pricePerSquare);
    return {
      low: price ? Math.round(price.low * squares) : 0,
      high: price ? Math.round(price.high * squares) : 0
    };
  };

  const getAgeLabel = (years: number) => {
    if (years <= 5) return 'New';
    if (years <= 12) return 'Good';
    if (years <= 20) return 'Aging';
    return 'End of Life';
  };

  const getAgeColor = (years: number) => {
    if (years <= 5) return 'bg-green-100 text-green-700';
    if (years <= 12) return 'bg-blue-100 text-blue-700';
    if (years <= 20) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const handleDownloadPdf = () => {
    if (!selectedPackage || !estimate || !measurementResult) return;

    const estimates = getDisplayEstimates();
    const pdfData = {
      customerName: "Homeowner",
      customerEmail: "",
      customerPhone: "",
      propertyAddress: estimate.address,
      baseSqft: measurementResult.baseSqFt,
      pitchMultiplier: measurementResult.pitchMultiplier,
      trueSqft: measurementResult.trueSqft,
      wastePct: measurementResult.wastePct,
      totalWithWaste: measurementResult.totalWithWaste,
      roofSquares: getDisplaySquares(),
      roofComplexity: estimate.roofComplexity || "Standard",
      packageName: selectedPackage.name,
      packageFeatures: selectedPackage.features,
      pricePerSquare: selectedPackage.pricePerSquare,
      estimateLow: estimates.low,
      estimateHigh: estimates.high,
      financing: selectedFinancing ? {
        lenderName: selectedFinancing.lenderName,
        rate: selectedFinancing.rate,
        termYears: selectedFinancing.termYears,
        monthlyPayment: selectedFinancing.monthlyPayment,
        totalCost: selectedFinancing.totalCost
      } : null
    };

    const { blob } = generateRoofEstimatePdf(pdfData);
    downloadPdf(blob, `roof-estimate-${Date.now()}.pdf`);
    toast.success("Your estimate PDF has been downloaded!");
  };

  if (!selectedPackage) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {step === "measurement" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary" />
                Get Your Instant Estimate
              </DialogTitle>
              <DialogDescription>
                <span className="font-medium text-foreground">{selectedPackage.name}</span>
                <span className="mx-2">•</span>
                <span className="text-primary font-medium">{selectedPackage.pricePerSquare}/sq</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <MeasurementWizard
                serviceType="reroof"
                onMeasurementComplete={handleMeasurementComplete}
              />
            </div>
          </>
        )}

        {step === "results" && estimate && measurementResult && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Your Instant Estimate
              </DialogTitle>
              <DialogDescription>
                Based on your roof measurement
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Confidence Badge */}
              <div className="flex justify-center">
                <Badge variant="outline" className="bg-background capitalize">
                  {estimate.confidence} Confidence
                </Badge>
              </div>

              {/* Measurement Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Base Sq Ft</p>
                  <p className="text-lg font-bold">{measurementResult.baseSqFt.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">True Sq Ft</p>
                  <p className="text-lg font-bold">{measurementResult.trueSqft.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">×{measurementResult.pitchMultiplier.toFixed(2)} pitch</p>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <p className="text-xs text-muted-foreground">With Waste</p>
                  <p className="text-lg font-bold text-primary">{measurementResult.totalWithWaste.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">+{(measurementResult.wastePct * 100).toFixed(0)}%</p>
                </div>
                <div className="text-center p-3 bg-primary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Roof Squares</p>
                  <p className="text-xl font-bold text-primary">{measurementResult.squares.toFixed(1)}</p>
                </div>
              </div>

              {/* Roof Age & Color Info */}
              {(estimate.estimatedAgeYears || estimate.primaryRoofColor) && (
                <div className="grid grid-cols-2 gap-3">
                  {estimate.estimatedAgeYears && (
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Roof Age</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">~{estimate.estimatedAgeYears} years</span>
                          <Badge className={`text-xs ${getAgeColor(estimate.estimatedAgeYears)}`}>
                            {getAgeLabel(estimate.estimatedAgeYears)}
                          </Badge>
                        </div>
                        {estimate.ageConfidence && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {estimate.ageConfidence} confidence
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {estimate.primaryRoofColor && (
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Palette className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Roof Color</span>
                        </div>
                        <span className="font-semibold capitalize">{estimate.primaryRoofColor}</span>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Mixed Roof Detection */}
              {estimate.hasMixedRoof && (estimate.shingleSection || estimate.flatSection) && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Home className="h-5 w-5 text-amber-600" />
                      <span className="font-medium text-amber-800">Mixed Roof Detected</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {estimate.shingleSection && (
                        <div>
                          <p className="text-muted-foreground text-xs">Shingle Section</p>
                          <p className="font-medium">{Math.round(estimate.shingleSection.sqft).toLocaleString()} sq ft</p>
                          <p className="text-xs text-amber-700 capitalize">{estimate.shingleSection.color}</p>
                        </div>
                      )}
                      {estimate.flatSection && (
                        <div>
                          <p className="text-muted-foreground text-xs">Flat Section</p>
                          <p className="font-medium">{Math.round(estimate.flatSection.sqft).toLocaleString()} sq ft</p>
                          <p className="text-xs text-amber-700 capitalize">{estimate.flatSection.color}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Degradation Notes */}
              {estimate.degradationNotes && estimate.estimatedAgeYears && estimate.estimatedAgeYears > 15 && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">Condition Notes</p>
                        <p className="text-xs text-orange-700">{estimate.degradationNotes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Measurement with manual adjustment */}
              <Card>
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
                  
                  <p className="text-3xl font-bold text-center">
                    {getDisplaySquares().toFixed(1)} squares
                  </p>
                  
                  {isEditingSquares && (
                    <div className="mt-4 space-y-3">
                      <Slider
                        value={[getDisplaySquares()]}
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
                        AI detected: {estimate.totalSquares.toFixed(1)} squares
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
              </Card>

              {/* Price Estimate */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(getDisplayEstimates().low)} - {formatCurrency(getDisplayEstimates().high)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Estimated Total</p>
                </CardContent>
              </Card>

              {/* Inline Financing Selector */}
              <InlineFinancingSelector
                estimateAmount={Math.round((getDisplayEstimates().low + getDisplayEstimates().high) / 2)}
                onSelect={setSelectedFinancing}
                selectedPlanId={selectedFinancing?.planId}
              />

              {/* Monthly Payment Display */}
              {selectedFinancing && (
                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(selectedFinancing.monthlyPayment)}/mo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedFinancing.lenderName} • {selectedFinancing.rate}% APR • {selectedFinancing.termYears} years
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 3D Roof Visualization */}
              {estimate.roofComplexity && (
                <Roof3DVisualization
                  totalSqft={Math.round(getDisplaySquares() * 100)}
                  roofComplexity={estimate.roofComplexity as any}
                />
              )}

              {/* Photo Upload */}
              <RoofPhotoUpload
                address={estimate.address}
                normalizedAddress={normalizeAddress(estimate.address)}
                onAnalysisComplete={(analysis) => {
                  if (estimate) {
                    setEstimate({
                      ...estimate,
                      primaryRoofColor: analysis.detectedColor,
                      estimatedAgeYears: analysis.estimatedAgeYears,
                      ageConfidence: analysis.ageConfidence,
                      degradationNotes: analysis.analysisNotes
                    });
                  }
                }}
              />

              {/* Download PDF Button */}
              <Button 
                variant="outline"
                onClick={handleDownloadPdf}
                size="lg"
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download PDF Estimate
              </Button>

              {/* Actions - Schedule Consultation */}
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  onClick={() => {
                    setAppointmentType("zoom");
                    setShowScheduling(true);
                  }}
                  size="lg"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Get PDF Emailed & Schedule Call
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setAppointmentType("in_person");
                    setShowScheduling(true);
                  }}
                  size="lg"
                  className="w-full"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Schedule In-Person Meeting
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => {
                    handleClose(false);
                    onCompareOthers();
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Compare Other Packages
                </Button>
              </div>
            </div>

            {/* Scheduling Dialog */}
            <SchedulingDialog
              open={showScheduling}
              onOpenChange={setShowScheduling}
              appointmentType={appointmentType}
              consultationData={{
                roofType: estimate?.roofComplexity || "unknown",
                priority: "contact",
                timeline: "asap",
                budget: selectedPackage.pricePerSquare,
                zipCode: estimate.address,
                sqft: Math.round(getDisplaySquares() * 100),
                recommendedPackage: selectedPackage.name,
                estimatedPrice: Math.round((getDisplayEstimates().low + getDisplayEstimates().high) / 2)
              }}
              measurementData={{
                baseSqft: measurementResult.baseSqFt,
                pitchMultiplier: measurementResult.pitchMultiplier,
                trueSqft: measurementResult.trueSqft,
                wastePct: measurementResult.wastePct,
                totalWithWaste: measurementResult.totalWithWaste,
                roofSquares: getDisplaySquares(),
                roofComplexity: estimate.roofComplexity || "Standard"
              }}
              packageData={{
                name: selectedPackage.name,
                features: selectedPackage.features,
                pricePerSquare: selectedPackage.pricePerSquare,
                estimateLow: getDisplayEstimates().low,
                estimateHigh: getDisplayEstimates().high
              }}
              financingData={selectedFinancing}
              onComplete={() => {
                handleClose(false);
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
