import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_APRS,
  DEFAULT_TERMS_MONTHS,
  formatCurrency,
  monthlyPayment,
} from "@/lib/financing";
import type { MeasurementResult } from "./RoofMapMeasureStep";
import type { ConditionAnalysis } from "./RoofConditionStep";

interface Package {
  tier: "good" | "better" | "best";
  name: string;
  pricePerSquare: number;
  totalLow: number;
  totalHigh: number;
  warranty: string;
  scope: string[];
  highlights?: string[];
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

export function RoofPackagesStep({
  measurement,
  wasteFactor,
  condition,
  stories,
  address,
  onBack,
}: Props) {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aprIndex, setAprIndex] = useState(1); // default 9.99%
  const [termIndex, setTermIndex] = useState(1); // default 120 months

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        const combinedSqft =
          (measurement.total_roof_area_sqft ?? measurement.total_pitched_area_sqft ?? 0) +
          (measurement.user_added_flat_sqft ?? 0);
        const { data, error: fnErr } = await supabase.functions.invoke("roofing-package-pricing", {
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
        setPackages(data?.packages ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate pricing");
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [measurement, wasteFactor, condition, stories]);

  const apr = DEFAULT_APRS[aprIndex];
  const months = DEFAULT_TERMS_MONTHS[termIndex];

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

  if (error || !packages) {
    return (
      <div className="max-w-3xl mx-auto pt-10 text-center">
        <p className="text-destructive mb-4">{error || "Could not generate estimate"}</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

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
          {address} • {Math.round((measurement.total_roof_area_sqft ?? measurement.total_pitched_area_sqft ?? 0) + (measurement.user_added_flat_sqft ?? 0)).toLocaleString()} sqft •{" "}
          {(wasteFactor * 100).toFixed(0)}% waste
        </p>
      </div>

      {/* Financing controls */}
      <div className="rounded-2xl border bg-card p-4 mb-6">
        <p className="text-sm font-semibold mb-3">Financing estimate (optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">APR</p>
            <div className="flex gap-2">
              {DEFAULT_APRS.map((a, i) => (
                <button
                  key={a}
                  onClick={() => setAprIndex(i)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm transition-all ${
                    aprIndex === i ? "border-primary bg-primary/5 font-medium" : "border-border"
                  }`}
                >
                  {(a * 100).toFixed(2)}%
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Term</p>
            <div className="flex gap-2">
              {DEFAULT_TERMS_MONTHS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setTermIndex(i)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm transition-all ${
                    termIndex === i ? "border-primary bg-primary/5 font-medium" : "border-border"
                  }`}
                >
                  {m / 12} yr
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          Estimate only — not a credit offer. Actual rates depend on lender and credit profile.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {packages.map((pkg) => {
          const styles = TIER_STYLES[pkg.tier];
          const mid = (pkg.totalLow + pkg.totalHigh) / 2;
          const monthly = monthlyPayment(mid, apr, months);
          return (
            <Card key={pkg.tier} className={`relative border-2 ${styles.ring}`}>
              <div className={`absolute -top-2 left-4 px-2 py-0.5 rounded text-xs font-bold uppercase ${styles.chip}`}>
                {styles.label}
              </div>
              <CardContent className="p-5 pt-7">
                <h3 className="font-bold text-lg">{pkg.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{pkg.warranty}</p>

                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(pkg.totalLow)}
                  <span className="text-base font-medium text-muted-foreground"> – {formatCurrency(pkg.totalHigh)}</span>
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  ≈ ${pkg.pricePerSquare}/square
                </p>

                <div className="rounded-lg bg-muted/40 p-3 mb-4">
                  <p className="text-xs text-muted-foreground">Est. monthly payment</p>
                  <p className="text-xl font-bold">{formatCurrency(monthly)}/mo</p>
                  <p className="text-[11px] text-muted-foreground">
                    {months / 12} yr @ {(apr * 100).toFixed(2)}% APR
                  </p>
                </div>

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
