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

  // Variant picker + photo-quote state
  const variantConfig = useMemo(() => (trade ? getTradeVariantConfig(trade.slug) : null), [trade]);
  const [groupSelections, setGroupSelections] = useState<SelectedVariant[][]>([]);
  const [groupAreas, setGroupAreas] = useState<number[]>([]);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [measureMode, setMeasureMode] = useState<"variants" | "photos">("variants");

  // Reset selections when trade changes
  useEffect(() => {
    if (variantConfig) {
      setGroupSelections(variantConfig.groups.map(() => []));
      setGroupAreas(variantConfig.groups.map(() => 0));
    }
  }, [variantConfig]);

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

        {phase === "measurement" && variantConfig && (() => {
          // Compute aggregate measurements based on what each group needs.
          const computeMeasurements = () => {
            const m: Record<string, number> = { ...measurements };
            // Reset the units we own
            ["sqft", "linear_feet", "count", "rooms"].forEach((k) => { delete m[k]; });

            variantConfig.groups.forEach((g, idx) => {
              const sels = groupSelections[idx] || [];
              if (g.mode === "items") {
                const total = sels.reduce((sum, s) => sum + (s.qty || 0), 0);
                m[g.unit] = (m[g.unit] || 0) + total;
              } else {
                m[g.unit] = (m[g.unit] || 0) + (groupAreas[idx] || 0);
              }
            });
            // Carry extras (e.g. stories)
            (variantConfig.extras || []).forEach((ex) => {
              if (extras[ex.key] != null) m[ex.key] = extras[ex.key];
            });
            return m;
          };

          const applyAndAdvance = (next: "questions" | "results") => {
            const m = computeMeasurements();
            setMeasurements(m);
            // Persist variants in answers JSON for the contractor
            const variantsBlob: any = {};
            variantConfig.groups.forEach((g, idx) => {
              variantsBlob[g.title] = {
                mode: g.mode,
                unit: g.unit,
                selections: groupSelections[idx] || [],
                amount: g.mode === "area" ? (groupAreas[idx] || 0) : undefined,
              };
            });
            setAnswers({ ...answers, _selected_variants: variantsBlob });
            if (next === "results") {
              calcEstimate();
              setPhase("results");
            } else {
              setPhase(next);
            }
          };

          const hasAny = groupSelections.some((g, i) =>
            variantConfig.groups[i].mode === "items"
              ? g.some((s) => s.qty > 0)
              : g.length > 0 && (groupAreas[i] || 0) > 0
          );

          return (
            <Card className="p-6 overflow-hidden">
              <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold">{variantConfig.title}</h2>
                  <p className="text-muted-foreground text-sm">{variantConfig.intro}</p>
                </div>
                {/* Mode toggle */}
                <div className="inline-flex rounded-full bg-muted p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setMeasureMode("variants")}
                    className={cn("px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition", measureMode === "variants" ? "bg-background shadow font-semibold" : "text-muted-foreground")}
                  >
                    <ListChecks className="h-3.5 w-3.5" /> Pick options
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeasureMode("photos")}
                    className={cn("px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition", measureMode === "photos" ? "bg-background shadow font-semibold" : "text-muted-foreground")}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Quote from photos
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {measureMode === "variants" ? (
                  <motion.div
                    key="variants"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="space-y-8"
                  >
                    {variantConfig.groups.map((g, idx) => (
                      <VariantPicker
                        key={g.title + idx}
                        group={g}
                        selections={groupSelections[idx] || []}
                        onChange={(next) => {
                          const arr = [...groupSelections];
                          arr[idx] = next;
                          setGroupSelections(arr);
                        }}
                        areaValue={groupAreas[idx]}
                        onAreaChange={(n) => {
                          const arr = [...groupAreas];
                          arr[idx] = n;
                          setGroupAreas(arr);
                        }}
                      />
                    ))}

                    {(variantConfig.extras || []).length > 0 && (
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                        {variantConfig.extras!.map((ex) => (
                          <div key={ex.key}>
                            <Label className="text-xs">{ex.label}</Label>
                            <Input
                              type="number"
                              min={0}
                              value={extras[ex.key] ?? ""}
                              placeholder={ex.placeholder}
                              onChange={(e) => setExtras({ ...extras, [ex.key]: Number(e.target.value) })}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setPhase("address")}>Back</Button>
                      <Button onClick={() => applyAndAdvance("questions")} disabled={!hasAny}>
                        Next <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="photos"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                  >
                    <PhotoQuotePanel
                      tradeSlug={trade.slug}
                      photos={photos}
                      onPhotosChange={setPhotos}
                      onAnalyzed={(a: PhotoAnalysis) => {
                        setAnalysis(a);
                        // Merge AI-suggested measurements into state
                        const sm = a.suggested_measurements || {};
                        const m: Record<string, number> = { ...measurements };
                        Object.entries(sm).forEach(([k, v]) => { if (typeof v === "number") m[k] = v; });
                        setMeasurements(m);
                        setAnswers({ ...answers, _ai_scope: a.scope_summary });
                        // Trigger pricing + jump straight to results
                        calcEstimate();
                        setPhase("results");
                      }}
                    />
                    <div className="flex justify-between pt-6">
                      <Button variant="outline" onClick={() => setPhase("address")}>Back</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })()}

        {phase === "measurement" && !variantConfig && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-2">Project size</h2>
            <p className="text-muted-foreground mb-6">Give us a rough size for ballpark pricing.</p>
            <Label>Approx. sqft</Label>
            <Input
              type="number"
              min={0}
              value={(measurements as any).sqft ?? ""}
              onChange={(e) => setMeasurements({ ...measurements, sqft: Number(e.target.value) })}
            />
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setPhase("address")}>Back</Button>
              <Button onClick={() => setPhase("questions")}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </Card>
        )}

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
                  {analysis.scope_summary && (
                    <p className="mb-2 italic text-muted-foreground">{analysis.scope_summary}</p>
                  )}
                  {analysis.condition && <div><strong>Condition:</strong> {analysis.condition}</div>}
                  {analysis.severity && <div><strong>Severity:</strong> {analysis.severity}</div>}
                  {typeof analysis.confidence === "number" && (
                    <div><strong>Confidence:</strong> {Math.round(analysis.confidence * 100)}%</div>
                  )}
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
