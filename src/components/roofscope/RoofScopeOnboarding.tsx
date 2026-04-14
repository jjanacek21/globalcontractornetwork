import { useState } from "react";
import { useRSCompany } from "@/hooks/useRoofScope";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Building2, Palette, DollarSign, CheckCircle2 } from "lucide-react";

const STEPS = ["Company Info", "Branding", "Default Pricing", "Ready!"];

export function RoofScopeOnboarding() {
  const { company, createCompany, updateCompany } = useRSCompany();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address_line1: "", city: "", state: "", zip: "",
    license_number: "", primary_color: "#58A6FF", secondary_color: "#F0883E", tagline: "",
    default_labor_rate: "", default_markup_percent: "0", default_waste_factor: "10",
    preferred_units: "squares",
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleNext = async () => {
    if (step === 0) {
      setSaving(true);
      if (!company) {
        await createCompany({ name: form.name, phone: form.phone, email: form.email, address_line1: form.address_line1, city: form.city, state: form.state, zip: form.zip, license_number: form.license_number } as any);
      } else {
        await updateCompany({ name: form.name, phone: form.phone, email: form.email, address_line1: form.address_line1, city: form.city, state: form.state, zip: form.zip, license_number: form.license_number } as any);
      }
      setSaving(false);
    }
    if (step === 1 && company) {
      setSaving(true);
      await updateCompany({ primary_color: form.primary_color, secondary_color: form.secondary_color, tagline: form.tagline } as any);
      setSaving(false);
    }
    if (step === 2 && company) {
      setSaving(true);
      await updateCompany({
        default_labor_rate: form.default_labor_rate ? parseFloat(form.default_labor_rate) : null,
        default_markup_percent: parseFloat(form.default_markup_percent) || 0,
        default_waste_factor: parseFloat(form.default_waste_factor) || 10,
        preferred_units: form.preferred_units,
      } as any);
      setSaving(false);
    }
    if (step === 3 && company) {
      setSaving(true);
      await updateCompany({ onboarding_completed: true } as any);
      setSaving(false);
      window.location.reload();
      return;
    }
    setStep(s => Math.min(s + 1, 3));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to RoofScope</h1>
        <p className="text-muted-foreground">Let's set up your company profile in a few quick steps</p>
      </div>

      <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />

      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        {STEPS.map((s, i) => (
          <span key={s} className={i <= step ? "text-primary font-medium" : ""}>{s}</span>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 0 && <><Building2 className="w-5 h-5" /> Company Information</>}
            {step === 1 && <><Palette className="w-5 h-5" /> Branding</>}
            {step === 2 && <><DollarSign className="w-5 h-5" /> Default Pricing</>}
            {step === 3 && <><CheckCircle2 className="w-5 h-5 text-green-500" /> You're All Set!</>}
          </CardTitle>
          <CardDescription>
            {step === 0 && "Tell us about your company"}
            {step === 1 && "Customize your brand colors for estimates"}
            {step === 2 && "Set your default pricing (can be changed later)"}
            {step === 3 && "Your account is ready to go!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div><Label>Company Name *</Label><Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="ABC Roofing LLC" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(555) 123-4567" /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={e => update("email", e.target.value)} placeholder="info@abcroofing.com" /></div>
              </div>
              <div><Label>Address</Label><Input value={form.address_line1} onChange={e => update("address_line1", e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>City</Label><Input value={form.city} onChange={e => update("city", e.target.value)} /></div>
                <div><Label>State</Label><Input value={form.state} onChange={e => update("state", e.target.value)} /></div>
                <div><Label>Zip</Label><Input value={form.zip} onChange={e => update("zip", e.target.value)} /></div>
              </div>
              <div><Label>License Number</Label><Input value={form.license_number} onChange={e => update("license_number", e.target.value)} placeholder="Optional" /></div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Brand Color</Label>
                  <div className="flex gap-2 items-center mt-1">
                    <input type="color" value={form.primary_color} onChange={e => update("primary_color", e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <Input value={form.primary_color} onChange={e => update("primary_color", e.target.value)} className="font-mono" />
                  </div>
                </div>
                <div>
                  <Label>Secondary Brand Color</Label>
                  <div className="flex gap-2 items-center mt-1">
                    <input type="color" value={form.secondary_color} onChange={e => update("secondary_color", e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <Input value={form.secondary_color} onChange={e => update("secondary_color", e.target.value)} className="font-mono" />
                  </div>
                </div>
              </div>
              <div><Label>Tagline</Label><Input value={form.tagline} onChange={e => update("tagline", e.target.value)} placeholder="Your trusted roofing partner" /></div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Default Labor Rate ($/hr)</Label><Input type="number" value={form.default_labor_rate} onChange={e => update("default_labor_rate", e.target.value)} placeholder="45.00" /></div>
                <div><Label>Default Markup %</Label><Input type="number" value={form.default_markup_percent} onChange={e => update("default_markup_percent", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Default Waste Factor %</Label><Input type="number" value={form.default_waste_factor} onChange={e => update("default_waste_factor", e.target.value)} /></div>
                <div>
                  <Label>Preferred Units</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.preferred_units} onChange={e => update("preferred_units", e.target.value)}>
                    <option value="squares">Squares</option>
                    <option value="sf">Square Feet</option>
                  </select>
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <p className="text-lg font-medium">Your RoofScope account is ready!</p>
              <p className="text-muted-foreground">Start creating professional estimates with AI-powered analysis.</p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 0 ? <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Back</Button> : <div />}
            <Button onClick={handleNext} disabled={saving || (step === 0 && !form.name)}>
              {saving ? "Saving..." : step === 3 ? "Go to Dashboard" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
