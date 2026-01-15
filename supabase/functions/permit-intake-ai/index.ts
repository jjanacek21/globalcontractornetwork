import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scopeDescription, permitType, jurisdiction, existingData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert permit intake assistant for Florida building permits. Your job is to:
1. Parse scope of work descriptions and extract structured data
2. Identify the complexity tier (basic, standard, complex)
3. Suggest estimated valuation based on scope
4. List any missing required fields
5. Generate follow-up questions for clarification

PERMIT TYPES AND TYPICAL DATA:
- Roofing: roof_squares, roof_type (shingle, tile, metal, flat), deck_type (plywood, OSB, concrete), pitch, stories, tear_off_layers
- Windows/Doors: window_count, door_count, impact_rated (boolean), sizes, frame_material
- HVAC: tonnage, system_type (split, package, heat_pump), duct_work (boolean)
- Solar: panel_count, wattage, roof_mount (boolean), ground_mount (boolean)
- Fence: linear_feet, height, material (wood, vinyl, aluminum, chain_link)
- Pool: pool_type (in-ground, above-ground), size_sqft, screen_enclosure (boolean)

COMPLEXITY TIERS:
- Basic: Simple projects, valuation under $25,000, straightforward scope
- Standard: Mid-range projects, valuation $25,000-$75,000, some complexity
- Complex: Large projects, HVHZ zones, multi-trade, valuation over $75,000, solar, pool

HVHZ (High-Velocity Hurricane Zone) applies to:
- Miami-Dade County (most areas)
- Broward County (coastal areas)
- Requires NOA (Notice of Acceptance) approvals

Always respond with valid JSON in this exact format:
{
  "structuredScope": {
    // extracted fields based on permit type
  },
  "suggestedValuation": number,
  "complexityTier": "basic" | "standard" | "complex",
  "missingFields": ["field1", "field2"],
  "followUpQuestions": ["question1", "question2"],
  "hvhzRequired": boolean,
  "noaRequired": boolean,
  "summary": "brief summary of the project"
}`;

    const userPrompt = `Parse this permit request:

Permit Type: ${permitType}
Jurisdiction: ${jurisdiction}
Scope Description: "${scopeDescription}"
${existingData ? `Existing Data: ${JSON.stringify(existingData)}` : ''}

Extract all relevant structured data, determine complexity tier, and identify any missing information.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      result = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return a default structure if parsing fails
      result = {
        structuredScope: {},
        suggestedValuation: null,
        complexityTier: 'standard',
        missingFields: ['scope_description'],
        followUpQuestions: ['Could you provide more details about the project?'],
        hvhzRequired: false,
        noaRequired: false,
        summary: scopeDescription,
        rawResponse: content
      };
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Permit intake AI error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process intake';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
