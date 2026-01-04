import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReferrals, CreateReferralData } from "@/hooks/useReferrals";
import { Loader2, Send, Users } from "lucide-react";

const SERVICE_TYPES = [
  "Roofing",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Windows & Doors",
  "Flooring",
  "Painting",
  "Landscaping",
  "Tree Service",
  "Mold Remediation",
  "Water Damage",
  "General Contracting",
  "Kitchen Remodel",
  "Bathroom Remodel",
  "Siding",
  "Gutters",
  "Fencing",
  "Concrete",
  "Pool Service",
  "Pest Control",
  "Other",
];

const SOURCE_CONTEXTS = [
  "Observed during my service work",
  "Customer asked about this service",
  "Preventative recommendation",
  "Emergency situation observed",
  "Referral from another customer",
  "Other",
];

interface SubmitReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractorId: string;
}

const SubmitReferralDialog = ({ open, onOpenChange, contractorId }: SubmitReferralDialogProps) => {
  const { createReferral } = useReferrals(contractorId);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateReferralData>({
    referred_customer_name: "",
    referred_customer_email: "",
    referred_customer_phone: "",
    referred_service_type: "",
    property_address: "",
    referral_source_context: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await createReferral(formData);

    if (success) {
      setFormData({
        referred_customer_name: "",
        referred_customer_email: "",
        referred_customer_phone: "",
        referred_service_type: "",
        property_address: "",
        referral_source_context: "",
        notes: "",
      });
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Submit a Referral</DialogTitle>
              <DialogDescription>
                Refer work outside your trade and earn when the job is completed
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={formData.referred_customer_name}
                onChange={(e) => setFormData({ ...formData, referred_customer_name: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.referred_customer_email}
                onChange={(e) => setFormData({ ...formData, referred_customer_email: e.target.value })}
                placeholder="john@email.com"
              />
            </div>

            <div>
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={formData.referred_customer_phone}
                onChange={(e) => setFormData({ ...formData, referred_customer_phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="service_type">Service Needed *</Label>
            <Select
              value={formData.referred_service_type}
              onValueChange={(value) => setFormData({ ...formData, referred_service_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="property_address">Property Address *</Label>
            <Input
              id="property_address"
              value={formData.property_address}
              onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
              placeholder="123 Main St, City, State 12345"
              required
            />
          </div>

          <div>
            <Label htmlFor="source_context">How did you identify this opportunity?</Label>
            <Select
              value={formData.referral_source_context}
              onValueChange={(value) => setFormData({ ...formData, referral_source_context: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select context (optional)" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_CONTEXTS.map((context) => (
                  <SelectItem key={context} value={context}>
                    {context}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional context about the referral..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Referral
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitReferralDialog;
