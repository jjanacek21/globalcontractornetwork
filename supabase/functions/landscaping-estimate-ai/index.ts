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
    const { projectDetails } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a landscaping and tree service estimator for South Florida.

**Services Offered:**
1. **Tree Removal**
   - Small trees (under 25ft): $200-$500
   - Medium trees (25-50ft): $500-$1,200
   - Large trees (50-75ft): $1,200-$2,500
   - Very large trees (75ft+): $2,500-$5,000+

2. **Stump Grinding**
   - Small stumps: $75-$150
   - Medium stumps: $150-$300
   - Large stumps: $300-$500

3. **Tree Trimming/Pruning**
   - Basic trim: $150-$400 per tree
   - Crown reduction: $300-$800 per tree
   - Hazard limb removal: $200-$500

4. **Landscaping Services**
   - Sod installation: $1.50-$3.00/sqft
   - Mulch installation: $75-$150/yard
   - Plant installation: varies by type
   - Irrigation repair: $100-$500

5. **Storm Cleanup**
   - Debris removal: $200-$1,000+
   - Emergency services: 1.5x standard rates

**Factors Affecting Price:**
- Tree species and condition
- Access difficulty
- Proximity to structures
- Permit requirements
- Disposal fees

Return JSON:
{
  "services": [
    {
      "service": "name",
      "description": "details",
      "estimateLow": number,
      "estimateHigh": number,
      "timeline": "days/hours"
    }
  ],
  "totalEstimateLow": number,
  "totalEstimateHigh": number,
  "permitRequired": boolean,
  "accessNotes": "any access considerations",
  "recommendations": ["rec1", "rec2"],
  "seasonalNotes": "best time considerations"
}`;

    const userPrompt = `Estimate this landscaping project:

Service Type: ${projectDetails.serviceType || 'General landscaping'}
Tree Details:
- Species: ${projectDetails.treeSpecies || 'Unknown'}
- Height: ${projectDetails.treeHeight || 'Unknown'}
- Diameter: ${projectDetails.treeDiameter || 'Unknown'}
- Quantity: ${projectDetails.treeCount || 1}
- Condition: ${projectDetails.condition || 'Healthy'}
- Near Structure: ${projectDetails.nearStructure ? 'Yes' : 'No'}

Landscaping Details:
- Area Size: ${projectDetails.areaSize || 'Unknown'} sqft
- Current State: ${projectDetails.currentState || 'Unknown'}

Additional Notes: ${projectDetails.notes || 'None'}

Provide detailed estimate.`;

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
    
    let estimate;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        estimate = JSON.parse(jsonMatch[0]);
      }
    } catch {
      estimate = { rawResponse: content };
    }

    return new Response(JSON.stringify(estimate), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Landscaping estimate AI error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
