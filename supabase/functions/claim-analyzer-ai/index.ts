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
    const { claimDetails } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an insurance claim supplement expert specializing in property damage claims in Florida.

**What We Analyze:**
1. **Missing Line Items**: Items insurance adjusters commonly miss
2. **Underpaid Items**: Items priced below Xactimate standards
3. **Code Upgrades**: Florida Building Code required upgrades
4. **Overhead & Profit**: Legitimate O&P for managed repairs
5. **Supplemental Damages**: Related damages not initially scoped

**Common Supplement Opportunities:**
- Hurricane clips/straps (code requirement)
- Drip edge (code requirement)
- Underlayment upgrades (code requirement)
- Debris removal (often underestimated)
- Steep roof charges (over 7/12 pitch)
- Limited access charges
- Plywood/decking replacement
- Flashing replacement
- Re-felting requirements
- HVAC damage from water intrusion
- Interior water damage
- Mold remediation if applicable

**Xactimate Pricing Knowledge:**
- Always reference current Xactimate pricing
- Note regional price differences
- Include labor burden calculations
- Account for material price increases

Return JSON:
{
  "supplementOpportunities": [
    {
      "category": "category",
      "item": "line item",
      "currentAmount": "if provided",
      "recommendedAmount": "our recommendation",
      "potentialRecovery": "difference",
      "justification": "why supplement is valid"
    }
  ],
  "totalCurrentValue": number,
  "totalRecommendedValue": number,
  "potentialRecovery": number,
  "percentageIncrease": "percentage",
  "priorityItems": ["highest value items"],
  "documentationNeeded": ["photos", "invoices needed"],
  "timeline": "estimated supplement timeline",
  "successRate": "based on claim type"
}`;

    const userPrompt = `Analyze this insurance claim for supplement opportunities:

Claim Type: ${claimDetails.claimType || 'Property damage'}
Date of Loss: ${claimDetails.dateOfLoss || 'Unknown'}
Insurance Carrier: ${claimDetails.carrier || 'Unknown'}
Current Claim Value: $${claimDetails.currentValue || 'Unknown'}
Property Type: ${claimDetails.propertyType || 'Residential'}

Scope of Damage:
${claimDetails.damageScope || 'Not specified'}

Line Items Already Approved:
${claimDetails.approvedItems || 'Not provided'}

Known Issues/Disputes:
${claimDetails.disputes || 'None mentioned'}

Photos Available: ${claimDetails.hasPhotos ? 'Yes' : 'No'}
Contractor Estimate Available: ${claimDetails.hasEstimate ? 'Yes' : 'No'}

Analyze and identify supplement opportunities.`;

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
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      analysis = { rawResponse: content };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Claim analyzer AI error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
