import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Phone, Mail, User, Home as HomeIcon, Wrench, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete } from "@/components/homeowner/AddressAutocomplete";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SERVICES = [
  "Roofing", "Windows & Doors", "Paint", "Siding",
  "Gutters", "Stucco", "Bathroom", "Kitchen",
  "Emergency / Mitigation", "Other",
];

const TIMELINES = ["ASAP", "Within 30 days", "1–3 months", "Just exploring"] as const;
const CALL_TIMES = ["Morning", "Afternoon", "Evening", "Anytime"] as const;
const PAYMENT_METHODS = [
  { id: "cash", label: "Cash / Check", desc: "Paying out of pocket" },
  { id: "financing", label: "Financing", desc: "Monthly payment plan" },
  { id: "insurance", label: "Insurance Claim", desc: "Filing with carrier" },
] as const;

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().min(7, "Enter a valid phone").max(30),
  email: z.string().trim().email("Enter a valid email").max(255),
  best_time_to_call: z.enum(CALL_TIMES).optional(),
  property_address: z.string().trim().min(5, "Enter the property address").max(300),
  property_type: z.enum(["residential", "commercial"]),
  is_primary_residence: z.boolean().optional(),
  services: z.array(z.string()).min(1, "Pick at least one service"),
  project_description: z.string().trim().max(2000).optional(),
  timeline: z.enum(TIMELINES),
  payment_method: z.enum(["cash", "financing", "insurance"]),
  insurance_carrier: z.string().trim().max(120).optional(),
  insurance_claim_number: z.string().trim().max(60).optional(),
  financing_interest: z.boolean().optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Please agree to be contacted" }) }),
});

type FormValues = z.infer<typeof schema>;

