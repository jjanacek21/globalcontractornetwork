const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analyze-photo") {
      return await handlePhotoAnalysis(body, LOVABLE_API_KEY);
    } else if (action === "generate-quote") {
      return await handleGenerateQuote(body, LOVABLE_API_KEY);
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("instant-quote-ai error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAI(messages: any[], apiKey: string, tools?: any[], toolChoice?: any) {
  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages,
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = toolChoice;
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

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
  if (!response.ok) {
    const text = await response.text();
    console.error("AI gateway error:", response.status, text);
    throw new Error("AI gateway error");
  }

  return await response.json();
}

async function handlePhotoAnalysis(body: any, apiKey: string) {
  const { photoBase64, serviceType, propertyType } = body;

  const tools = [{
    type: "function",
    function: {
      name: "analyze_building_material",
      description: "Analyze a photo of a building material and return structured findings",
      parameters: {
        type: "object",
        properties: {
          material: { type: "string", description: "The building material identified (e.g., asphalt shingles, concrete, stucco, drywall, wood, carpet, tile)" },
          condition: { type: "string", description: "Overall condition assessment (Excellent, Good, Fair, Poor, Critical)" },
          issues: { type: "array", items: { type: "string" }, description: "Specific issues or damage found" },
          recommendations: { type: "array", items: { type: "string" }, description: "Recommended repairs or actions" },
        },
        required: ["material", "condition", "issues", "recommendations"],
        additionalProperties: false,
      },
    },
  }];

  const messages = [
    {
      role: "system",
      content: `You are an expert building material inspector and property assessment AI. Analyze photos of building materials and provide detailed assessments. You are assessing a ${propertyType} property for ${serviceType} services. Be specific about: material type, condition, damage patterns (hail, wind, water, age, rot, mold), and actionable recommendations. If you see stains, identify the type and cause.`,
    },
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze this building material photo. Identify the material, assess its condition, list any issues or damage, and provide repair recommendations." },
        { type: "image_url", image_url: { url: photoBase64 } },
      ],
    },
  ];

  const result = await callAI(messages, apiKey, tools, { type: "function", function: { name: "analyze_building_material" } });

  if (result instanceof Response) return result;

  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) {
    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ material: "Unknown", condition: "Unable to assess", issues: [], recommendations: ["Please try uploading a clearer photo"] }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGenerateQuote(body: any, apiKey: string) {
  const { propertyType, serviceType, tradeAnswers, photoAnalysis } = body;

  const photoSummary = (photoAnalysis || []).map((p: any, i: number) =>
    `Photo ${i + 1}: Material=${p.material}, Condition=${p.condition}, Issues=${p.issues?.join(", ") || "none"}, Recommendations=${p.recommendations?.join(", ") || "none"}`
  ).join("\n");

  const tools = [{
    type: "function",
    function: {
      name: "generate_instant_quote",
      description: "Generate a complete project quote with DIY instructions and professional scope",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "2-3 paragraph project summary and findings" },
          estimatedCostLow: { type: "number", description: "Low end of professional cost estimate in USD" },
          estimatedCostHigh: { type: "number", description: "High end of professional cost estimate in USD" },
          diy: {
            type: "object",
            properties: {
              steps: { type: "array", items: { type: "string" }, description: "Detailed step-by-step DIY instructions" },
              materialsCost: { type: "number", description: "Estimated cost of materials for DIY in USD" },
              timeEstimate: { type: "string", description: "How long the DIY project should take (e.g., '4-6 hours', '2 weekends')" },
              toolsNeeded: { type: "array", items: { type: "string" }, description: "List of tools needed" },
            },
            required: ["steps", "materialsCost", "timeEstimate", "toolsNeeded"],
          },
          professional: {
            type: "object",
            properties: {
              scopeOfWork: { type: "string", description: "Detailed professional scope of work" },
              timeline: { type: "string", description: "Estimated project timeline" },
            },
            required: ["scopeOfWork", "timeline"],
          },
        },
        required: ["summary", "estimatedCostLow", "estimatedCostHigh", "diy", "professional"],
        additionalProperties: false,
      },
    },
  }];

  const messages = [
    {
      role: "system",
      content: `You are an expert property service estimator for Florida. Generate accurate, detailed quotes with both DIY instructions and professional recommendations. Use current 2024-2025 Florida pricing. Be specific with material quantities, brands when relevant, and step-by-step instructions that a homeowner could actually follow. Include safety warnings where applicable. For professional estimates, use typical South Florida contractor rates.`,
    },
    {
      role: "user",
      content: `Generate an instant quote for this project:

Property Type: ${propertyType}
Service Type: ${serviceType}
Project Details: ${JSON.stringify(tradeAnswers, null, 2)}

${photoSummary ? `Photo Analysis Results:\n${photoSummary}` : "No photos provided."}

Provide a complete quote with cost estimates, detailed DIY step-by-step instructions (with materials costs, time estimate, and tools needed), and a professional scope of work with timeline.`,
    },
  ];

  const result = await callAI(messages, apiKey, tools, { type: "function", function: { name: "generate_instant_quote" } });

  if (result instanceof Response) return result;

  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) {
    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Failed to generate quote" }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
