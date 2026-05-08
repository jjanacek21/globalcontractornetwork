import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Upload, X, CheckCircle2, Sparkles, ListChecks } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete } from "@/components/homeowner/AddressAutocomplete";
import { toast } from "sonner";
import { getTradeVariantConfig } from "./tradeVariants";
import { VariantPicker, type SelectedVariant } from "./shared/VariantPicker";
import { PhotoQuotePanel, type PhotoAnalysis } from "./shared/PhotoQuotePanel";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  measurement_method: string;
  licensed_entity_name: string | null;
  licensed_entity_number: string | null;
}

interface Question {
  id: string;
  step_number: number;
  question_text: string;
  question_type: string;
  options: any;
  required: boolean;
  help_text: string | null;
  conditional_logic: any;
}

interface PricingTier {
  tier_id: string;
  tier_name: string;
  tier_order: number;
  unit: string;
  quantity?: number;
  base_price_per_unit: number;
  inclusions: string[];
  description: string | null;
  low: number;
  mid: number;
  high: number;
}

type Phase = "address" | "measurement" | "questions" | "photos" | "results";

export default function TradeWizard() {
  const { tradeSlug } = useParams<{ tradeSlug: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [phase, setPhase] = useState<Phase>("address");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [satelliteUrl, setSatelliteUrl] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, any>>({});
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<{ url: string; path: string }[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tradeSlug) return;
    (async () => {
      setLoading(true);
      const { data: t } = await supabase
        .from("iq_trades")
        .select("id, slug, name, category, description, measurement_method, licensed_entity_name, licensed_entity_number")
        .eq("slug", tradeSlug)
        .maybeSingle();
      if (!t) {
        toast.error("Service not found");
        navigate("/instant-quote");
        return;
      }
      setTrade(t as Trade);
      const { data: qs } = await supabase
        .from("iq_trade_questions")
        .select("*")
        .eq("trade_id", (t as Trade).id)
        .order("step_number");
      setQuestions((qs || []) as Question[]);
      setLoading(false);
    })();
  }, [tradeSlug, navigate]);

  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (!q.conditional_logic || typeof q.conditional_logic !== "object") return true;
      const { field, equals, in: inList } = q.conditional_logic as any;
      if (!field) return true;
      const v = answers[field];
      if (equals !== undefined) return v === equals;
      if (Array.isArray(inList)) return inList.includes(v);
      return true;
    });
  }, [questions, answers]);

  const handleAddressNext = async () => {
    if (!address || address.length < 5) {
      toast.error("Enter your property address");
      return;
    }
    // Only roofing actually uses the satellite image; skip the network call for everyone else
    const needsSatellite = trade?.slug === "roofing";
    if (needsSatellite) {
      setBusy(true);
      try {
        const { data, error } = await supabase.functions.invoke("iq-analyze-property", {
          body: { address },
        });
        if (error) throw error;
        if (data?.lat && data?.lng) setCoords({ lat: data.lat, lng: data.lng });
        if (data?.satellite_url) setSatelliteUrl(data.satellite_url);
      } catch (e: any) {
        console.warn("property lookup failed", e);
      } finally {
        setBusy(false);
      }
    }
    setPhase(trade?.measurement_method === "none" ? "questions" : "measurement");
  };

  const handleUploadPhoto = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "anon";
    const path = `${userId}/${trade!.slug}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("quote-photos").upload(path, file);
    if (error) {
      toast.error("Photo upload failed");
      return;
    }
    const { data: signed } = await supabase.storage.from("quote-photos").createSignedUrl(path, 3600);
    if (signed?.signedUrl) {
      setPhotos((p) => [...p, { url: signed.signedUrl, path }]);
    }
  };

  const handleAnalyzePhotos = async () => {
    if (photos.length === 0) {
      setPhase("results");
      await calcEstimate();
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("iq-analyze-photos", {
        body: { trade_slug: trade!.slug, photo_urls: photos.map((p) => p.url) },
      });
      if (error) throw error;
      setAnalysis(data?.analysis || null);
    } catch (e: any) {
      console.warn("AI analysis failed", e);
      toast.error(e?.message || "AI analysis unavailable");
    } finally {
      setBusy(false);
      await calcEstimate();
      setPhase("results");
    }
  };

  const calcEstimate = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("iq-calculate-estimate", {
        body: { trade_slug: trade!.slug, measurements, answers },
      });
      if (error) throw error;
      setTiers(data?.tiers || []);
      if (data?.tiers?.[0]) setSelectedTierId(data.tiers[0].tier_id);
    } catch (e: any) {
      toast.error(e?.message || "Estimate failed");
    } finally {
      setBusy(false);
    }
  };

  const submitQuote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const sel = tiers.find((t) => t.tier_id === selectedTierId);
    const { error } = await supabase.from("iq_quote_requests").insert({
      user_id: user?.id ?? null,
      trade_id: trade!.id,
      property_address: address,
      property_lat: coords?.lat,
      property_lng: coords?.lng,
      answers,
      uploaded_photos: photos.map((p) => p.path),
      ai_analysis: analysis,
      measurements,
      estimate_low: sel?.low,
      estimate_mid: sel?.mid,
      estimate_high: sel?.high,
      selected_tier: sel?.tier_name,
      status: "submitted",
    });
    if (error) {
      toast.error("Could not submit");
      return;
    }
    toast.success("Quote request sent! A pro will reach out shortly.");
    navigate("/member/dashboard");
  };

  if (loading || !trade) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const stepIdx = ["address", "measurement", "questions", "photos", "results"].indexOf(phase);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/instant-quote" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All services
          </Link>
          <h1 className="text-lg font-semibold">{trade.name} Quote</h1>
          <Link to="/member/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
        </div>
        <div className="container mx-auto px-4 pb-3">
          <div className="flex gap-1">
            {["Address","Measure","Details","Photos","Estimate"].map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1 rounded ${i <= stepIdx ? "bg-primary" : "bg-muted"}`} />
                <div className={`text-[10px] mt-1 ${i <= stepIdx ? "text-foreground" : "text-muted-foreground"}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {phase === "address" && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-2">Where's the project?</h2>
            <p className="text-muted-foreground mb-6">We'll pull a satellite view and any data we can.</p>
            <Label htmlFor="addr">Property address</Label>
            <AddressAutocomplete
              id="addr"
              value={address}
              onChange={setAddress}
              onSelect={(a, c) => { setAddress(a); setCoords({ lat: c.lat, lng: c.lng }); }}
            />
            <div className="flex justify-end mt-6">
              <Button onClick={handleAddressNext} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Next <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
            </div>
          </Card>
        )}

        {phase === "measurement" && (() => {
          // Per-trade measurement config. Keys = trade slug.
          type Field = { key: "sqft" | "linear_feet" | "count" | "rooms" | "stories"; label: string; placeholder?: string; help?: string };
          const CFG: Record<string, { title: string; intro: string; fields: Field[] }> = {
            "gutters":            { title: "Roof edge length", intro: "Estimate the linear feet of roof edge that needs gutters.", fields: [{ key: "linear_feet", label: "Linear feet of roof edge", placeholder: "e.g. 180", help: "Average single-story home: 150–200 LF" }, { key: "stories", label: "# of stories", placeholder: "1" }] },
            "soffit-fascia":      { title: "Soffit & fascia run", intro: "How many linear feet of soffit/fascia?", fields: [{ key: "linear_feet", label: "Linear feet", placeholder: "e.g. 180" }, { key: "stories", label: "# of stories", placeholder: "1" }] },
            "pavers":             { title: "Paver area", intro: "Roughly how big is the paver area?", fields: [{ key: "sqft", label: "Square feet", placeholder: "e.g. 600", help: "Typical driveway: 600–800 sqft. Patio: 200–400 sqft." }] },
            "siding":             { title: "Siding area", intro: "Estimate the wall area to be sided.", fields: [{ key: "sqft", label: "Wall sqft", placeholder: "e.g. 1800" }, { key: "stories", label: "# of stories", placeholder: "1" }] },
            "stucco":             { title: "Stucco area", intro: "Estimate the wall area for stucco work.", fields: [{ key: "sqft", label: "Wall sqft", placeholder: "e.g. 1800" }, { key: "stories", label: "# of stories", placeholder: "1" }] },
            "exterior-paint":     { title: "Paint area", intro: "Estimate the exterior wall area to paint.", fields: [{ key: "sqft", label: "Wall sqft", placeholder: "e.g. 2000" }, { key: "stories", label: "# of stories", placeholder: "1" }] },
            "pressure-washing":   { title: "Wash area", intro: "Roughly how much surface needs cleaning?", fields: [{ key: "sqft", label: "Square feet", placeholder: "e.g. 1500" }] },
            "windows":            { title: "Number of windows", intro: "How many windows are we quoting?", fields: [{ key: "count", label: "# of windows", placeholder: "e.g. 10" }] },
            "doors":              { title: "Number of doors", intro: "How many doors are we quoting?", fields: [{ key: "count", label: "# of doors", placeholder: "e.g. 2" }] },
            "eifs-bands":         { title: "Band length", intro: "Total linear feet of EIFS bands.", fields: [{ key: "linear_feet", label: "Linear feet", placeholder: "e.g. 120" }] },
            "crown-molding":      { title: "Molding length", intro: "Total linear feet of crown molding.", fields: [{ key: "linear_feet", label: "Linear feet", placeholder: "e.g. 80" }] },
            "drywall":            { title: "Drywall area", intro: "Approx wall/ceiling area.", fields: [{ key: "sqft", label: "Square feet", placeholder: "e.g. 500" }] },
            "texture":            { title: "Texture area", intro: "Approx ceiling/wall area to texture.", fields: [{ key: "sqft", label: "Square feet", placeholder: "e.g. 500" }] },
            "flooring":           { title: "Flooring area", intro: "Square feet of flooring needed.", fields: [{ key: "sqft", label: "Square feet", placeholder: "e.g. 1200" }] },
            "interior-paint":     { title: "Rooms to paint", intro: "How many rooms?", fields: [{ key: "rooms", label: "# of rooms", placeholder: "e.g. 4" }] },
            "cabinets":           { title: "Cabinet linear feet", intro: "Estimated linear feet of cabinets.", fields: [{ key: "linear_feet", label: "Linear feet", placeholder: "e.g. 25" }] },
            "plumbing":           { title: "Fixtures", intro: "How many plumbing fixtures?", fields: [{ key: "count", label: "# of fixtures", placeholder: "e.g. 5" }] },
            "electrical":         { title: "Outlets/fixtures", intro: "How many outlets/fixtures?", fields: [{ key: "count", label: "# of outlets/fixtures", placeholder: "e.g. 8" }] },
            "bathrooms":          { title: "Number of bathrooms", intro: "How many bathrooms are we remodeling?", fields: [{ key: "count", label: "# of bathrooms", placeholder: "e.g. 2", help: "Most projects are 1–3 bathrooms." }] },
            "kitchens":           { title: "Number of kitchens", intro: "How many kitchens are we remodeling?", fields: [{ key: "count", label: "# of kitchens", placeholder: "1" }] },
            "interior-renovation":{ title: "Rooms to renovate", intro: "How many rooms total?", fields: [{ key: "rooms", label: "# of rooms", placeholder: "e.g. 3" }, { key: "sqft", label: "Total sqft (optional)", placeholder: "e.g. 1500" }] },
            "tree-landscaping":   { title: "Trees & lot", intro: "How many trees and how big is the lot?", fields: [{ key: "count", label: "# of trees", placeholder: "e.g. 4" }, { key: "sqft", label: "Lot size sqft (optional)", placeholder: "e.g. 6000" }] },
            "window-cleaning":    { title: "Number of windows", intro: "How many windows to clean?", fields: [{ key: "count", label: "# of windows", placeholder: "e.g. 12" }, { key: "stories", label: "# of stories", placeholder: "1" }] },
            "emergency-services": { title: "Affected area", intro: "Roughly how much area is affected?", fields: [{ key: "sqft", label: "Affected sqft", placeholder: "e.g. 200" }] },
          };
          const cfg = CFG[trade.slug] || { title: "Project size", intro: "Give us a rough size for ballpark pricing.", fields: [{ key: "sqft" as const, label: "Approx. sqft", placeholder: "e.g. 1000" }] };

          return (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-2">{cfg.title}</h2>
              <p className="text-muted-foreground mb-6">{cfg.intro}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cfg.fields.map((f) => (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(measurements as any)[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setMeasurements({ ...measurements, [f.key]: Number(e.target.value) })}
                    />
                    {f.help && <p className="text-xs text-muted-foreground mt-1">{f.help}</p>}
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setPhase("address")}>Back</Button>
                <Button onClick={() => setPhase("questions")}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </div>
            </Card>
          );
        })()}

        {phase === "questions" && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Project details</h2>
            <div className="space-y-6">
              {visibleQuestions.map((q) => (
                <div key={q.id}>
                  <Label className="font-semibold">{q.question_text}{q.required && " *"}</Label>
                  {q.help_text && <p className="text-xs text-muted-foreground mt-1 mb-2">{q.help_text}</p>}

                  {q.question_type === "single_select" && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(q.options || []).map((opt: any) => {
                        const val = typeof opt === "string" ? opt : opt.value || opt.label;
                        const label = typeof opt === "string" ? opt : opt.label || opt.value;
                        const selected = answers[q.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAnswers({ ...answers, [q.id]: val })}
                            className={`p-3 rounded-lg border text-left text-sm transition-all ${selected ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.question_type === "multi_select" && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(q.options || []).map((opt: any) => {
                        const val = typeof opt === "string" ? opt : opt.value || opt.label;
                        const label = typeof opt === "string" ? opt : opt.label || opt.value;
                        const arr: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                        const checked = arr.includes(val);
                        return (
                          <label key={val} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${checked ? "border-primary bg-primary/5" : ""}`}>
                            <Checkbox checked={checked} onCheckedChange={(c) => {
                              const next = c ? [...arr, val] : arr.filter((x) => x !== val);
                              setAnswers({ ...answers, [q.id]: next });
                            }} />
                            <span className="text-sm">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.question_type === "number" && (
                    <Input
                      type="number"
                      className="mt-2"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: Number(e.target.value) })}
                    />
                  )}

                  {q.question_type === "text" && (
                    <Textarea
                      className="mt-2"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setPhase("measurement")}>Back</Button>
              <Button onClick={() => setPhase("photos")}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </Card>
        )}

        {phase === "photos" && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-2">Add photos (optional)</h2>
            <p className="text-muted-foreground mb-6">AI will assess condition and tailor your estimate.</p>

            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 cursor-pointer hover:border-primary transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  Array.from(e.target.files || []).forEach(handleUploadPhoto);
                }}
              />
            </label>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {photos.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p.url} alt="" className="w-full h-24 object-cover rounded" />
                    <button
                      onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setPhase("questions")}>Back</Button>
              <Button onClick={handleAnalyzePhotos} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Get my estimate <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
            </div>
          </Card>
        )}

        {phase === "results" && (
          <div className="space-y-6">
            {analysis && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> AI condition assessment
                </h3>
                <div className="text-sm space-y-1">
                  {analysis.condition && <div><strong>Condition:</strong> {analysis.condition}</div>}
                  {analysis.severity && <div><strong>Severity:</strong> {analysis.severity}</div>}
                  {Array.isArray(analysis.observations) && analysis.observations.length > 0 && (
                    <div className="mt-2"><strong>Observations:</strong>
                      <ul className="list-disc ml-5">{analysis.observations.map((o: string, i: number) => <li key={i}>{o}</li>)}</ul>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <h2 className="text-2xl font-bold">Pick a package</h2>
            {tiers.length === 0 && <p className="text-muted-foreground">No pricing available.</p>}
            <div className="grid md:grid-cols-3 gap-4">
              {tiers.map((t) => {
                const selected = selectedTierId === t.tier_id;
                return (
                  <Card
                    key={t.tier_id}
                    onClick={() => setSelectedTierId(t.tier_id)}
                    className={`p-5 cursor-pointer transition-all ${selected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50"}`}
                  >
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.tier_name}</div>
                    <div className="text-2xl font-bold mt-2">${t.low.toLocaleString()} – ${t.high.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ${t.base_price_per_unit.toLocaleString()}/{t.unit}
                      {(t as any).quantity ? ` × ${(t as any).quantity} ${t.unit}` : ""}
                    </div>
                    {t.description && <p className="text-sm mt-3">{t.description}</p>}
                    {t.inclusions?.length > 0 && (
                      <ul className="text-xs text-muted-foreground mt-3 space-y-1">
                        {t.inclusions.map((inc, i) => <li key={i}>• {inc}</li>)}
                      </ul>
                    )}
                  </Card>
                );
              })}
            </div>

            <Card className="p-6 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Ballpark estimate generated by AI. Not a binding quote. Final pricing requires on-site inspection by{" "}
                <strong>{trade.licensed_entity_name || "TBD - Licensed Subcontractor"}</strong>
                {trade.licensed_entity_number && ` (License #${trade.licensed_entity_number})`}.
              </p>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setPhase("photos")}>Back</Button>
              <Button onClick={submitQuote} disabled={!selectedTierId || busy}>
                Request this quote <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
