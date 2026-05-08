import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sane caps to prevent typos producing million-dollar quotes
const CAPS: Record<string, number> = {
  sqft: 50000,
  linear_feet: 2000,
  count: 100,
  rooms: 30,
  each: 100,
  room: 30,
  lf: 2000,
};

function pickQty(unitRaw: string, measurements: any, answers: any): number {
  const unit = String(unitRaw || "sqft").toLowerCase();
  const m = measurements || {};
  const a = answers || {};
  let qty: number;
  switch (unit) {
    case "each":
    case "count":
      qty = Number(m.count ?? a.count ?? a.quantity ?? 1);
      break;
    case "room":
    case "rooms":
      qty = Number(m.rooms ?? m.count ?? a.rooms ?? 1);
      break;
    case "lf":
    case "linear_feet":
    case "linear-feet":
      qty = Number(m.linear_feet ?? a.linear_feet ?? 50);
      break;
    case "sqft":
    case "sq_ft":
    case "square_feet":
    default:
      qty = Number(m.sqft ?? a.sqft ?? 1000);
      break;
  }
  if (!Number.isFinite(qty) || qty <= 0) qty = 1;
  const cap = CAPS[unit] ?? 50000;
  return Math.min(qty, cap);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { trade_slug, measurements, answers } = await req.json();
    if (!trade_slug) throw new Error("trade_slug required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: trade } = await supabase
      .from("iq_trades")
      .select("id")
      .eq("slug", trade_slug)
      .maybeSingle();
    if (!trade) throw new Error("trade not found");

    const { data: tiers } = await supabase
      .from("iq_trade_pricing_options")
      .select("*")
      .eq("trade_id", trade.id)
      .order("tier_order");

    const tierEstimates = (tiers || []).map((t: any) => {
      const qty = pickQty(t.unit, measurements, answers);
      const base = Number(t.base_price_per_unit) * qty;
      const low = Math.round(base * 0.85);
      const mid = Math.round(base);
      const high = Math.round(base * 1.15);
      return {
        tier_id: t.id,
        tier_name: t.tier_name,
        tier_order: t.tier_order,
        unit: t.unit,
        quantity: qty,
        base_price_per_unit: Number(t.base_price_per_unit),
        inclusions: t.inclusions,
        description: t.description,
        low,
        mid,
        high,
      };
    });

    return new Response(
      JSON.stringify({ tiers: tierEstimates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
