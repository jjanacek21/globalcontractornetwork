import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Mail, FileSignature, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { 
  PackageConfig, 
  formatPriceRange, 
  formatPerSquarePrice,
  calculateEstimate,
  getGoodBetterBest
} from "@/lib/packagePricing";
import { 
  generateProfessionalEstimatePdf, 
  downloadProfessionalPdf,
  ProfessionalEstimatePdfData 
} from "@/lib/generateProfessionalEstimatePdf";
import { EstimateApprovalModal } from "./EstimateApprovalModal";
import { supabase } from "@/integrations/supabase/client";

interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimateData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    propertyAddress: string;
    roofSquares: number;
    pitch?: string;
    complexity?: string;
    recommendedPackage: PackageConfig;
    preferredCategory?: "shingle" | "metal" | "tile";
    financing?: {
      lenderName: string;
      rate: number;
      termYears: number;
      monthlyPayment: number;
      totalCost: number;
    } | null;
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentType?: string;
  };
  onComplete?: () => void;
}

export const PdfPreviewModal = ({
  open,
  onOpenChange,
  estimateData,
  onComplete
}: PdfPreviewModalProps) => {
  const [selectedPackage, setSelectedPackage] = useState<PackageConfig>(estimateData.recommendedPackage);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Get Good/Better/Best options
  const comparison = getGoodBetterBest(estimateData.preferredCategory || "shingle");
  const packages = [comparison.good, comparison.better, comparison.best];
  const tierLabels = ["GOOD", "BETTER", "BEST"];

  useEffect(() => {
    setSelectedPackage(estimateData.recommendedPackage);
  }, [estimateData.recommendedPackage]);

  const currentEstimate = calculateEstimate(selectedPackage, estimateData.roofSquares);

  const comparisonPackages = packages.map((pkg) => {
    const est = calculateEstimate(pkg, estimateData.roofSquares);
    return {
      package: pkg,
      estimateLow: est.low,
      estimateHigh: est.high,
      isRecommended: pkg.id === estimateData.recommendedPackage.id
    };
  });

  const handleDownload = () => {
    const pdfData: ProfessionalEstimatePdfData = {
      ...estimateData,
      selectedPackage,
      estimateLow: currentEstimate.low,
      estimateHigh: currentEstimate.high,
      comparisonPackages
    };

    const { blob } = generateProfessionalEstimatePdf(pdfData);
    downloadProfessionalPdf(blob, estimateData.customerName);
    toast.success("PDF downloaded!");
  };

  const handleEmailEstimate = async () => {
    setSending(true);
    try {
      const pdfData: ProfessionalEstimatePdfData = {
        ...estimateData,
        selectedPackage,
        estimateLow: currentEstimate.low,
        estimateHigh: currentEstimate.high,
        comparisonPackages
      };

      const { base64 } = generateProfessionalEstimatePdf(pdfData);

      await supabase.functions.invoke('send-lead-confirmation', {
        body: {
          email: estimateData.customerEmail,
          name: estimateData.customerName,
          source: 'Roofing Estimate PDF',
          phone: estimateData.customerPhone,
          address: estimateData.propertyAddress,
          recommendedPackage: selectedPackage.name,
          estimateLow: currentEstimate.low,
          estimateHigh: currentEstimate.high,
          pdfBase64: base64,
          pdfFilename: `roofing-estimate-${estimateData.customerName.replace(/\s+/g, '-').toLowerCase()}.pdf`
        }
      });

      toast.success(`Estimate emailed to ${estimateData.customerEmail}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleSignAndApprove = () => {
    setShowSignatureModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Roofing Estimate</DialogTitle>
            <DialogDescription>
              Review package options and download your detailed PDF estimate
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="compare" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compare">Compare Options</TabsTrigger>
              <TabsTrigger value="details">Package Details</TabsTrigger>
            </TabsList>

            <TabsContent value="compare" className="space-y-4 mt-4">
              {/* Property Summary */}
              <div className="bg-muted/50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{estimateData.propertyAddress}</p>
                  <p className="text-sm text-muted-foreground">
                    {estimateData.roofSquares.toFixed(1)} Roof Squares
                    {estimateData.pitch && ` • Pitch: ${estimateData.pitch}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Selected Package</p>
                  <p className="font-semibold text-primary">{selectedPackage.displayName}</p>
                </div>
              </div>

              {/* Package Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg, i) => {
                  const estimate = calculateEstimate(pkg, estimateData.roofSquares);
                  const isSelected = pkg.id === selectedPackage.id;
                  const isRecommended = pkg.id === estimateData.recommendedPackage.id;

                  return (
                    <Card 
                      key={pkg.id}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Tier Badge */}
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={i === 2 ? "default" : "secondary"}
                            className={i === 2 ? "bg-primary" : ""}
                          >
                            {tierLabels[i]}
                          </Badge>
                          {isRecommended && (
                            <Badge variant="outline" className="gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Star className="h-3 w-3 fill-current" />
                              Recommended
                            </Badge>
                          )}
                        </div>

                        {/* Package Name & Price */}
                        <div>
                          <h4 className="font-semibold">{pkg.displayName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatPerSquarePrice(pkg)} per square
                          </p>
                        </div>

                        {/* Estimate Range */}
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-lg font-bold text-primary">
                            {formatPriceRange(estimate.low, estimate.high)}
                          </p>
                          <p className="text-xs text-muted-foreground">Estimated Total</p>
                        </div>

                        {/* Key Features */}
                        <div className="space-y-1">
                          {pkg.highlights.slice(0, 3).map((highlight, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Check className="h-3 w-3 text-primary flex-shrink-0" />
                              <span>{highlight}</span>
                            </div>
                          ))}
                        </div>

                        {/* Warranty */}
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium text-center">
                            {pkg.warranty.split(',')[0]}
                          </p>
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="flex items-center justify-center gap-1 text-primary text-sm font-medium">
                            <Check className="h-4 w-4" />
                            Selected
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Selected Package Details */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedPackage.name}</h3>
                    <p className="text-muted-foreground">{formatPerSquarePrice(selectedPackage)} per square</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {formatPriceRange(currentEstimate.low, currentEstimate.high)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {estimateData.roofSquares.toFixed(1)} squares × {formatPerSquarePrice(selectedPackage)}
                    </p>
                  </div>
                </div>

                {/* What's Included */}
                <div className="space-y-2">
                  <h4 className="font-medium">What's Included:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedPackage.lineItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allowances */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <h4 className="font-medium">Included Allowances:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.allowances.map((allowance, i) => (
                      <Badge key={i} variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {allowance.description}: {allowance.limit}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Warranty & Install */}
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Warranty</p>
                    <p className="font-medium">{selectedPackage.warranty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Installation Time</p>
                    <p className="font-medium">{selectedPackage.installDays}</p>
                  </div>
                </div>
              </div>

              {/* Trust Footer */}
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-1">ⓘ Why pricing is shown as a range:</p>
                <p className="text-muted-foreground">
                  Roofing costs vary based on deck condition, code upgrades, and material availability. 
                  Your final price is locked in after inspection — no surprise add-ons.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleEmailEstimate} disabled={sending} className="gap-2">
              <Mail className="h-4 w-4" />
              {sending ? "Sending..." : "Email Me"}
            </Button>
            <Button variant="outline" onClick={handleSignAndApprove} className="gap-2">
              <FileSignature className="h-4 w-4" />
              Sign & Approve
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="ml-auto">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Modal */}
      <EstimateApprovalModal
        open={showSignatureModal}
        onOpenChange={setShowSignatureModal}
        estimateData={{
          ...estimateData,
          selectedPackage,
          estimateLow: currentEstimate.low,
          estimateHigh: currentEstimate.high,
          comparisonPackages
        }}
        onComplete={() => {
          setShowSignatureModal(false);
          onComplete?.();
          onOpenChange(false);
        }}
      />
    </>
  );
};
