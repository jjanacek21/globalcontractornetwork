// AI photo-quote: vision call via Lovable AI Gateway. Returns a structured scope + measurements.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { trade_slug, photo_urls } = await req.json();
    if (!trade_slug || !Array.isArray(photo_urls) || photo_urls.length === 0) {
      return new Response(JSON.stringify({ error: "trade_slug and photo_urls required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a senior estimator analyzing photos of a "${trade_slug}" project.
Return:
- a short scope_summary (1-2 sentences)
- condition (new / good / fair / poor)
- severity (none / low / medium / high)
- 3-6 concrete observations
- suggested_measurements (sqft, linear_feet, count, rooms, stories — only the units that apply to this trade)
- confidence (0-1)
Be conservative. If you can't tell, omit the field.`;

    const userContent: any[] = [
      { type: "text", text: "Analyze these photos for a ballpark estimate." },
      ...photo_urls.slice(0, 6).map((url: string) => ({
        type: "image_url",
        image_url: { url },
      })),
    ];

    const tools = [{
      type: "function",
      function: {
        name: "report_analysis",
        description: "Return the structured analysis",
        parameters: {
          type: "object",
          properties: {
            scope_summary: { type: "string" },
            condition: { type: "string", enum: ["new", "good", "fair", "poor"] },
            severity: { type: "string", enum: ["none", "low", "medium", "high"] },
            observations: { type: "array", items: { type: "string" } },
            suggested_measurements: {
              type: "object",
              properties: {
                sqft: { type: "number" },
                linear_feet: { type: "number" },
                count: { type: "number" },
                rooms: { type: "number" },
                stories: { type: "number" },
              },
              additionalProperties: false,
            },
            confidence: { type: "number" },
          },
          required: ["scope_summary", "observations"],
          additionalProperties: false,
        },
      },
    }];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools,
        tool_choice: { type: "function", function: { name: "report_analysis" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await resp.text();
      console.error("AI gateway error", resp.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = {};
    if (call?.function?.arguments) {
      try { parsed = JSON.parse(call.function.arguments); } catch { /* noop */ }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("iq-photo-quote error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
