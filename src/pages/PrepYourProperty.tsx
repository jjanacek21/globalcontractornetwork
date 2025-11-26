import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const certificationTiers = [
  { name: "Basic", price: 599, features: ["Visual inspection", "Basic documentation", "Safety checklist", "Email report"] },
  { name: "Pro", price: 999, features: ["Detailed inspection", "Professional photos", "Comprehensive report", "Priority support", "Insurance liaison"] },
  { name: "Enterprise", price: "Call", features: ["Custom inspection protocol", "Video documentation", "Dedicated account manager", "24/7 support", "Legal documentation support"] },
];

const maintenanceTiers = [
  { name: "Silver", price: 299, features: ["Quarterly inspection", "Basic repairs", "Email updates", "Standard response time"] },
  { name: "Gold", price: 999, features: ["Monthly inspection", "Priority repairs", "Preventive maintenance", "SMS + Email updates", "Fast response"] },
  { name: "Platinum", price: 5000, features: ["Bi-weekly inspection", "All repairs included", "Emergency service", "Real-time updates", "Same-day response"] },
  { name: "Diamond", price: 10000, features: ["Weekly inspection", "Premium materials", "24/7 emergency service", "Dedicated team", "Immediate response", "Concierge service"] },
  { name: "Enterprise", price: "Call", features: ["Custom frequency", "Multi-property support", "Custom service level", "Enterprise reporting", "Account management"] },
];

export default function PrepYourProperty() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", property_address: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRequestService = (tierName: string) => {
    setSelectedTier(tierName);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("service_requests").insert({
      ...formData,
      message: `${selectedTier} tier request: ${formData.message}`,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to submit request", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "We'll contact you within 24 hours!" });
      setDialogOpen(false);
      setFormData({ name: "", email: "", phone: "", property_address: "", message: "" });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center">Prep Your Property</h1>
          <p className="text-xl text-muted-foreground mb-12 text-center">
            Protect your investment with professional property preparation and maintenance
          </p>

          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-2">Pre-Storm Certification</h2>
            <p className="text-muted-foreground mb-8">Get your property certified before storm season hits</p>
            <div className="grid md:grid-cols-3 gap-6">
              {certificationTiers.map((tier) => (
                <Card key={tier.name} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription className="text-3xl font-bold text-foreground">
                      {typeof tier.price === "number" ? `$${tier.price}` : tier.price}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 mb-6 flex-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button onClick={() => handleRequestService(`Pre-Storm ${tier.name}`)} className="w-full">
                      Request Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-2">Maintenance Packages</h2>
            <p className="text-muted-foreground mb-8">Ongoing care to keep your property in top condition</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {maintenanceTiers.map((tier) => (
                <Card key={tier.name} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription className="text-2xl font-bold text-foreground">
                      {typeof tier.price === "number" ? `$${tier.price}/yr` : tier.price}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 mb-6 flex-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-xs">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button onClick={() => handleRequestService(`Maintenance ${tier.name}`)} className="w-full" size="sm">
                      Request Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Service: {selectedTier}</DialogTitle>
            <DialogDescription>Fill out the form and we'll contact you within 24 hours</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="property_address">Property Address</Label>
              <Input id="property_address" value={formData.property_address} onChange={(e) => setFormData({ ...formData, property_address: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="message">Additional Details</Label>
              <Textarea id="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