export default function ScheduleConsultation() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "", phone: "", email: "",
      property_address: "", property_type: "residential",
      services: [], timeline: "ASAP", payment_method: "cash",
      consent: undefined as any,
    },
  });
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;

  const services = watch("services") || [];
  const paymentMethod = watch("payment_method");
  const propertyType = watch("property_type");
  const timeline = watch("timeline");
  const callTime = watch("best_time_to_call");
  const consent = watch("consent");
  const address = watch("property_address");

  const toggleService = (s: string) => {
    const next = services.includes(s) ? services.filter(x => x !== s) : [...services, s];
    setValue("services", next, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      full_name: values.full_name,
      phone: values.phone,
      email: values.email.toLowerCase(),
      best_time_to_call: values.best_time_to_call ?? null,
      property_address: values.property_address,
      property_lat: coords?.lat ?? null,
      property_lng: coords?.lng ?? null,
      property_type: values.property_type,
      is_primary_residence: values.is_primary_residence ?? null,
      services: values.services,
      project_description: values.project_description ?? null,
      timeline: values.timeline,
      payment_method: values.payment_method,
      insurance_carrier: values.payment_method === "insurance" ? (values.insurance_carrier ?? null) : null,
      insurance_claim_number: values.payment_method === "insurance" ? (values.insurance_claim_number ?? null) : null,
      financing_interest: values.payment_method === "financing" ? !!values.financing_interest : null,
    };

    const { error } = await supabase.from("consultation_leads").insert(payload);
    if (error) {
      console.error("consultation_leads insert failed", error);
      toast.error("Could not submit. Please try again.");
      return;
    }

    // Soft-fail Telegram (lead is already saved)
    const notes = [
      values.project_description && `Project: ${values.project_description}`,
      `Payment: ${values.payment_method.toUpperCase()}`,
      values.payment_method === "insurance" && values.insurance_carrier && `Carrier: ${values.insurance_carrier}`,
      values.payment_method === "insurance" && values.insurance_claim_number && `Claim #: ${values.insurance_claim_number}`,
      values.payment_method === "financing" && values.financing_interest && `Wants financing options`,
      values.best_time_to_call && `Best time: ${values.best_time_to_call}`,
      `Property: ${values.property_type}`,
    ].filter(Boolean).join("\n");

    try {
      await supabase.functions.invoke("telegram-lead-alert", {
        body: {
          source: "Schedule Consultation",
          name: values.full_name,
          phone: values.phone,
          email: values.email,
          address: values.property_address,
          service: values.services.join(", "),
          urgency: values.timeline,
          notes,
        },
      });
    } catch (e) {
      console.warn("telegram-lead-alert failed (lead still saved)", e);
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-emerald-50 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="max-w-lg p-10 text-center border-emerald-200 shadow-xl">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold mb-3">You're all set!</h1>
            <p className="text-muted-foreground mb-8">
              A consultant will reach out within 1 business day. We'll text and email you to confirm a time.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Back to Home
              </Button>
              <Button variant="outline" onClick={() => { setSubmitted(false); form.reset(); }}>
                Submit Another
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-emerald-50/50 pb-20">
      <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <h1 className="font-semibold">Schedule a Free Consultation</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Tell us about your project</h2>
            <p className="text-muted-foreground">A consultant will call to walk you through next steps. No commitment.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Owner info */}
            <Card className="p-6 border-emerald-100">
              <SectionHeader icon={<User className="h-5 w-5" />} title="Your info" />
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Field label="Full name" error={errors.full_name?.message}>
                  <Input {...register("full_name")} placeholder="Jane Smith" />
                </Field>
                <Field label="Phone" error={errors.phone?.message}>
                  <Input {...register("phone")} placeholder="(555) 123-4567" type="tel" />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <Input {...register("email")} placeholder="you@example.com" type="email" />
                </Field>
                <Field label="Best time to call" optional>
                  <ChipRow
                    options={CALL_TIMES as readonly string[]}
                    value={callTime}
                    onChange={(v) => setValue("best_time_to_call", v as any, { shouldValidate: true })}
                  />
                </Field>
              </div>
            </Card>

            {/* Property */}
            <Card className="p-6 border-emerald-100">
              <SectionHeader icon={<HomeIcon className="h-5 w-5" />} title="Property" />
              <div className="space-y-4 mt-4">
                <Field label="Property address" error={errors.property_address?.message}>
                  <AddressAutocomplete
                    value={address}
                    onChange={(a) => setValue("property_address", a, { shouldValidate: true })}
                    onSelect={(a, c) => {
                      setValue("property_address", a, { shouldValidate: true });
                      setCoords({ lat: c.lat, lng: c.lng });
                    }}
                  />
                </Field>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Property type">
                    <ChipRow
                      options={["residential", "commercial"]}
                      value={propertyType}
                      labelMap={{ residential: "Residential", commercial: "Commercial" }}
                      onChange={(v) => setValue("property_type", v as any, { shouldValidate: true })}
                    />
                  </Field>
                  <Field label="Is this your primary residence?" optional>
                    <ChipRow
                      options={["yes", "no"]}
                      value={watch("is_primary_residence") === true ? "yes" : watch("is_primary_residence") === false ? "no" : undefined}
                      labelMap={{ yes: "Yes", no: "No" }}
                      onChange={(v) => setValue("is_primary_residence", v === "yes", { shouldValidate: true })}
                    />
                  </Field>
                </div>
              </div>
            </Card>

            {/* Project */}
            <Card className="p-6 border-emerald-100">
              <SectionHeader icon={<Wrench className="h-5 w-5" />} title="Project details" />
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-medium">Services needed</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SERVICES.map((s) => {
                      const active = services.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleService(s)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm border transition-all",
                            active
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-background hover:border-emerald-400"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  {errors.services && <p className="text-xs text-destructive mt-1">{errors.services.message}</p>}
                </div>

                <Field label="Tell us a bit more" optional>
                  <Textarea
                    {...register("project_description")}
                    placeholder="e.g. Roof is leaking near the chimney after the last storm…"
                    rows={4}
                    maxLength={2000}
                  />
                </Field>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6 border-emerald-100">
              <SectionHeader icon={<Calendar className="h-5 w-5" />} title="When do you want to start?" />
              <div className="mt-4">
                <ChipRow
                  options={TIMELINES as readonly string[]}
                  value={timeline}
                  onChange={(v) => setValue("timeline", v as any, { shouldValidate: true })}
                  size="lg"
                />
              </div>
            </Card>

            {/* Payment */}
            <Card className="p-6 border-emerald-100">
              <SectionHeader icon={<DollarSign className="h-5 w-5" />} title="How are you paying?" />
              <div className="grid md:grid-cols-3 gap-3 mt-4">
                {PAYMENT_METHODS.map((p) => {
                  const active = paymentMethod === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setValue("payment_method", p.id, { shouldValidate: true })}
                      className={cn(
                        "p-4 text-left rounded-xl border-2 transition-all",
                        active
                          ? "border-emerald-600 bg-emerald-50 shadow-md"
                          : "border-border hover:border-emerald-300"
                      )}
                    >
                      <div className="font-semibold">{p.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === "insurance" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid md:grid-cols-2 gap-4 mt-4 overflow-hidden"
                >
                  <Field label="Insurance carrier" optional>
                    <Input {...register("insurance_carrier")} placeholder="e.g. State Farm" />
                  </Field>
                  <Field label="Claim # (if filed)" optional>
                    <Input {...register("insurance_claim_number")} placeholder="Optional" />
                  </Field>
                </motion.div>
              )}

              {paymentMethod === "financing" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 overflow-hidden"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={!!watch("financing_interest")}
                      onCheckedChange={(v) => setValue("financing_interest", !!v)}
                    />
                    Send me financing options before the call
                  </label>
                </motion.div>
              )}
            </Card>

            {/* Consent + submit */}
            <Card className="p-6 border-emerald-100">
              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <Checkbox
                  checked={!!consent}
                  onCheckedChange={(v) => setValue("consent", v === true ? true : (undefined as any), { shouldValidate: true })}
                />
                <span className="text-muted-foreground">
                  I agree to be contacted by phone, text, or email about my project. I can opt out anytime.
                </span>
              </label>
              {errors.consent && <p className="text-xs text-destructive mt-2">{errors.consent.message as string}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
                ) : (
                  <><Phone className="h-4 w-4 mr-2" /> Schedule My Consultation</>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3 inline-flex items-center gap-1 w-full justify-center">
                <Mail className="h-3 w-3" /> A consultant will reach out within 1 business day.
              </p>
            </Card>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

// ─── small helpers ───────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  );
}

function Field({
  label, error, optional, children,
}: { label: string; error?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium">
        {label} {optional && <span className="text-xs text-muted-foreground font-normal">(optional)</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function ChipRow({
  options, value, onChange, labelMap, size = "md",
}: {
  options: readonly string[];
  value: string | undefined;
  onChange: (v: string) => void;
  labelMap?: Record<string, string>;
  size?: "md" | "lg";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "rounded-full border transition-all",
              size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-sm",
              active
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-background hover:border-emerald-400"
            )}
          >
            {labelMap?.[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}
