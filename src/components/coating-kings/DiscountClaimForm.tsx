import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Gift, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiscountClaimFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (leadData: any) => void;
  discountPercent: number;
  estimateLow: number;
  estimateHigh: number;
  sqft: number;
  coatingType: string;
  propertyAddress: string;
}

const ROOF_TYPES = [
  { value: "flat-built-up", label: "Flat - Built-Up" },
  { value: "flat-modified-bitumen", label: "Flat - Modified Bitumen" },
  { value: "flat-tpo-pvc", label: "Flat - TPO/PVC" },
  { value: "metal-standing-seam", label: "Metal - Standing Seam" },
  { value: "metal-corrugated", label: "Metal - Corrugated" },
  { value: "metal-ribbed", label: "Metal - Ribbed Panel" },
  { value: "tile-concrete", label: "Tile - Concrete" },
  { value: "tile-clay", label: "Tile - Clay" },
  { value: "shingle-asphalt", label: "Shingle - Asphalt" },
];

const ROOF_AGES = [
  { value: "0-5", label: "0-5 years" },
  { value: "5-10", label: "5-10 years" },
  { value: "10-15", label: "10-15 years" },
  { value: "15-20", label: "15-20 years" },
  { value: "20+", label: "20+ years" },
];

const ROOF_CONDITIONS = [
  { value: "excellent", label: "Excellent - No issues" },
  { value: "good", label: "Good - Minor wear" },
  { value: "fair", label: "Fair - Some repairs needed" },
  { value: "poor", label: "Poor - Significant issues" },
  { value: "leaking", label: "Leaking - Active leaks" },
];

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

export const DiscountClaimForm = ({
  open,
  onClose,
  onSuccess,
  discountPercent,
  estimateLow,
  estimateHigh,
  sqft,
  coatingType,
  propertyAddress,
}: DiscountClaimFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: propertyAddress || "",
    roofType: "",
    roofAge: "",
    roofCondition: "",
    notes: "",
  });
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>();
  const [appointmentTime, setAppointmentTime] = useState("");

  const discountedLow = Math.round(estimateLow * (1 - discountPercent / 100));
  const discountedHigh = Math.round(estimateHigh * (1 - discountPercent / 100));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentDate || !appointmentTime) {
      toast({
        title: "Please select appointment",
        description: "Choose a date and time for your site visit",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const leadData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        property_address: formData.address,
        roof_type: formData.roofType,
        coating_type: coatingType,
        estimated_sqft: sqft,
        estimate_low: estimateLow,
        estimate_high: estimateHigh,
        discount_percent: discountPercent,
        discounted_price: discountedLow,
        roof_age: formData.roofAge,
        roof_condition: formData.roofCondition,
        notes: formData.notes,
        appointment_date: format(appointmentDate, "yyyy-MM-dd"),
        appointment_time: appointmentTime,
        status: "new",
      };

      const { data, error } = await supabase
        .from("coating_leads")
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Discount Claimed!",
        description: `Your ${discountPercent}% discount has been reserved. We'll see you soon!`,
      });

      onSuccess({ ...leadData, id: data.id });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Claim Your {discountPercent}% Discount!
          </DialogTitle>
          <DialogDescription>
            Complete the form below to schedule your free site visit and lock in your discount.
          </DialogDescription>
        </DialogHeader>

        {/* Discount Summary Card */}
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Original Estimate</p>
                <p className="text-lg line-through text-muted-foreground">
                  ${estimateLow.toLocaleString()} - ${estimateHigh.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Discounted Price</p>
                <p className="text-xl font-bold text-primary">
                  ${discountedLow.toLocaleString()} - ${discountedHigh.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                You Save: {discountPercent}% OFF
              </span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Property Address *</Label>
            <Input
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, Miami, FL 33101"
            />
          </div>

          {/* Roof Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Roof Type *</Label>
              <Select
                value={formData.roofType}
                onValueChange={(value) => setFormData({ ...formData, roofType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ROOF_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Roof Age *</Label>
              <Select
                value={formData.roofAge}
                onValueChange={(value) => setFormData({ ...formData, roofAge: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  {ROOF_AGES.map((age) => (
                    <SelectItem key={age.value} value={age.value}>
                      {age.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Roof Condition *</Label>
              <Select
                value={formData.roofCondition}
                onValueChange={(value) => setFormData({ ...formData, roofCondition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {ROOF_CONDITIONS.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Appointment Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !appointmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {appointmentDate ? format(appointmentDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={appointmentDate}
                    onSelect={setAppointmentDate}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Preferred Time *</Label>
              <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any specific concerns or questions about your roof?"
              rows={3}
            />
          </div>

          <Button type="submit" size="lg" className="w-full text-lg py-6" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CalendarIcon className="mr-2 h-5 w-5" />
                Schedule Site Visit & Claim {discountPercent}% Discount
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
