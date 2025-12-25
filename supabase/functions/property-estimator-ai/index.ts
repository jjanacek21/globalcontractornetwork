import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyDetails {
  propertyType: 'single-family' | 'townhouse' | 'duplex' | 'commercial';
  stories: number;
  livingArea: number;
  roofComplexity: 'simple' | 'moderate' | 'complex';
  state?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyDetails } = await req.json() as { propertyDetails: PropertyDetails };
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a roofing estimation expert with deep knowledge of Florida building codes and residential/commercial construction. Your task is to estimate roof square footage based on property details.

Use these Florida-specific multipliers based on property type and roof complexity:

SINGLE-FAMILY HOMES:
- Simple roof (hip or gable, 1 story): living_area × 1.1 to 1.15
- Moderate roof (hip with valleys, 2 story): living_area × 0.55 to 0.65 (footprint) × 1.2 to 1.3
- Complex roof (multiple levels, dormers): living_area × varies × 1.4 to 1.6

TOWNHOUSE:
- Typically narrower footprint, longer design
- Simple: living_area × 0.9 to 1.0
- Moderate: living_area × 0.55 × 1.15 to 1.25
- Complex: living_area × varies × 1.3 to 1.5

DUPLEX:
- Shared roof structure, typically wider
- Simple: living_area × 1.0 to 1.1
- Moderate: living_area × 0.55 × 1.2 to 1.3
- Complex: living_area × varies × 1.4 to 1.6

COMMERCIAL:
- Flat roofs: footprint = living_area (if 1 story) or living_area / stories
- Low slope: footprint × 1.05 to 1.1
- More complex: footprint × 1.15 to 1.25

IMPORTANT: Always provide a reasonable range (low estimate to high estimate) and a confidence level.

Respond ONLY with valid JSON in this exact format:
{
  "estimatedSqftLow": number,
  "estimatedSqftHigh": number,
  "confidence": "high" | "medium" | "low",
  "methodology": "brief explanation of calculation"
}`;

    const userPrompt = `Estimate the roof square footage for this property:
- Property Type: ${propertyDetails.propertyType}
- Number of Stories: ${propertyDetails.stories}
- Living Area: ${propertyDetails.livingArea} sq ft
- Roof Complexity: ${propertyDetails.roofComplexity}
${propertyDetails.state ? `- State: ${propertyDetails.state}` : '- State: Florida (default)'}

Calculate the estimated roof square footage range and provide your confidence level.`;

    console.log('Calling Lovable AI for property estimation...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service credits exhausted. Please try again later.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', aiResponse);

    // Parse the JSON response
    let estimation;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        estimation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback calculation
      const baseMultiplier = propertyDetails.roofComplexity === 'simple' ? 1.1 : 
                            propertyDetails.roofComplexity === 'moderate' ? 1.25 : 1.45;
      const storiesMultiplier = propertyDetails.stories > 1 ? (1 / propertyDetails.stories) * 1.15 : 1;
      const baseSqft = propertyDetails.livingArea * storiesMultiplier * baseMultiplier;
      
      estimation = {
        estimatedSqftLow: Math.round(baseSqft * 0.9),
        estimatedSqftHigh: Math.round(baseSqft * 1.1),
        confidence: 'medium',
        methodology: 'Fallback calculation based on standard multipliers'
      };
    }

    return new Response(JSON.stringify({
      success: true,
      estimation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in property-estimator-ai:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
