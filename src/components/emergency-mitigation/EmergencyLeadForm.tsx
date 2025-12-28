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
import { Phone, Mail, MapPin, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const EmergencyLeadForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send Telegram notification for emergency leads (high priority)
      await supabase.functions.invoke('telegram-lead-alert', {
        body: {
          source: '🚨 Emergency Mitigation',
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          service: formData.service,
          urgency: 'immediate',
          notes: formData.message
        }
      });

      // Send confirmation email to customer
      if (formData.email) {
        supabase.functions.invoke('send-lead-confirmation', {
          body: {
            email: formData.email,
            name: formData.name,
            source: 'Emergency Mitigation',
            phone: formData.phone,
            service: formData.service,
            message: formData.message
          }
        }).catch(err => console.error('Email confirmation failed:', err));
      }

      setIsSubmitted(true);
      toast({
        title: "Request Submitted!",
        description: "We'll contact you within 15 minutes.",
      });
    } catch (error) {
      console.error('Error submitting emergency lead:', error);
      // Still show success to user even if notification fails
      setIsSubmitted(true);
      toast({
        title: "Request Submitted!",
        description: "We'll contact you within 15 minutes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="contact" className="py-20 bg-white">
        <div className="container max-w-2xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Thank You!
          </h2>
          <p className="text-lg text-slate-600 mb-6">
            Your request has been received. One of our emergency response specialists 
            will contact you within 15 minutes.
          </p>
          <p className="text-slate-600 mb-8">
            For immediate assistance, call us directly:
          </p>
          <a
            href="tel:2149982879"
            className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            <Phone className="h-5 w-5" />
            (214) 998-2879
          </a>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Contact Info */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Get Help Now
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Available 24/7 for emergency response. Fill out the form or contact us directly. 
              We'll be there when you need us most.
            </p>

            <div className="space-y-6">
              <a
                href="tel:2149982879"
                className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
              >
                <div className="bg-red-600 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-600 font-medium">24/7 Emergency Line</p>
                  <p className="text-xl font-bold text-slate-900">(214) 998-2879</p>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="bg-slate-600 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Email Us</p>
                  <a href="mailto:jared@globalcontractor.network" className="text-lg font-bold text-slate-900 hover:text-red-600 transition-colors">
                    jared@globalcontractor.network
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="bg-slate-600 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Service Area</p>
                  <p className="text-lg font-bold text-slate-900">Boca Raton, FL 33432</p>
                  <p className="text-sm text-slate-600">Miami-Dade, Broward, Palm Beach Counties</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Tip:</strong> For fastest response to active emergencies (flooding, 
                roof damage during storms), call us directly. We prioritize phone calls 
                for immediate dispatch.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              Request Free Consultation
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Your Name *"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-white"
                />
              </div>
              
              <div>
                <Input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  className="bg-white"
                />
              </div>
              
              <div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white"
                />
              </div>
              
              <div>
                <Select
                  value={formData.service}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Service Needed *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mold">Mold Remediation</SelectItem>
                    <SelectItem value="testing">Air Quality / Mold Testing</SelectItem>
                    <SelectItem value="water">Water Damage Mitigation</SelectItem>
                    <SelectItem value="storm">Storm Damage Cleanup</SelectItem>
                    <SelectItem value="roof">Roof Tarping / Leak Repair</SelectItem>
                    <SelectItem value="other">Other / Not Sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Textarea
                  placeholder="Briefly describe your situation (optional)"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="bg-white min-h-[100px]"
                />
              </div>
              
              <Button
                type="submit"
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Get Help Now
                  </>
                )}
              </Button>
              
              <p className="text-xs text-slate-500 text-center">
                We'll respond within 15 minutes during business hours. 
                Emergency calls answered 24/7.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
