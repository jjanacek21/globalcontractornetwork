import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Video, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  onComplete
}: SchedulingDialogProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Please select a date and time");
      return;
    }

    setSubmitting(true);

    try {
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
          status: "scheduled"
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
          estimateLow: consultationData.estimatedPrice,
          estimateHigh: consultationData.estimatedPrice,
          appointmentDate: format(date, "yyyy-MM-dd"),
          appointmentTime: time,
          appointmentType: appointmentType,
          notes: `Timeline: ${consultationData.timeline}, Budget: ${consultationData.budget}, Sqft: ${consultationData.sqft}`
        }
      }).catch(err => console.error('Telegram notification failed:', err));

      // Send confirmation email to customer
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
          appointmentDate: format(date, "PPP"),
          appointmentTime: time,
          appointmentType: appointmentType,
          timeline: consultationData.timeline,
          budget: consultationData.budget,
          sqft: consultationData.sqft
        }
      }).catch(err => console.error('Email confirmation failed:', err));

      toast.success("Appointment scheduled successfully! We'll send you a confirmation email.");
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
            Book your {appointmentType === "zoom" ? "virtual" : "in-person"} consultation with our roofing expert
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
            <p><span className="font-medium">Estimated:</span> ${consultationData.estimatedPrice.toLocaleString()}</p>
            <p><span className="font-medium">Zip Code:</span> {consultationData.zipCode}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Scheduling..." : "Confirm Appointment"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
