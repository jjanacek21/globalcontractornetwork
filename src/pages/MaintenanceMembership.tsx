import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardCheck, ShieldCheck, Wrench, CalendarCheck, Sparkles, Phone, Home as HomeIcon, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MaintenanceMembership = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    property_address: "",
    plan_interest: "Annual Care Plan",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("maintenance_membership_waitlist").insert({
        ...form,
        user_id: user?.id ?? null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "You're on the waitlist!", description: "We'll email you the moment enrollment opens." });
    } catch (err: any) {
      toast({ title: "Could not join the waitlist", description: "Please try again in a moment.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    { icon: CalendarCheck, title: "Bi-Annual Property Inspections", desc: "Spring and fall walk-throughs by a verified GCN contractor — roof, gutters, exterior, HVAC visual check." },
    { icon: Wrench, title: "Preventative Maintenance", desc: "Gutter cleaning, dryer-vent clearing, AC filter swaps, caulk & seal touch-ups, hose-bib winterization." },
    { icon: ShieldCheck, title: "Storm Prep & Response", desc: "Pre-storm property prep checklist + 24-hour priority response for storm-related damage assessments." },
    { icon: Award, title: "Member-Only Pricing", desc: "10–20% off any service from network contractors. No call-out fees on inspection visits." },
    { icon: Sparkles, title: "Digital Property Record", desc: "Photo timeline, service history, warranty tracking, and a transferable Care Report when you sell." },
    { icon: Phone, title: "Concierge Line", desc: "One number to call for any home issue — we triage and dispatch the right pro." },
  ];

  const plans = [
    { name: "Essential", price: "$29/mo", features: ["1 annual inspection", "Storm prep checklist", "5% member discount", "Digital property record"] },
    { name: "Annual Care Plan", price: "$59/mo", popular: true, features: ["2 inspections per year", "Gutter cleaning included", "Filter & vent service", "10% member discount", "Priority storm response"] },
    { name: "Total Property Care", price: "$129/mo", features: ["Quarterly inspections", "All preventative services", "20% member discount", "Concierge line", "Annual deep-clean credit"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Maintenance Membership — Coming Soon | Global Contractor Network</title>
        <meta name="description" content="Preventative maintenance, storm prep, and concierge property care for property owners. Join the waitlist." />
      </Helmet>

      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/member/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span className="font-semibold">Maintenance Membership</span>
            <Badge variant="secondary" className="ml-2">Coming Soon · Property Owners Only</Badge>
          </div>
        </div>
      </header>

      <main className="container py-12 max-w-5xl space-y-16">
        {/* Hero */}
        <section className="text-center space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
            <Sparkles className="h-3 w-3 mr-1" /> Launching 2026
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Your home, taken care of —<br />
            <span className="text-primary">before things break.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A monthly membership that handles the maintenance most homeowners forget about. Verified GCN contractors, scheduled visits, member pricing, and one number to call when something goes wrong.
          </p>
        </section>

        {/* Benefits */}
        <section className="grid md:grid-cols-2 gap-4">
          {benefits.map((b) => (
            <Card key={b.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{b.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Plans */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Plans (preview)</h2>
            <p className="text-muted-foreground">Final pricing locks at launch — waitlist members get founding rates.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <Card key={p.name} className={p.popular ? "border-primary shadow-lg relative" : ""}>
                {p.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription className="text-2xl font-bold text-foreground">{p.price}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Waitlist */}
        <section>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Join the Waitlist</CardTitle>
              <CardDescription>Founding members lock in launch pricing for life.</CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8 space-y-2">
                  <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
                  <h3 className="text-xl font-semibold">You're on the list!</h3>
                  <p className="text-muted-foreground">We'll be in touch the moment enrollment opens.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="addr">Property Address</Label>
                      <Input id="addr" value={form.property_address} onChange={(e) => setForm({ ...form, property_address: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Anything we should know?</Label>
                    <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? "Joining…" : "Join the Waitlist"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <HomeIcon className="h-3 w-3" /> Available to property owners only.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default MaintenanceMembership;
