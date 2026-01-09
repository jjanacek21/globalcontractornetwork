import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Video, Users, FileText, Download, FileSignature } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { resolveUserForSubmission } from "@/lib/userLinking";
import { generateRoofEstimatePdf, downloadPdf } from "@/lib/generateRoofEstimatePdf";
import { 
  generateProfessionalEstimatePdf, 
  downloadProfessionalPdf,
  ProfessionalEstimatePdfData 
} from "@/lib/generateProfessionalEstimatePdf";
import { getPackageByName, PackageConfig, calculateEstimate } from "@/lib/packagePricing";
import { SelectedFinancing } from "./InlineFinancingSelector";
import { EstimateApprovalModal } from "@/components/estimates/EstimateApprovalModal";

interface MeasurementData {
  baseSqft: number;
  pitchMultiplier: number;
  trueSqft: number;
  wastePct: number;
  totalWithWaste: number;
  roofSquares: number;
  roofComplexity: string;
}

interface PackageData {
  name: string;
  features: string[];
  pricePerSquare: string;
  estimateLow: number;
  estimateHigh: number;
}

interface QuizData {
  quizResponseId: string | null;
  recommendations: Array<{
    tier: string;
    name: string;
    estimateLow: number;
    estimateHigh: number;
    reason: string;
    features: string[];
  }>;
  address: string;
  cityState: string;
  roofSquares: number;
}

interface SchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentType: "zoom" | "in_person";
  consultationData: {
    roofType: string;
    priority: string;
    timeline: string;
    budget: string;
    zipCode: string;
    sqft: number;
    recommendedPackage: string;
    estimatedPrice: number;
  };
  measurementData?: MeasurementData;
  packageData?: PackageData;
  financingData?: SelectedFinancing | null;
  quizData?: QuizData;
  onComplete: () => void;
}

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
];

