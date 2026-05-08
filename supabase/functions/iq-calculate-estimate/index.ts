import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Determine quantity (sqft, lf, count, etc.) - prefer measurements then answers
    const qty = Number(
      measurements?.sqft ??
      measurements?.linear_feet ??
      measurements?.count ??
      answers?.sqft ??
      answers?.linear_feet ??
      answers?.count ??
      answers?.quantity ??
      1000 // sensible default for ballparks
    );

    const tierEstimates = (tiers || []).map((t: any) => {
      const base = Number(t.base_price_per_unit) * qty;
      const low = Math.round(base * 0.85);
      const mid = Math.round(base);
      const high = Math.round(base * 1.15);
      return {
        tier_id: t.id,
        tier_name: t.tier_name,
        tier_order: t.tier_order,
        unit: t.unit,
        base_price_per_unit: Number(t.base_price_per_unit),
        inclusions: t.inclusions,
        description: t.description,
        low,
        mid,
        high,
      };
    });

    return new Response(
      JSON.stringify({ quantity: qty, tiers: tierEstimates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
