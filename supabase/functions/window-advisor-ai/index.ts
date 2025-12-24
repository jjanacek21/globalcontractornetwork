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
    const { propertyDetails, preferences } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert window and door consultant for South Florida, specializing in impact-rated products for hurricane protection.

**Window Types Available:**
1. **Single Hung** ($400-$800): Traditional, one movable sash, good for bedrooms
2. **Horizontal Roller** ($450-$900): Slides horizontally, great for wide openings
3. **Picture Window** ($350-$700): Fixed, maximum light, no ventilation
4. **3-Lite Roller** ($800-$1,400): Center fixed with sliding sides, large openings
5. **French Door** ($1,500-$3,000): Classic style, great for patios
6. **Sliding Glass Door** ($1,200-$2,500): Space-efficient, modern look

**Impact Rating Levels:**
- **Large Missile (HVHZ)**: Required in High-Velocity Hurricane Zones
- **Small Missile**: Suitable for most Florida locations
- **Basic Impact**: Entry-level protection

**Key Considerations:**
- Florida Building Code requirements
- Insurance discounts (up to 45% for full impact)
- Energy efficiency (ENERGY STAR ratings)
- Noise reduction benefits
- UV protection

Return a JSON response:
{
  "recommendations": [
    {
      "windowType": "type",
      "location": "where in home",
      "impactLevel": "rating",
      "priceRange": "low-high",
      "reason": "why recommended"
    }
  ],
  "totalEstimateLow": number,
  "totalEstimateHigh": number,
  "insuranceSavings": "estimated annual savings",
  "energySavings": "estimated annual savings",
  "timeline": "installation timeline",
  "permitRequired": boolean,
  "additionalNotes": "any special considerations"
}`;

    const userPrompt = `Recommend windows/doors for this property:

Property Details:
- Location: ${propertyDetails.location || 'South Florida'}
- Property Type: ${propertyDetails.propertyType || 'Residential'}
- Stories: ${propertyDetails.stories || '1'}
- Window Count: ${propertyDetails.windowCount || 'Unknown'}
- Door Count: ${propertyDetails.doorCount || 'Unknown'}
- Current Windows: ${propertyDetails.currentWindows || 'Standard non-impact'}
- Budget Range: ${preferences?.budget || 'Moderate'}
- Priority: ${preferences?.priority || 'Hurricane protection'}
- Special Requirements: ${preferences?.special || 'None'}

Provide detailed window and door recommendations.`;

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
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    let recommendations;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch {
      recommendations = { rawResponse: content };
    }

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Window advisor AI error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
