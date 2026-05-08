// Generates Good / Better / Best roofing package pricing (Shingle + Metal) with optional add-ons.
// Inputs: measured sqft, pitch multiplier, waste factor, condition severity/material, region.
// Output: { shingle: Package[], metal: Package[], addOns: AddOn[] }
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  totalSqft: number;          // pitched/main roof area (waste + pitch will apply here)
  flatSqft?: number;          // user-traced flat sections (NO pitch, NO waste)
  pitchMultiplier?: number;
  wasteFactor: number;
  condition?: {
    severity?: "minor" | "moderate" | "severe" | "unknown";
    issues?: string[];
    material?: string;
  };
  region?: string;
  stories?: number;
  eaveLengthFt?: number;
}

type Tier = "good" | "better" | "best";
type Category = "shingle" | "metal";

interface Package {
  category: Category;
  tier: Tier;
  name: string;
  pricePerSquare: number;
  totalLow: number;
  totalHigh: number;
  warranty: string;
  scope: string[];
  highlights: string[];
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  priceLow: number;
  priceHigh: number;
}

const SHINGLE_BASE: Record<Tier, { low: number; high: number; name: string; warranty: string; scope: string[]; highlights: string[] }> = {
  good: {
    low: 575, high: 650,
    name: "Essential Architectural Shingle",
    warranty: "10-yr workmanship · 25-yr material",
    scope: [
      "Tear off existing roof (1 layer)",
      "Synthetic underlayment",
      "Architectural asphalt shingles",
      "New drip edge & pipe boots",
      "Permit & inspection included",
    ],
    highlights: ["Best value", "FL code-compliant"],
  },
  better: {
    low: 725, high: 900,
    name: "Premium Shingle Plus",
    warranty: "20-yr workmanship · lifetime material",
    scope: [
      "Full tear off + decking inspection",
      "Full high-temp peel-and-stick underlayment",
      "Impact-resistant architectural shingles",
      "Solar attic fans included",
      "10 sheets of plywood included",
      "Replace bad fascia",
      "New ridge vent & flashing",
      "Permit, inspection & wind mitigation",
    ],
    highlights: ["Most popular", "Insurance-grade"],
  },
  best: {
    low: 1100, high: 1250,
    name: "Top-Tier Shingle System",
    warranty: "Lifetime workmanship & material",
    scope: [
      "Full tear off to deck",
      "All plywood replaced",
      "New fascia (entire perimeter)",
      "High-temp Polyglass underlayment",
      "Impact-resistant architectural shingles",
      "Attic Breeze solar attic fans",
      "New gutters included",
      "Lifetime warranty",
      "Permit, inspection, wind mit & engineering letter",
    ],
    highlights: ["Top of the line", "Lifetime protection"],
  },
};

