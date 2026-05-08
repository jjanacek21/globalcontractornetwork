import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { trade_slug, photo_urls } = await req.json();
    if (!trade_slug) throw new Error("trade_slug required");
    if (!Array.isArray(photo_urls) || photo_urls.length === 0) throw new Error("photo_urls required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: trade } = await supabase
      .from("iq_trades")
      .select("id, name")
      .eq("slug", trade_slug)
      .maybeSingle();
    if (!trade) throw new Error("trade not found");

    const { data: prompt } = await supabase
      .from("iq_trade_ai_prompts")
      .select("system_prompt, output_schema")
      .eq("trade_id", trade.id)
      .eq("prompt_type", "condition_analysis")
      .maybeSingle();

    const systemPrompt = prompt?.system_prompt ||
      `You are a Florida-licensed inspector for ${trade.name}. Analyze the photos and report condition.`;

    const schema = prompt?.output_schema && Object.keys(prompt.output_schema).length > 0
      ? prompt.output_schema
      : {
          type: "object",
          properties: {
            condition: { type: "string", enum: ["excellent", "good", "fair", "poor", "critical"] },
            severity: { type: "string", enum: ["low", "medium", "high"] },
            observations: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
            confidence: { type: "number" },
          },
          required: ["condition", "severity", "observations", "recommended_actions"],
          additionalProperties: false,
        };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const userContent: any[] = [
      { type: "text", text: `Analyze these photos for ${trade.name} condition.` },
      ...photo_urls.map((url: string) => ({ type: "image_url", image_url: { url } })),
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_condition",
              description: "Return structured inspection findings",
              parameters: schema,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_condition" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit, please wait." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${t}`);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    let analysis: any = {};
    try {
      analysis = JSON.parse(toolCall?.function?.arguments || "{}");
    } catch {
      analysis = { raw: aiJson?.choices?.[0]?.message?.content };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
