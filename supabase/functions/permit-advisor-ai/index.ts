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

    const systemPrompt = `You are a Florida building permit expert. You know the requirements for all Florida counties and cities.

**Common Permit Types:**
1. **Roofing Permit**
   - Required for: Re-roofing, new roofs, repairs over 25% of area
   - Documents: Product approval, contractor license, insurance, contract
   - Inspections: Final inspection required
   - Timeline: 1-5 business days approval

2. **Window/Door Permit**
   - Required for: Impact window/door installation
   - Documents: Product NOA, contractor license, energy calculations
   - Inspections: Rough and final
   - Timeline: 3-10 business days

3. **Electrical Permit**
   - Required for: New circuits, panel upgrades, major repairs
   - Documents: Electrical drawings, load calculations
   - Inspections: Rough, final, possibly underground

4. **Plumbing Permit**
   - Required for: Water heaters, re-pipes, fixture adds
   - Documents: Plumbing plan, contractor license
   - Inspections: Rough and final

5. **General Building Permit**
   - Required for: Additions, structural changes, renovations
   - Documents: Engineered drawings, surveys, energy calcs
   - Inspections: Multiple stages

**Key Florida Requirements:**
- HVHZ compliance in High-Velocity Hurricane Zones
- FBC (Florida Building Code) compliance
- Product approvals (NOA or FL approval)
- Licensed and insured contractors
- Owner-builder affidavits if applicable

Return JSON:
{
  "permitsRequired": [
    {
      "permitType": "type",
      "reason": "why needed",
      "documents": ["doc1", "doc2"],
      "estimatedCost": "fee range",
      "approvalTime": "typical days"
    }
  ],
  "inspectionsRequired": ["inspection1", "inspection2"],
  "totalEstimatedFees": "range",
  "totalTimeline": "typical timeline",
  "specialRequirements": ["any special notes"],
  "warnings": ["things to watch out for"]
}`;

    const userPrompt = `What permits are needed for this project:

Project Type: ${projectDetails.projectType || 'Unknown'}
Location (County/City): ${projectDetails.location || 'Florida'}
Scope of Work: ${projectDetails.scope || 'Unknown'}
Property Type: ${projectDetails.propertyType || 'Residential'}
Is this in HVHZ: ${projectDetails.isHVHZ ? 'Yes' : 'Maybe'}
HOA Community: ${projectDetails.hasHOA ? 'Yes' : 'No'}
Historic District: ${projectDetails.isHistoric ? 'Yes' : 'No'}

Additional Details: ${projectDetails.notes || 'None'}

Provide comprehensive permit guidance.`;

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
    
    let guidance;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        guidance = JSON.parse(jsonMatch[0]);
      }
    } catch {
      guidance = { rawResponse: content };
    }

    return new Response(JSON.stringify(guidance), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Permit advisor AI error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
