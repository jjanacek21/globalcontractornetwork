import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Phone, Mail, MapPin } from "lucide-react";
import { resolveUserForSubmission } from "@/lib/userLinking";
import { ReferralSourceSelect } from "@/components/forms/ReferralSourceSelect";

const serviceInterests = [
  "Google/YouTube Ads",
  "Facebook/Instagram Ads",
  "CRM Setup & Management",
  "Website Design",
  "SEO & Optimization",
  "Social Media Management",
  "Email & SMS Marketing",
  "Branding Package",
  "Local Essentials Package",
  "Digital Growth Package",
  "Complete Domination Package",
  "Custom Package",
];

const budgetRanges = [
  "Under $1,500/month",
  "$1,500 - $2,500/month",
  "$2,500 - $4,000/month",
  "$4,000 - $6,000/month",
  "$6,000+/month",
  "Not sure yet",
];

export function MarketingLeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralSource, setReferralSource] = useState("");
  const [referralContractorId, setReferralContractorId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    service_interest: "",
    budget_range: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { userId, emailNormalized } = await resolveUserForSubmission(
        supabase,
        session?.user?.id || null,
        formData.email
      );

      const { error } = await supabase
        .from('marketing_leads')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company_name: formData.company_name || null,
          service_interest: formData.service_interest || null,
          budget_range: formData.budget_range || null,
          message: formData.message || null,
          user_id: userId,
          email_normalized: emailNormalized,
          referral_source: referralSource || null,
          referral_contractor_id: referralContractorId || null,
        });

      if (error) throw error;

      // Send Telegram notification (fire and forget)
      supabase.functions.invoke('telegram-lead-alert', {
        body: {
          source: 'Digital Marketing',
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          service: formData.service_interest,
          notes: `Company: ${formData.company_name || 'N/A'}, Budget: ${formData.budget_range || 'N/A'}\n${formData.message || ''}`
        }
      }).catch(err => console.error('Telegram notification failed:', err));

      // Send confirmation email to customer
      supabase.functions.invoke('send-lead-confirmation', {
        body: {
          email: formData.email,
          name: formData.name,
          source: 'Digital Marketing',
          phone: formData.phone,
          companyName: formData.company_name,
          serviceInterest: formData.service_interest,
          budgetRange: formData.budget_range,
          message: formData.message
        }
      }).catch(err => console.error('Email confirmation failed:', err));

      // Notify contractor of new referral if applicable
      if (referralContractorId) {
        supabase.functions.invoke('notify-contractor-referral', {
          body: {
            contractorId: referralContractorId,
            leadName: formData.name,
            leadEmail: formData.email,
            leadPhone: formData.phone,
            serviceType: formData.service_interest || 'Marketing Consultation',
            propertyAddress: 'N/A',
            leadSource: 'Digital Marketing'
          }
        }).catch(err => console.error('Referral notification failed:', err));
      }

      toast.success("Thank you! We'll be in touch within 24 hours.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        company_name: "",
        service_interest: "",
        budget_range: "",
        message: "",
      });
      setReferralSource("");
      setReferralContractorId(null);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="lead-form" className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Info */}
          <div className="text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Get a free consultation with our marketing experts. We'll analyze your current 
              marketing and provide actionable recommendations.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Call Us</div>
                  <div className="text-lg font-semibold">(555) 123-4567</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Email Us</div>
                  <div className="text-lg font-semibold">hello@gcnmarketingpros.com</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Location</div>
                  <div className="text-lg font-semibold">Serving Contractors Nationwide</div>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-slate-300 italic">
                "Working with this team transformed our business. Our lead generation 
                increased 400% in the first 6 months!"
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div>
                  <div className="font-semibold text-white">John Davis</div>
                  <div className="text-sm text-slate-400">Davis Roofing Co.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <Card className="bg-white shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Get Your Free Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Your Company"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Interest</Label>
                    <Select
                      value={formData.service_interest}
                      onValueChange={(value) => setFormData({ ...formData, service_interest: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceInterests.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Budget</Label>
                    <Select
                      value={formData.budget_range}
                      onValueChange={(value) => setFormData({ ...formData, budget_range: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((budget) => (
                          <SelectItem key={budget} value={budget}>
                            {budget}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ReferralSourceSelect
                  referralSource={referralSource}
                  referralContractorId={referralContractorId}
                  onReferralSourceChange={setReferralSource}
                  onContractorChange={setReferralContractorId}
                />

                <div className="space-y-2">
                  <Label htmlFor="message">Tell us about your goals</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="What are you looking to achieve with digital marketing?"
                    rows={4}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-6 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Get Free Consultation
                    </>
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  By submitting, you agree to receive marketing communications. 
                  We respect your privacy and never share your information.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
