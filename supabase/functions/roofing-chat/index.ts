import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Roofing chat request with", messages.length, "messages");

    const systemPrompt = `You are an expert roofing consultant AI assistant for Global Contractor Network, specializing in Florida roofing projects. You provide helpful, accurate, and professional advice about roofing.

Your expertise includes:
- Florida Building Code (FBC 2023) requirements
- Hurricane-resistant roofing systems
- Shingle, metal, tile, and flat roof installations
- Roofing materials suitable for hot, humid climates
- Cost estimation and budgeting
- Insurance claims and storm damage assessment
- Energy efficiency and solar integration
- Warranty options and maintenance schedules

Communication style:
- Be friendly, professional, and helpful
- Provide specific, actionable advice
- When discussing costs, always give ranges and note that prices vary
- Emphasize safety and code compliance
- Recommend professional inspections when appropriate
- Be honest about limitations and when to seek specialist help

Key Florida roofing facts to reference:
- Wind zone requirements (Miami-Dade, High Velocity Hurricane Zone)
- Roof-to-wall connection requirements
- Underlayment specifications for Florida
- Permit requirements vary by county
- Insurance considerations post-hurricane

Keep responses concise but informative. Use bullet points for lists. If you don't know something specific, say so and recommend consulting with a local professional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response directly back to the client
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in roofing-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
