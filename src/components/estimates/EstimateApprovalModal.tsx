import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Mail, CheckCircle, FileSignature } from "lucide-react";
import { SignatureCanvas, SignatureCanvasRef } from "./SignatureCanvas";
import { PackageConfig, formatPriceRange } from "@/lib/packagePricing";
import { 
  generateProfessionalEstimatePdf, 
  downloadProfessionalPdf,
  ProfessionalEstimatePdfData 
} from "@/lib/generateProfessionalEstimatePdf";
import { supabase } from "@/integrations/supabase/client";

interface EstimateApprovalModalProps {
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
    selectedPackage: PackageConfig;
    estimateLow: number;
    estimateHigh: number;
    comparisonPackages?: Array<{
      package: PackageConfig;
      estimateLow: number;
      estimateHigh: number;
      isRecommended?: boolean;
    }>;
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

export const EstimateApprovalModal = ({
  open,
  onOpenChange,
  estimateData,
  onComplete
}: EstimateApprovalModalProps) => {
  const signatureRef = useRef<SignatureCanvasRef>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [updatesAgreed, setUpdatesAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<{ blob: Blob; base64: string } | null>(null);

  const handleSignAndDownload = async () => {
    if (!hasSignature) {
      toast.error("Please sign the estimate first");
      return;
    }

    if (!termsAgreed) {
      toast.error("Please agree to the terms");
      return;
    }

    setSubmitting(true);

    try {
      const signatureData = signatureRef.current?.getSignature();
      const signedAt = new Date().toISOString();

      // Generate signed PDF
      const pdfData: ProfessionalEstimatePdfData = {
        ...estimateData,
        signatureData,
        signedAt: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      const pdf = generateProfessionalEstimatePdf(pdfData);
      setGeneratedPdf(pdf);

      // Download immediately
      downloadProfessionalPdf(pdf.blob, estimateData.customerName);

      // Send email with signed PDF
      await supabase.functions.invoke('send-lead-confirmation', {
        body: {
          email: estimateData.customerEmail,
          name: estimateData.customerName,
          source: 'Signed Roofing Estimate',
          phone: estimateData.customerPhone,
          address: estimateData.propertyAddress,
          roofType: estimateData.selectedPackage.category,
          recommendedPackage: estimateData.selectedPackage.name,
          estimateLow: estimateData.estimateLow,
          estimateHigh: estimateData.estimateHigh,
          appointmentDate: estimateData.appointmentDate,
          appointmentTime: estimateData.appointmentTime,
          appointmentType: estimateData.appointmentType,
          pdfBase64: pdf.base64,
          pdfFilename: `signed-estimate-${estimateData.customerName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          isSigned: true,
          signedAt
        }
      });

      toast.success("Estimate signed and downloaded! A copy has been emailed to you.");
      setCompleted(true);
      onComplete?.();
    } catch (error) {
      console.error("Error processing signature:", error);
      toast.error("Failed to process signature. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadAgain = () => {
    if (generatedPdf) {
      downloadProfessionalPdf(generatedPdf.blob, estimateData.customerName);
      toast.success("PDF downloaded again!");
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setCompleted(false);
      setHasSignature(false);
      setTermsAgreed(false);
      setGeneratedPdf(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {!completed ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-primary" />
                Sign Your Estimate
              </DialogTitle>
              <DialogDescription>
                Review and sign to receive your detailed PDF estimate
              </DialogDescription>
            </DialogHeader>

            {/* Estimate Summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-primary">{estimateData.selectedPackage.name}</p>
                  <p className="text-sm text-muted-foreground">{estimateData.propertyAddress}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatPriceRange(estimateData.estimateLow, estimateData.estimateHigh)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {estimateData.roofSquares.toFixed(1)} squares
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Canvas */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Signature *</Label>
              <SignatureCanvas
                ref={signatureRef}
                width={400}
                height={120}
                onChange={setHasSignature}
              />
            </div>

            {/* Terms */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAgreed}
                  onCheckedChange={(checked) => setTermsAgreed(checked === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                  I understand this is an estimate, not a binding contract. Final pricing will be confirmed after on-site inspection.
                </Label>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox
                  id="updates"
                  checked={updatesAgreed}
                  onCheckedChange={(checked) => setUpdatesAgreed(checked === true)}
                />
                <Label htmlFor="updates" className="text-sm leading-tight cursor-pointer">
                  I agree to receive updates via email and SMS regarding my estimate.
                </Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSignAndDownload}
                disabled={!hasSignature || !termsAgreed || submitting}
                className="flex-1 gap-2"
              >
                {submitting ? (
                  "Processing..."
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Sign & Download PDF
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold">Estimate Signed!</h3>
                <p className="text-muted-foreground mt-1">
                  Your signed estimate has been downloaded and emailed to {estimateData.customerEmail}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <p className="font-medium">{estimateData.selectedPackage.name}</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {formatPriceRange(estimateData.estimateLow, estimateData.estimateHigh)}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleDownloadAgain} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download Again
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                A copy has also been sent to your email with the PDF attached.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
