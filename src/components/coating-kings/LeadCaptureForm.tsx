import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, CheckCircle2 } from "lucide-react";

interface LeadCaptureFormProps {
  prefilledData?: {
    estimatedSqft?: number;
    roofType?: string;
    coatingType?: string;
    estimateLow?: number;
    estimateHigh?: number;
    propertyAddress?: string;
  };
}

export const LeadCaptureForm = ({ prefilledData }: LeadCaptureFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyAddress: prefilledData?.propertyAddress || "",
    roofType: prefilledData?.roofType || "",
    coatingType: prefilledData?.coatingType || "",
    estimatedSqft: prefilledData?.estimatedSqft || 0,
    estimateLow: prefilledData?.estimateLow || 0,
    estimateHigh: prefilledData?.estimateHigh || 0,
    propertyType: "",
    urgency: "",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("coating_leads")
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          property_address: formData.propertyAddress,
          roof_type: formData.roofType,
          coating_type: formData.coatingType,
          estimated_sqft: formData.estimatedSqft,
          estimate_low: formData.estimateLow,
          estimate_high: formData.estimateHigh,
          property_type: formData.propertyType,
          urgency: formData.urgency,
          notes: formData.notes
        });

      if (error) throw error;

      // Send Telegram notification (fire and forget)
      supabase.functions.invoke('telegram-lead-alert', {
        body: {
          source: 'Coating Kings',
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.propertyAddress,
          service: `${formData.coatingType} - ${formData.roofType}`,
          urgency: formData.urgency,
          estimateLow: formData.estimateLow,
          estimateHigh: formData.estimateHigh,
          notes: formData.notes
        }
      }).catch(err => console.error('Telegram notification failed:', err));

      // Send confirmation email to customer
      supabase.functions.invoke('send-lead-confirmation', {
        body: {
          email: formData.email,
          name: formData.name,
          source: 'Coating Kings',
          phone: formData.phone,
          address: formData.propertyAddress,
          propertyType: formData.propertyType,
          roofType: formData.roofType,
          coatingType: formData.coatingType,
          estimatedSqft: formData.estimatedSqft,
          urgency: formData.urgency,
          estimateLow: formData.estimateLow,
          estimateHigh: formData.estimateHigh,
          notes: formData.notes
        }
      }).catch(err => console.error('Email confirmation failed:', err));

      setIsSuccess(true);
      toast({
        title: "Request Submitted!",
        description: "We'll contact you within 24 hours with your detailed quote.",
      });

      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          propertyAddress: "",
          roofType: "",
          coatingType: "",
          estimatedSqft: 0,
          estimateLow: 0,
          estimateHigh: 0,
          propertyType: "",
          urgency: "",
          notes: ""
        });
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section id="contact" className="py-20 bg-background">
        <div className="container px-4 mx-auto">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="pt-12 pb-12">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
              <h3 className="text-3xl font-bold mb-4">Thank You!</h3>
              <p className="text-lg text-muted-foreground">
                Your request has been submitted successfully. Our team will contact you within 24 hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get Your <span className="text-primary">Free Consultation</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fill out the form below and we'll provide a detailed quote and consultation
          </p>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Request a Quote</CardTitle>
            <CardDescription>
              All fields are required unless marked as optional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Property Address</Label>
                  <Input
                    id="propertyAddress"
                    required
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                  />
                </div>
              </div>

              {/* Property Details */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Roof Type</Label>
                  <Select
                    required
                    value={formData.roofType}
                    onValueChange={(value) => setFormData({ ...formData, roofType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select roof type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Roof</SelectItem>
                      <SelectItem value="metal">Metal Roof</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Coating Type</Label>
                  <Select
                    required
                    value={formData.coatingType}
                    onValueChange={(value) => setFormData({ ...formData, coatingType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select coating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acrylic">Acrylic</SelectItem>
                      <SelectItem value="acrylic-base">Acrylic + Base</SelectItem>
                      <SelectItem value="elastomeric">Elastomeric</SelectItem>
                      <SelectItem value="silicone">Silicone</SelectItem>
                      <SelectItem value="silicone-base">Silicone + Base</SelectItem>
                      <SelectItem value="polyurethane">Polyurethane</SelectItem>
                      <SelectItem value="rubber">Rubber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sqft">Estimated Square Footage</Label>
                  <Input
                    id="sqft"
                    type="number"
                    value={formData.estimatedSqft || ""}
                    onChange={(e) => setFormData({ ...formData, estimatedSqft: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Project Urgency</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (Within 2 weeks)</SelectItem>
                      <SelectItem value="soon">Soon (1-2 months)</SelectItem>
                      <SelectItem value="planning">Planning (3+ months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Tell us about any specific concerns or requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Request Free Consultation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};