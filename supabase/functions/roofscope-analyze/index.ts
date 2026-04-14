import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_base64, mime_type } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert construction estimator and roof inspector. Analyze this photo and provide a structured JSON response with these exact fields:
{
  "material_type": "string - what material/surface is shown",
  "condition": "good|fair|poor|damaged|failed",
  "damage_items": [
    {
      "description": "string - what damage is found",
      "severity": "minor|moderate|severe|critical",
      "recommended_action": "string - repair or replace recommendation",
      "estimated_quantity": number,
      "estimated_unit": "SF|LF|EA|SQ",
      "estimated_unit_price": number
    }
  ],
  "is_storm_damage": boolean,
  "storm_damage_type": "hail|wind|debris|water|none",
  "overall_notes": "string - overall assessment"
}
Be specific about quantities and realistic about pricing. If no damage is visible, return an empty damage_items array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this roof/construction photo and provide your structured assessment." },
              { type: "image_url", image_url: { url: `data:${mime_type || "image/jpeg"};base64,${image_base64}` } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_roof_photo",
              description: "Return structured roof analysis results",
              parameters: {
                type: "object",
                properties: {
                  material_type: { type: "string" },
                  condition: { type: "string", enum: ["good", "fair", "poor", "damaged", "failed"] },
                  damage_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        severity: { type: "string", enum: ["minor", "moderate", "severe", "critical"] },
                        recommended_action: { type: "string" },
                        estimated_quantity: { type: "number" },
                        estimated_unit: { type: "string" },
                        estimated_unit_price: { type: "number" },
                      },
                      required: ["description", "severity", "recommended_action", "estimated_quantity", "estimated_unit", "estimated_unit_price"],
                    },
                  },
                  is_storm_damage: { type: "boolean" },
                  storm_damage_type: { type: "string", enum: ["hail", "wind", "debris", "water", "none"] },
                  overall_notes: { type: "string" },
                },
                required: ["material_type", "condition", "damage_items", "is_storm_damage", "storm_damage_type", "overall_notes"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_roof_photo" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let analysis;

    if (toolCall?.function?.arguments) {
      analysis = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try to parse from content
      const content = aiResult.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        analysis = {
          material_type: "Unknown",
          condition: "unknown",
          damage_items: [],
          is_storm_damage: false,
          storm_damage_type: "none",
          overall_notes: content || "Unable to parse analysis",
        };
      }
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("roofscope-analyze error:", error);
    return new Response(JSON.stringify({ error: "Analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
