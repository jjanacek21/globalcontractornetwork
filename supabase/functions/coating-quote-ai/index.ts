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
    const { roofDetails, propertyInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert roof coating estimator for South Florida. Analyze property details and provide accurate coating recommendations and estimates.

**Available Coating Types:**
1. **Silicone Coating** ($3.50-$5.50/sqft): Best for flat roofs, excellent ponding water resistance, 15-20 year lifespan
2. **Acrylic Coating** ($2.50-$4.00/sqft): Good for sloped roofs, UV reflective, 10-15 year lifespan
3. **Elastomeric Coating** ($3.00-$4.50/sqft): Flexible, crack-bridging, good for older roofs, 12-18 year lifespan
4. **Polyurea Coating** ($5.00-$8.00/sqft): Premium, fastest cure, strongest protection, 20+ year lifespan

**Factors to Consider:**
- Roof type (flat, low-slope, metal, tile, shingle)
- Current roof condition
- Ponding water issues
- Sun exposure
- Building use (commercial vs residential)
- Budget constraints
- Energy savings goals

Return a JSON response with this structure:
{
  "recommendedCoating": "coating name",
  "reasoning": "why this coating is best",
  "estimateLow": number,
  "estimateHigh": number,
  "pricePerSqft": "range string",
  "timeline": "estimated days",
  "preparation": ["list", "of", "prep", "work"],
  "benefits": ["list", "of", "benefits"],
  "warranty": "warranty info",
  "energySavings": "estimated savings"
}`;

    const userPrompt = `Analyze this roof and provide a coating estimate:

Property Details:
- Square Footage: ${roofDetails.squareFootage || 'Unknown'}
- Roof Type: ${roofDetails.roofType || 'Unknown'}
- Roof Age: ${roofDetails.roofAge || 'Unknown'}
- Current Condition: ${roofDetails.condition || 'Unknown'}
- Has Ponding Water: ${roofDetails.hasPonding ? 'Yes' : 'No'}
- Property Type: ${propertyInfo?.propertyType || 'Residential'}
- Special Concerns: ${roofDetails.concerns || 'None mentioned'}

Provide your coating recommendation and detailed estimate.`;

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
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
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
    
    // Try to parse JSON from the response
    let quoteData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quoteData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      quoteData = { rawResponse: content };
    }

    return new Response(JSON.stringify(quoteData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Coating quote AI error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
