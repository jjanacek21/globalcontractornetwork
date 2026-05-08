// Generates Good / Better / Best roofing package pricing using the Lovable AI Gateway.
// Inputs: measured sqft, pitch multiplier, waste factor, condition severity, region.
// Output: three packages with price ranges, scope bullets, warranty.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  totalSqft: number;
  pitchMultiplier?: number;
  wasteFactor: number; // e.g. 0.12 for 12%
  condition?: {
    severity?: "minor" | "moderate" | "severe" | "unknown";
    issues?: string[];
    material?: string;
  };
  region?: string;
  stories?: number;
}

interface Package {
  tier: "good" | "better" | "best";
  name: string;
  pricePerSquare: number;
  totalLow: number;
  totalHigh: number;
  warranty: string;
  scope: string[];
  highlights: string[];
}

// Florida baseline price/square ($/100 sqft) — adjusted by AI for condition + complexity.
const BASE_PRICE_PER_SQ: Record<Package["tier"], { low: number; high: number; name: string; warranty: string }> = {
  good: { low: 525, high: 675, name: "Essential Shingle", warranty: "10-year workmanship, 25-year material" },
  better: { low: 725, high: 925, name: "Premium Architectural", warranty: "20-year workmanship, lifetime material" },
  best: { low: 1100, high: 1450, name: "Lifetime Metal / Tile", warranty: "Lifetime workmanship & material" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    const sqft = Math.max(0, Number(body.totalSqft) || 0);
    const waste = Math.max(0, Number(body.wasteFactor) || 0);
    const stories = Math.max(1, Math.min(4, Number(body.stories) || 1));

    if (sqft <= 0) {
      return new Response(JSON.stringify({ error: "totalSqft is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wastedSqft = sqft * (1 + waste);
    const squares = wastedSqft / 100;

    // Severity multiplier (more damage = more tear-off / decking work).
    const severityMult: Record<string, number> = {
      minor: 1.0,
      moderate: 1.08,
      severe: 1.18,
      unknown: 1.05,
    };
    const sevMult = severityMult[body.condition?.severity ?? "unknown"] ?? 1.05;
    const storyMult = stories === 1 ? 1.0 : stories === 2 ? 1.07 : 1.15;
    const adj = sevMult * storyMult;

    const fallbackPackages: Package[] = (["good", "better", "best"] as const).map((tier) => {
      const base = BASE_PRICE_PER_SQ[tier];
      const lowPS = base.low * adj;
      const highPS = base.high * adj;
      return {
        tier,
        name: base.name,
        pricePerSquare: Math.round((lowPS + highPS) / 2),
        totalLow: Math.round(lowPS * squares),
        totalHigh: Math.round(highPS * squares),
        warranty: base.warranty,
        scope:
          tier === "good"
            ? [
                "Tear off existing roof (1 layer)",
                "Synthetic underlayment",
                "Architectural asphalt shingles",
                "New drip edge & pipe boots",
                "Permit & inspection included",
              ]
            : tier === "better"
            ? [
                "Full tear off + decking inspection",
                "Peel-and-stick underlayment (HVHZ-compliant)",
                "Impact-resistant architectural shingles",
                "New ridge vent & ice/water shield",
                "Replace up to 5 sheets of decking",
                "Permit, inspection & 3rd-party wind mitigation",
              ]
            : [
                "Full tear off to deck",
                "Standing-seam metal OR concrete tile",
                "High-temp peel-and-stick underlayment",
                "Premium flashing & valley metal",
                "Up to 10 sheets decking replacement",
                "Permit, inspection, wind mit & engineering letter",
              ],
        highlights:
          tier === "good"
            ? ["Best value", "Florida code-compliant"]
            : tier === "better"
            ? ["Most popular", "Insurance-grade"]
            : ["Top-of-the-line", "Lifetime protection"],
      };
    });

    // Try to enhance with AI but always return a usable answer.
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ packages: fallbackPackages, source: "fallback", squares, wastedSqft }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiPrompt = `You are pricing a Florida residential roof replacement.
Measurements:
- Roof area (with waste): ${Math.round(wastedSqft)} sqft (${squares.toFixed(1)} squares)
- Stories: ${stories}
- Condition severity: ${body.condition?.severity ?? "unknown"}
- Reported issues: ${(body.condition?.issues ?? []).join(", ") || "none"}
- Existing material: ${body.condition?.material ?? "unknown"}
- Region: ${body.region ?? "Florida"}

Return THREE packages (good, better, best) with realistic 2025 Florida retail pricing.
Use these baseline price-per-square ranges before adjustment:
- good $${BASE_PRICE_PER_SQ.good.low}-${BASE_PRICE_PER_SQ.good.high}
- better $${BASE_PRICE_PER_SQ.better.low}-${BASE_PRICE_PER_SQ.better.high}
- best $${BASE_PRICE_PER_SQ.best.low}-${BASE_PRICE_PER_SQ.best.high}
Adjust for severity & stories. Be honest, not inflated.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You produce structured roofing estimates. Always call the tool." },
          { role: "user", content: aiPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_packages",
              description: "Return three pricing tiers",
              parameters: {
                type: "object",
                properties: {
                  packages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tier: { type: "string", enum: ["good", "better", "best"] },
                        name: { type: "string" },
                        pricePerSquare: { type: "number" },
                        totalLow: { type: "number" },
                        totalHigh: { type: "number" },
                        warranty: { type: "string" },
                        scope: { type: "array", items: { type: "string" } },
                        highlights: { type: "array", items: { type: "string" } },
                      },
                      required: ["tier", "name", "pricePerSquare", "totalLow", "totalHigh", "warranty", "scope"],
                    },
                  },
                },
                required: ["packages"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_packages" } },
      }),
    });

    if (!aiRes.ok) {
      await aiRes.text();
      return new Response(
        JSON.stringify({ packages: fallbackPackages, source: "fallback", squares, wastedSqft }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    let packages: Package[] = fallbackPackages;
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        if (Array.isArray(parsed.packages) && parsed.packages.length === 3) {
          packages = parsed.packages.map((p: Package, i: number) => ({
            ...fallbackPackages[i],
            ...p,
            highlights: p.highlights ?? fallbackPackages[i].highlights,
          }));
        }
      } catch {
        // keep fallback
      }
    }

    return new Response(
      JSON.stringify({ packages, source: "ai", squares, wastedSqft }),
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