export const SchedulingDialog = ({
  open,
  onOpenChange,
  appointmentType,
  consultationData,
  measurementData,
  packageData,
  financingData,
  quizData,
  onComplete
}: SchedulingDialogProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });

  // Try to get PackageConfig from centralized pricing
  const packageConfig = packageData ? getPackageByName(packageData.name) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Please select a date and time");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { userId, emailNormalized } = await resolveUserForSubmission(
        supabase,
        session?.user?.id || null,
        formData.email
      );

      // Generate PDF if we have measurement and package data
      let pdfBase64: string | null = null;
      if (measurementData && packageData) {
        // Try to use the new professional PDF generator if we have a PackageConfig
        if (packageConfig) {
          const pdfData: ProfessionalEstimatePdfData = {
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            propertyAddress: consultationData.zipCode,
            roofSquares: measurementData.roofSquares,
            pitch: measurementData.roofComplexity,
            complexity: measurementData.roofComplexity,
            selectedPackage: packageConfig,
            estimateLow: packageData.estimateLow,
            estimateHigh: packageData.estimateHigh,
            financing: financingData ? {
              lenderName: financingData.lenderName,
              rate: financingData.rate,
              termYears: financingData.termYears,
              monthlyPayment: financingData.monthlyPayment,
              totalCost: financingData.totalCost
            } : null,
            appointmentDate: format(date, "PPP"),
            appointmentTime: time,
            appointmentType: appointmentType
          };

          const { blob, base64 } = generateProfessionalEstimatePdf(pdfData);
          pdfBase64 = base64;
          downloadProfessionalPdf(blob, formData.name);
        } else {
          // Fallback to legacy PDF generator
          const pdfData = {
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            propertyAddress: consultationData.zipCode,
            baseSqft: measurementData.baseSqft,
            pitchMultiplier: measurementData.pitchMultiplier,
            trueSqft: measurementData.trueSqft,
            wastePct: measurementData.wastePct,
            totalWithWaste: measurementData.totalWithWaste,
            roofSquares: measurementData.roofSquares,
            roofComplexity: measurementData.roofComplexity,
            packageName: packageData.name,
            packageFeatures: packageData.features,
            pricePerSquare: packageData.pricePerSquare,
            estimateLow: packageData.estimateLow,
            estimateHigh: packageData.estimateHigh,
            financing: financingData ? {
              lenderName: financingData.lenderName,
              rate: financingData.rate,
              termYears: financingData.termYears,
              monthlyPayment: financingData.monthlyPayment,
              totalCost: financingData.totalCost
            } : null,
            appointmentDate: format(date, "PPP"),
            appointmentTime: time,
            appointmentType: appointmentType
          };

          const { blob, base64 } = generateRoofEstimatePdf(pdfData);
          pdfBase64 = base64;
          downloadPdf(blob, `roof-estimate-${formData.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
        }
      }

      const { error } = await supabase
        .from("roofing_consultations")
        .insert([{
          roof_type: consultationData.roofType,
          priority: consultationData.priority,
          timeline: consultationData.timeline,
          budget: consultationData.budget,
          zip_code: consultationData.zipCode,
          sqft: consultationData.sqft,
          recommended_package: consultationData.recommendedPackage,
          estimated_price: consultationData.estimatedPrice,
          appointment_type: appointmentType,
          appointment_date: format(date, "yyyy-MM-dd"),
          appointment_time: time,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          notes: formData.notes,
          status: "scheduled",
          user_id: userId,
          email_normalized: emailNormalized
        }]);

      if (error) throw error;

      // Send Telegram notification (fire and forget)
      supabase.functions.invoke('telegram-lead-alert', {
        body: {
          source: 'Roofing Consultations',
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: consultationData.zipCode,
          service: `${consultationData.roofType} - ${consultationData.recommendedPackage}`,
          urgency: consultationData.priority,
          estimateLow: packageData?.estimateLow || consultationData.estimatedPrice,
          estimateHigh: packageData?.estimateHigh || consultationData.estimatedPrice,
          appointmentDate: format(date, "yyyy-MM-dd"),
          appointmentTime: time,
          appointmentType: appointmentType,
          notes: `Timeline: ${consultationData.timeline}, Budget: ${consultationData.budget}, Sqft: ${consultationData.sqft}${formData.notes ? `, Customer Notes: ${formData.notes}` : ''}${financingData ? `, Financing: ${financingData.lenderName} ${financingData.rate}% for ${financingData.termYears}yr` : ''}`
        }
      }).catch(err => console.error('Telegram notification failed:', err));

      // Send confirmation email with PDF attachment
      supabase.functions.invoke('send-lead-confirmation', {
        body: {
          email: formData.email,
          name: formData.name,
          source: 'Roofing Consultations',
          phone: formData.phone,
          address: consultationData.zipCode,
          roofType: consultationData.roofType,
          recommendedPackage: consultationData.recommendedPackage,
          estimatedPrice: consultationData.estimatedPrice,
          estimateLow: packageData?.estimateLow,
          estimateHigh: packageData?.estimateHigh,
          appointmentDate: format(date, "PPP"),
          appointmentTime: time,
          appointmentType: appointmentType,
          timeline: consultationData.timeline,
          budget: consultationData.budget,
          sqft: consultationData.sqft,
          // PDF attachment data
          pdfBase64: pdfBase64,
          pdfFilename: `roof-estimate-${formData.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          // Financing data for email
          financing: financingData ? {
            lenderName: financingData.lenderName,
            rate: financingData.rate,
            termYears: financingData.termYears,
            monthlyPayment: financingData.monthlyPayment
          } : null,
          // Measurement data for email
          measurements: measurementData ? {
            baseSqft: measurementData.baseSqft,
            trueSqft: measurementData.trueSqft,
            roofSquares: measurementData.roofSquares,
            complexity: measurementData.roofComplexity
          } : null
        }
      }).catch(err => console.error('Email confirmation failed:', err));

      // Send quiz results email with all recommendations if quiz data exists
      if (quizData) {
        supabase.functions.invoke('send-quiz-results', {
          body: {
            email: formData.email,
            name: formData.name,
            address: quizData.address,
            cityState: quizData.cityState,
            roofSquares: quizData.roofSquares,
            recommendations: quizData.recommendations,
            pdfBase64: pdfBase64,
            pdfFilename: `roof-estimate-${formData.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
          }
        }).catch(err => console.error('Quiz results email failed:', err));

        // Update quiz response with selection and contact info
        if (quizData.quizResponseId) {
          (supabase
            .from("roofing_quiz_responses" as any)
            .update({
              selected_package: packageData?.name,
              selected_tier: consultationData.budget,
              selected_estimate_low: packageData?.estimateLow,
              selected_estimate_high: packageData?.estimateHigh,
              appointment_type: appointmentType,
              appointment_scheduled: true,
              customer_name: formData.name,
              customer_email: formData.email,
              customer_phone: formData.phone,
              email_normalized: formData.email.toLowerCase().trim()
            })
            .eq("id", quizData.quizResponseId) as any)
            .then(() => console.log("Quiz response updated"))
            .catch((err: any) => console.error("Failed to update quiz response:", err));
        }
      }

      toast.success("Appointment scheduled! Your estimate PDF has been downloaded and emailed to you.");
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      toast.error("Failed to schedule appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {appointmentType === "zoom" ? (
              <>
                <Video className="h-5 w-5 text-primary" />
                Schedule Zoom Consultation
              </>
            ) : (
              <>
                <Users className="h-5 w-5 text-primary" />
                Schedule In-Person Visit
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Book your {appointmentType === "zoom" ? "virtual" : "in-person"} consultation and receive your detailed estimate PDF
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              required
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              required
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements, current roof issues, accessibility notes, or questions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Select Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date < new Date() || date.getDay() === 0 || date.getDay() === 6
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Select Time *</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p><span className="font-medium">Package:</span> {consultationData.recommendedPackage}</p>
            {packageData ? (
              <p><span className="font-medium">Estimated:</span> ${packageData.estimateLow.toLocaleString()} - ${packageData.estimateHigh.toLocaleString()}</p>
            ) : (
              <p><span className="font-medium">Estimated:</span> ${consultationData.estimatedPrice.toLocaleString()}</p>
            )}
            {financingData && (
              <p><span className="font-medium">Financing:</span> ${Math.round(financingData.monthlyPayment).toLocaleString()}/mo @ {financingData.rate}%</p>
            )}
            <p><span className="font-medium">Address:</span> {consultationData.zipCode}</p>
          </div>

          {measurementData && packageData && (
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-primary">
                <FileText className="h-4 w-4" />
                <span className="font-medium">PDF Estimate Included</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your detailed itemized estimate will be downloaded automatically and emailed to you.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Scheduling..." : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Confirm & Get PDF
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Signature Modal for signing estimates */}
    {packageConfig && measurementData && (
      <EstimateApprovalModal
        open={showSignatureModal}
        onOpenChange={setShowSignatureModal}
        estimateData={{
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          propertyAddress: consultationData.zipCode,
          roofSquares: measurementData.roofSquares,
          pitch: measurementData.roofComplexity,
          complexity: measurementData.roofComplexity,
          selectedPackage: packageConfig,
          estimateLow: packageData?.estimateLow || 0,
          estimateHigh: packageData?.estimateHigh || 0,
          financing: financingData ? {
            lenderName: financingData.lenderName,
            rate: financingData.rate,
            termYears: financingData.termYears,
            monthlyPayment: financingData.monthlyPayment,
            totalCost: financingData.totalCost
          } : null,
          appointmentDate: date ? format(date, "PPP") : undefined,
          appointmentTime: time || undefined,
          appointmentType: appointmentType
        }}
        onComplete={() => {
          setShowSignatureModal(false);
          onComplete();
          onOpenChange(false);
        }}
      />
    )}
    </>
  );
};
