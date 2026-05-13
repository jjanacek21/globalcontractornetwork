import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Loader2, User, CheckCircle2 } from "lucide-react";

const PROFILE_TYPES = [
  { id: "building_consultant", label: "Building Consultant", desc: "Advisor / project consultant" },
  { id: "handyman", label: "Handyman", desc: "Small repair & maintenance work" },
  { id: "skilled_labor", label: "Skilled Labor", desc: "Trade specialist (carpenter, mason, etc.)" },
];

const CATEGORIES = [
  "general", "roofing", "electrical", "plumbing", "hvac", "landscaping",
  "windows", "handyman", "solar", "painting", "fencing", "flooring", "engineering",
];

export default function IndividualRegistration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    profileType: "handyman",
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    password: "",
    phone: "",
    category: "handyman",
    bio: "",
    serviceArea: "",
    licenseNumber: "",
    licenseState: "FL",
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      toast({ title: "Missing info", description: "Name, email, and password are required.", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Weak password", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const redirect = `${window.location.origin}/contractor/dashboard`;
      const { data: signUp, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: redirect,
          data: { first_name: form.firstName, last_name: form.lastName },
        },
      });
      if (authErr) throw authErr;
      const userId = signUp.user?.id;
      if (!userId) throw new Error("Signup failed.");

      const displayName = `${form.firstName} ${form.lastName}`.trim();
      const { error: profileErr } = await supabase.from("contractor_profiles").insert({
        user_id: userId,
        company_name: displayName,
        first_name: form.firstName,
        last_name: form.lastName,
        title: form.title || null,
        email: form.email,
        phone: form.phone || null,
        category: form.category,
        description: form.bio || null,
        bio_short: form.bio?.slice(0, 200) || null,
        service_area: form.serviceArea ? form.serviceArea.split(",").map(s => s.trim()).filter(Boolean) : null,
        license_number: form.licenseNumber || null,
        license_state: form.licenseNumber ? form.licenseState : null,
        contractor_type: form.profileType === "handyman" ? "handyman" : "subcontractor",
        profile_type: form.profileType,
        subscription_status: "pending",
        verification_status: "pending",
      });
      if (profileErr) throw profileErr;

      setDone(true);
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="container py-16 max-w-xl">
          <Card>
            <CardContent className="pt-8 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold">Application submitted</h1>
              <p className="text-muted-foreground">
                Check your email to confirm your account. Once an admin approves your profile,
                you'll appear in the directory and can complete your portfolio (photos, gallery,
                social links) from your dashboard.
              </p>
              <Button onClick={() => navigate("/network-login")} className="mt-2">Go to login</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="container py-10 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Individual Contractor Registration</CardTitle>
            <CardDescription>
              For handymen, building consultants, and skilled laborers. Companies should use the{" "}
              <a href="/register-company" className="text-primary hover:underline">company registration</a> instead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label>I am a…</Label>
                <RadioGroup value={form.profileType} onValueChange={(v) => update("profileType", v)} className="grid sm:grid-cols-3 gap-3">
                  {PROFILE_TYPES.map(t => (
                    <Label key={t.id} htmlFor={t.id}
                      className={`border rounded-lg p-3 cursor-pointer flex items-start gap-2 ${form.profileType === t.id ? "border-primary bg-primary/5" : ""}`}>
                      <RadioGroupItem value={t.id} id={t.id} className="mt-0.5" />
                      <div>
                        <div className="font-medium">{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => update("firstName", e.target.value)} required /></div>
                <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => update("lastName", e.target.value)} required /></div>
              </div>
              <div><Label>Title (e.g. "Master Carpenter")</Label><Input value={form.title} onChange={e => update("title", e.target.value)} /></div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => update("email", e.target.value)} required /></div>
                <div><Label>Password *</Label><Input type="password" value={form.password} onChange={e => update("password", e.target.value)} required /></div>
              </div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => update("phone", e.target.value)} /></div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Primary Trade</Label>
                  <Select value={form.category} onValueChange={(v) => update("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Service Area (comma-separated)</Label><Input value={form.serviceArea} onChange={e => update("serviceArea", e.target.value)} placeholder="Miami, Hialeah" /></div>
              </div>

              <div><Label>Short Bio</Label><Textarea rows={4} value={form.bio} onChange={e => update("bio", e.target.value)} placeholder="Tell homeowners about your experience and specialties." /></div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>License # (optional)</Label><Input value={form.licenseNumber} onChange={e => update("licenseNumber", e.target.value)} /></div>
                <div><Label>License State</Label><Input value={form.licenseState} onChange={e => update("licenseState", e.target.value)} /></div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit application
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Your profile will be reviewed by an admin. You can add a profile photo, portfolio gallery,
                and social links from your dashboard after approval.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
