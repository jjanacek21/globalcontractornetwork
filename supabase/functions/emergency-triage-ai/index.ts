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
    const { emergencyDetails } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an emergency mitigation triage specialist for South Florida. Your job is to assess emergency situations and provide immediate guidance.

**Emergency Types We Handle:**
1. **Water Damage**: Burst pipes, flooding, storm damage
2. **Mold Remediation**: Visible mold, musty odors, water stains
3. **Storm Damage**: Hurricane/storm debris, roof damage, tree strikes
4. **Fire Damage**: Smoke damage, soot cleanup, structural assessment
5. **Roof Tarping**: Emergency leak prevention, temporary protection

**Urgency Levels:**
- **CRITICAL (1-2 hours)**: Active flooding, structural danger, health hazards
- **URGENT (2-4 hours)**: Significant water intrusion, spreading damage
- **PRIORITY (Same day)**: Contained damage, risk of escalation
- **SCHEDULED (24-48 hours)**: Stable situation, assessment needed

**Immediate Actions to Recommend:**
- Turn off water main if applicable
- Document damage with photos
- Do not enter if structural danger
- Contact insurance company
- Avoid electrical hazards

Return JSON:
{
  "urgencyLevel": "CRITICAL|URGENT|PRIORITY|SCHEDULED",
  "emergencyType": "type",
  "estimatedResponseTime": "time",
  "immediateActions": ["action1", "action2"],
  "doNotDo": ["warning1", "warning2"],
  "estimatedScope": "description",
  "insuranceTips": ["tip1", "tip2"],
  "estimatedCostRange": "low-high",
  "teamRequired": ["specialist1", "specialist2"]
}`;

    const userPrompt = `Assess this emergency situation:

Emergency Type: ${emergencyDetails.type || 'Unknown'}
Description: ${emergencyDetails.description || 'No description'}
When Did It Happen: ${emergencyDetails.when || 'Unknown'}
Water Involved: ${emergencyDetails.hasWater ? 'Yes' : 'No'}
Visible Mold: ${emergencyDetails.hasMold ? 'Yes' : 'No'}
Structural Damage: ${emergencyDetails.structural ? 'Yes' : 'No'}
Power Status: ${emergencyDetails.hasPower ? 'On' : 'Off'}
Occupants Evacuated: ${emergencyDetails.evacuated ? 'Yes' : 'No'}
Property Type: ${emergencyDetails.propertyType || 'Residential'}

Provide emergency assessment and immediate action guidance.`;

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
    
    let assessment;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        assessment = JSON.parse(jsonMatch[0]);
      }
    } catch {
      assessment = { rawResponse: content };
    }

    return new Response(JSON.stringify(assessment), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Emergency triage AI error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
