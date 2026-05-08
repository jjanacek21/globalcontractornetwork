import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  FINANCE_PRODUCTS,
  DEFAULT_FINANCE_PRODUCT_ID,
  formatCurrency,
  monthlyPayment,
  financedPrice,
  type FinanceLender,
  type FinanceProduct,
} from "@/lib/financing";
import type { MeasurementResult } from "./RoofMapMeasureStep";
import type { ConditionAnalysis } from "./RoofConditionStep";

interface Package {
  category: "shingle" | "metal";
  tier: "good" | "better" | "best";
  name: string;
  pricePerSquare: number;
  totalLow: number;
  totalHigh: number;
  warranty: string;
  scope: string[];
  highlights?: string[];
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  priceLow: number;
  priceHigh: number;
}

interface PricingResponse {
  shingle: Package[];
  metal: Package[];
  addOns: AddOn[];
}

interface Props {
  measurement: MeasurementResult;
  wasteFactor: number;
  condition: ConditionAnalysis;
  stories: number;
  address: string;
  onBack: () => void;
}

const TIER_STYLES: Record<Package["tier"], { label: string; ring: string; chip: string }> = {
  good: { label: "Good", ring: "border-border", chip: "bg-muted text-muted-foreground" },
  better: { label: "Better", ring: "border-primary ring-2 ring-primary/20", chip: "bg-primary text-primary-foreground" },
  best: { label: "Best", ring: "border-amber-500/60", chip: "bg-amber-500 text-white" },
};

const LENDER_ORDER: FinanceLender[] = ["Service Finance", "PACE / YGreen", "Self Finance"];

