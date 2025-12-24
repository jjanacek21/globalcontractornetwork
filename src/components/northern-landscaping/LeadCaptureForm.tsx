import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Phone, Mail, MapPin } from "lucide-react";

const services = [
  "Lawn Maintenance",
  "Irrigation",
  "Landscape Lighting",
  "Tree Trimming & Arbor Care",
  "Tree Removal",
  "Storm Cleanup",
  "Land Grading",
  "Stump Grinding",
  "Artificial Turf",
  "Artificial Turf Cleaning",
  "Pest Control",
  "Tiki Huts & Pergolas",
  "Waterfalls",
  "Pressure Cleaning",
  "Pavers",
  "Fruit Tree Installation",
  "Fertilization Programs",
  "Other",
];

const LeadCaptureForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    propertyType: "",
    service: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("contact_requests").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: `Property: ${formData.propertyType}\nService: ${formData.service}\n\n${formData.message}`,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Request Submitted!",
        description: "We'll contact you within 24 hours.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section id="contact" className="py-20 bg-white">
        <div className="container max-w-2xl">
          <div className="text-center p-12 bg-green-50 rounded-2xl">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-green-900 mb-4">
              Thank You!
            </h3>
            <p className="text-muted-foreground mb-6">
              Your request has been received. A member of our team will contact
              you within 24 hours to discuss your project.
            </p>
            <p className="text-green-700 font-semibold">
              Need immediate assistance? Call (214) 998-2879
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">
                Contact Us
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-green-900 mt-2 mb-4">
                Ready to Transform Your Property?
              </h2>
              <p className="text-lg text-muted-foreground">
                Get a free consultation and custom quote for your landscaping
                project. No obligation, no pressure – just expert advice.
              </p>
            </div>

            <div className="space-y-6">
              <a
                href="tel:+12149982879"
                className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">(214) 998-2879</p>
                  <p className="text-sm text-muted-foreground">
                    Call or text anytime
                  </p>
                </div>
              </a>

              <a
                href="mailto:jared@globalcontractor.network"
                className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">
                    jared@globalcontractor.network
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Email for quotes
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Service Areas</p>
                  <p className="text-sm text-muted-foreground">
                    Miami-Dade, Broward, Palm Beach, Naples
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-green-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-green-900 mb-6">
              Request a Free Quote
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Input
                  placeholder="Your Name *"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="bg-white border-green-200"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  className="bg-white border-green-200"
                />
                <Input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="bg-white border-green-200"
                />
              </div>

              <Select
                value={formData.propertyType}
                onValueChange={(value) =>
                  setFormData({ ...formData, propertyType: value })
                }
              >
                <SelectTrigger className="bg-white border-green-200">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="hoa">HOA / Community</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={formData.service}
                onValueChange={(value) =>
                  setFormData({ ...formData, service: value })
                }
              >
                <SelectTrigger className="bg-white border-green-200">
                  <SelectValue placeholder="Service Needed" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service} value={service.toLowerCase()}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Tell us about your project (optional)"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={4}
                className="bg-white border-green-200"
              />

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-green-700 hover:bg-green-800 text-white"
              >
                {isSubmitting ? "Submitting..." : "Request Free Consultation"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By submitting, you agree to receive calls/texts about your
                project. We respect your privacy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadCaptureForm;