const METAL_BASE: Record<Tier, { low: number; high: number; tileLow?: number; tileHigh?: number; name: string; warranty: string; scope: string[]; highlights: string[] }> = {
  good: {
    low: 800, high: 1000,
    name: "5V Crimp / R-Panel Metal",
    warranty: "30-yr paint · 10-yr workmanship",
    scope: [
      "Tear off existing roof",
      "High-temp synthetic underlayment",
      "Exposed-fastener 5V or R-panel (Galvalume or painted)",
      "New drip edge, ridge cap & closures",
      "Permit & inspection",
    ],
    highlights: ["Affordable metal", "Florida coastal favorite"],
  },
  better: {
    low: 950, high: 1200,
    name: '1" Standing Seam Snaplock',
    warranty: "Lifetime paint · 20-yr workmanship",
    scope: [
      "Full tear off",
      "High-temp peel-and-stick underlayment",
      '1" snaplock standing seam (24-ga)',
      "Concealed fastener system",
      "Custom flashing & valley metal",
      "Permit + wind mitigation",
    ],
    highlights: ["Concealed fasteners", "Sleek modern look"],
  },
  best: {
    low: 1150, high: 1500,        // shingle baseline
    tileLow: 1200, tileHigh: 1700, // tile baseline (heavier tear-off)
    name: '1.5" 24-ga Standing Seam OR Stone-Coated Steel',
    warranty: "Lifetime workmanship & material",
    scope: [
      "Full tear off",
      "High-temp Polyglass underlayment",
      '1.5" mechanical-lock standing seam OR stone-coated steel',
      "All new flashing, ridge, hip & gable trim",
      "Attic Breeze solar attic fans",
      "New gutters included",
      "Permit, wind mit & engineering letter",
    ],
    highlights: ["Top tier metal", "Lifetime protection"],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    const sqft = Math.max(0, Number(body.totalSqft) || 0);
    const waste = Math.max(0, Number(body.wasteFactor) || 0);
    const stories = Math.max(1, Math.min(4, Number(body.stories) || 1));
    const materialStr = (body.condition?.material ?? "").toLowerCase();
    const isTile = /tile/.test(materialStr);

    if (sqft <= 0) {
      return new Response(JSON.stringify({ error: "totalSqft is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wastedSqft = sqft * (1 + waste);
    const squares = wastedSqft / 100;

    const severityMult: Record<string, number> = {
      minor: 1.0, moderate: 1.08, severe: 1.18, unknown: 1.05,
    };
    const sevMult = severityMult[body.condition?.severity ?? "unknown"] ?? 1.05;
    const storyMult = stories === 1 ? 1.0 : stories === 2 ? 1.07 : 1.15;
    const adj = sevMult * storyMult;

    const shingle: Package[] = (Object.keys(SHINGLE_BASE) as Tier[]).map((tier) => {
      const b = SHINGLE_BASE[tier];
      const lowPS = b.low * adj;
      const highPS = b.high * adj;
      return {
        category: "shingle",
        tier,
        name: b.name,
        pricePerSquare: Math.round((lowPS + highPS) / 2),
        totalLow: Math.round(lowPS * squares),
        totalHigh: Math.round(highPS * squares),
        warranty: b.warranty,
        scope: b.scope,
        highlights: b.highlights,
      };
    });

    const metal: Package[] = (Object.keys(METAL_BASE) as Tier[]).map((tier) => {
      const b = METAL_BASE[tier];
      const useTile = isTile && b.tileLow != null && b.tileHigh != null;
      const low = useTile ? b.tileLow! : b.low;
      const high = useTile ? b.tileHigh! : b.high;
      const lowPS = low * adj;
      const highPS = high * adj;
      return {
        category: "metal",
        tier,
        name: b.name,
        pricePerSquare: Math.round((lowPS + highPS) / 2),
        totalLow: Math.round(lowPS * squares),
        totalHigh: Math.round(highPS * squares),
        warranty: b.warranty,
        scope: useTile ? [...b.scope, "Includes tile tear-off & disposal"] : b.scope,
        highlights: b.highlights,
      };
    });

    // Add-ons — aluminum soffit/fascia wrap.
    const eaveFt = Number(body.eaveLengthFt) || 0;
    let wrapLow: number, wrapHigh: number;
    if (eaveFt > 0) {
      wrapLow = Math.round(eaveFt * 7);
      wrapHigh = Math.round(eaveFt * 12);
    } else {
      wrapLow = 1800;
      wrapHigh = 3500;
    }

    const addOns: AddOn[] = [
      {
        id: "aluminum-wrap",
        name: "Full aluminum wrap of soffit & fascia",
        description: eaveFt > 0
          ? `Approx. ${Math.round(eaveFt)} linear ft of perimeter wrap`
          : "Typical home perimeter wrap (~250–350 linear ft)",
        priceLow: wrapLow,
        priceHigh: wrapHigh,
      },
    ];

    return new Response(
      JSON.stringify({
        shingle,
        metal,
        addOns,
        // legacy field for older clients
        packages: shingle,
        squares,
        wastedSqft,
        existingMaterial: isTile ? "tile" : (materialStr || "unknown"),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("roofing-package-pricing error", e);
    return new Response(JSON.stringify({ error: "Pricing service failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