export function RoofPackagesStep({
  measurement,
  wasteFactor,
  condition,
  stories,
  address,
  onBack,
}: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<PricingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<"shingle" | "metal">("shingle");
  const [financeId, setFinanceId] = useState<string>(DEFAULT_FINANCE_PRODUCT_ID);
  const [activeAddOns, setActiveAddOns] = useState<Set<string>>(new Set());

  const finance: FinanceProduct =
    FINANCE_PRODUCTS.find((p) => p.id === financeId) ?? FINANCE_PRODUCTS[0];

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        const combinedSqft =
          (measurement.total_roof_area_sqft ?? measurement.total_pitched_area_sqft ?? 0) +
          (measurement.user_added_flat_sqft ?? 0);
        const { data: res, error: fnErr } = await supabase.functions.invoke("roofing-package-pricing", {
          body: {
            totalSqft: combinedSqft,
            pitchMultiplier: measurement.pitch_multiplier,
            wasteFactor,
            condition: {
              severity: condition.severity,
              issues: condition.issues,
              material: condition.material,
            },
            stories,
            region: "Florida",
          },
        });
        if (fnErr) throw new Error(fnErr.message);
        setData(res as PricingResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate pricing");
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [measurement, wasteFactor, condition, stories]);

  const addOnTotal = useMemo(() => {
    if (!data) return { low: 0, high: 0 };
    let low = 0, high = 0;
    for (const a of data.addOns) {
      if (activeAddOns.has(a.id)) {
        low += a.priceLow;
        high += a.priceHigh;
      }
    }
    return { low, high };
  }, [data, activeAddOns]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pt-20 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
        <h2 className="text-xl font-bold mb-2">Building your good / better / best estimate...</h2>
        <p className="text-muted-foreground">
          Combining measurements, condition analysis, and Florida market pricing.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto pt-10 text-center">
        <p className="text-destructive mb-4">{error || "Could not generate estimate"}</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const packages = category === "shingle" ? data.shingle : data.metal;

  const toggleAddOn = (id: string) => {
    setActiveAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-5xl mx-auto pt-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
          <Sparkles className="h-3.5 w-3.5" /> AI-generated estimate
        </div>
        <h1 className="text-2xl font-bold">Choose Your Roof Package</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {address} •{" "}
          {Math.round(
            (measurement.total_roof_area_sqft ?? measurement.total_pitched_area_sqft ?? 0) +
              (measurement.user_added_flat_sqft ?? 0),
          ).toLocaleString()}{" "}
          sqft • {(wasteFactor * 100).toFixed(0)}% waste
        </p>
      </div>

      {/* Shingle vs Metal toggle */}
      <div className="flex justify-center mb-5">
        <div className="inline-flex rounded-full border bg-card p-1">
          {(["shingle", "metal"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                category === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {c} roof
            </button>
          ))}
        </div>
      </div>

      {/* Financing */}
      <div className="rounded-2xl border bg-card p-4 mb-6">
        <p className="text-sm font-semibold mb-3">Financing options</p>
        <div className="space-y-3">
          {LENDER_ORDER.map((lender) => {
            const products = FINANCE_PRODUCTS.filter((p) => p.lender === lender);
            return (
              <div key={lender}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                  {lender}
                  {lender !== "Self Finance" && products[0] && (
                    <span className="ml-2 normal-case tracking-normal text-muted-foreground/80">
                      · {(products[0].dealerFee * 100).toFixed(0)}% dealer fee
                      {lender === "Service Finance" && " (3% on 6.99%/15yr)"}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFinanceId(p.id)}
                      className={`px-3 py-2 rounded-lg border-2 text-xs sm:text-sm transition-all ${
                        financeId === p.id
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {p.label}
                      {p.dealerFee > 0 && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          ({(p.dealerFee * 100).toFixed(0)}% fee)
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          Estimate only — not a credit offer. Actual rates depend on lender approval and credit profile.
        </p>
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {packages.map((pkg) => {
          const styles = TIER_STYLES[pkg.tier];
          const cashLow = pkg.totalLow + addOnTotal.low;
          const cashHigh = pkg.totalHigh + addOnTotal.high;
          const cashMid = (cashLow + cashHigh) / 2;
          const finMid = financedPrice(cashMid, finance.dealerFee);
          const monthly = monthlyPayment(finMid, finance.apr, finance.termMonths);
          const showFinanced = finance.dealerFee > 0;
          const showMonthly = finance.termMonths > 0;
          return (
            <Card key={pkg.tier} className={`relative border-2 ${styles.ring}`}>
              <div className={`absolute -top-2 left-4 px-2 py-0.5 rounded text-xs font-bold uppercase ${styles.chip}`}>
                {styles.label}
              </div>
              <CardContent className="p-5 pt-7">
                <h3 className="font-bold text-lg leading-tight">{pkg.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{pkg.warranty}</p>

                <p className="text-xs text-muted-foreground">Cash price</p>
                <p className="text-2xl font-bold text-primary leading-tight">
                  {formatCurrency(cashLow)}
                  <span className="text-base font-medium text-muted-foreground">
                    {" "}– {formatCurrency(cashHigh)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mb-3">≈ ${pkg.pricePerSquare}/square</p>

                {showFinanced && (
                  <div className="rounded-lg bg-muted/40 p-3 mb-3">
                    <p className="text-xs text-muted-foreground">
                      Financed price (incl. {(finance.dealerFee * 100).toFixed(0)}% fee)
                    </p>
                    <p className="text-base font-semibold">
                      {formatCurrency(financedPrice(cashLow, finance.dealerFee))} –{" "}
                      {formatCurrency(financedPrice(cashHigh, finance.dealerFee))}
                    </p>
                    {showMonthly && (
                      <>
                        <p className="text-xs text-muted-foreground mt-1.5">Est. monthly payment</p>
                        <p className="text-lg font-bold">{formatCurrency(monthly)}/mo</p>
                        <p className="text-[11px] text-muted-foreground">
                          {finance.termMonths / 12} yr @ {(finance.apr * 100).toFixed(2)}% APR · {finance.lender}
                        </p>
                      </>
                    )}
                  </div>
                )}

                <ul className="space-y-1.5 mb-4">
                  {pkg.scope.map((s, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate("/directory")}
                  className="w-full gap-2"
                  variant={pkg.tier === "better" ? "default" : "outline"}
                >
                  <Phone className="h-4 w-4" /> Get this quote
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add-ons */}
      {data.addOns.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 mb-6">
          <p className="text-sm font-semibold mb-3">Optional add-ons</p>
          <div className="space-y-2">
            {data.addOns.map((a) => {
              const active = activeAddOns.has(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAddOn(a.id)}
                  className={`w-full text-left flex items-start justify-between gap-3 rounded-lg border-2 p-3 transition-all ${
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 mt-0.5 ${active ? "text-primary" : "text-muted-foreground/40"}`}
                    />
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap">
                    {formatCurrency(a.priceLow)} – {formatCurrency(a.priceHigh)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(condition.issues.length > 0 || condition.notes) && (
        <div className="rounded-2xl border bg-card p-4 mb-6">
          <p className="font-semibold mb-2">Condition findings</p>
          <p className="text-sm text-muted-foreground mb-2">
            Severity: <span className="font-medium capitalize">{condition.severity}</span>
            {condition.material && condition.material !== "Unknown" && <> • {condition.material}</>}
          </p>
          {condition.issues.length > 0 && (
            <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
              {condition.issues.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-[11px] text-center text-muted-foreground">
        Pricing is an AI-generated estimate based on satellite measurement and Florida market data. Final price requires
        a contractor inspection.
      </p>
    </div>
  );
}
