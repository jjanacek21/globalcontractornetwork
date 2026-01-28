import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RoofMeasurements {
  totalSquares: number;
  flatArea: number;
  pitchedArea: number;
  pitchMultiplier: number;
  wasteFactor: number;
  address?: string;
}

interface PropertyDetails {
  roofAge?: string;
  currentCondition?: string;
  roofType?: string;
  priority?: string;
  hasLeaks?: boolean;
  hasStormDamage?: boolean;
  specialFeatures?: string[];
}

interface Package {
  name: string;
  pricePerSquare: string;
  features: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { measurements, propertyDetails, packages } = await req.json() as {
      measurements: RoofMeasurements;
      propertyDetails: PropertyDetails;
      packages: Package[];
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating AI quote for:", { measurements, propertyDetails });

    const systemPrompt = `You are an expert roofing consultant specializing in Florida roofing projects. You provide detailed, professional quotes and recommendations based on property analysis.

Your expertise includes:
- Florida building codes (FBC 2023)
- Hurricane-resistant roofing requirements
- Material selection for hot, humid climates
- Cost estimation and value optimization
- Energy efficiency considerations

When generating quotes, consider:
1. Property measurements and roof complexity
2. Current roof condition and age
3. Local climate requirements (hurricanes, heat, humidity)
4. Customer priority (budget vs premium)
5. Long-term value and warranty considerations

Always provide specific, actionable recommendations with clear justification.`;

    const userPrompt = `Analyze this roofing project and generate a comprehensive quote recommendation:

PROPERTY MEASUREMENTS:
- Total Roofing Squares: ${measurements.totalSquares.toFixed(2)}
- Flat Area: ${measurements.flatArea.toFixed(0)} sq ft
- Pitched Area: ${measurements.pitchedArea.toFixed(0)} sq ft
- Pitch Multiplier: ${measurements.pitchMultiplier}
- Waste Factor: ${measurements.wasteFactor}%
${measurements.address ? `- Address: ${measurements.address}` : ''}

PROPERTY DETAILS:
- Roof Age: ${propertyDetails.roofAge || 'Unknown'}
- Current Condition: ${propertyDetails.currentCondition || 'Unknown'}
- Roof Type: ${propertyDetails.roofType || 'Unknown'}
- Priority: ${propertyDetails.priority || 'balanced'}
- Has Leaks: ${propertyDetails.hasLeaks ? 'Yes' : 'No'}
- Has Storm Damage: ${propertyDetails.hasStormDamage ? 'Yes' : 'No'}
- Special Features: ${propertyDetails.specialFeatures?.join(', ') || 'None'}

AVAILABLE PACKAGES:
${packages.map((pkg, i) => `
${i + 1}. ${pkg.name} - ${pkg.pricePerSquare}
   Features: ${pkg.features.join('; ')}
`).join('')}

Please provide a JSON response with this exact structure:
{
  "recommendedPackage": "Package Name",
  "reasoning": "Detailed explanation of why this package is recommended",
  "estimatedPriceRange": {
    "low": number,
    "high": number
  },
  "priceBreakdown": {
    "materials": "estimated cost",
    "labor": "estimated cost",
    "permits": "estimated cost",
    "contingency": "estimated cost"
  },
  "timeline": {
    "preparationDays": number,
    "installationDays": number,
    "totalDays": number
  },
  "keyConsiderations": ["consideration 1", "consideration 2", ...],
  "upgradeSuggestions": [
    {
      "item": "upgrade name",
      "benefit": "why it helps",
      "estimatedCost": "additional cost"
    }
  ],
  "warnings": ["any concerns or issues to address"],
  "financingOptions": "brief financing suggestions if applicable"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response received:", content.substring(0, 200));

    // Parse JSON from the response (handle markdown code blocks)
    let quoteData;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      quoteData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Return a structured error response
      quoteData = {
        recommendedPackage: "Silver Roof Package",
        reasoning: content,
        estimatedPriceRange: {
          low: measurements.totalSquares * 700,
          high: measurements.totalSquares * 725,
        },
        keyConsiderations: ["AI response could not be fully parsed. Please review manually."],
        warnings: [],
      };
    }

    return new Response(JSON.stringify(quoteData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-quote-generator:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
