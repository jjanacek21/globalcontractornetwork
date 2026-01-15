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
    const { permitRequest, uploadedDocuments, jurisdictionRules } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert Florida permit compliance checker. Your job is to:
1. Compare a permit request against jurisdiction-specific requirements
2. Identify missing required fields and documents
3. Flag compliance issues (especially HVHZ, NOA, licensing requirements)
4. Calculate completion percentage
5. Determine if the packet is ready for submission

DOCUMENT TYPES:
- signed_contract: Signed contractor/owner agreement
- owner_authorization: Owner authorization letter or affidavit
- coi: Certificate of Insurance (must be current)
- noa_approval: Notice of Acceptance (for HVHZ areas)
- product_approval: Florida Product Approval documentation
- wind_mitigation: Wind mitigation inspection form
- roof_layout: Roof layout/diagram showing dimensions
- photos: Property and existing condition photos
- energy_calculations: Energy efficiency calculations (windows/doors)
- asbestos_survey: Asbestos survey for pre-1980 buildings
- engineering_letter: Structural engineer letter/calculations
- w9: W-9 tax form

COMMON REJECTION REASONS:
- Missing or expired contractor license
- Missing or expired COI
- NOA not provided for HVHZ zone
- Incomplete scope of work
- Missing owner signature
- Wrong permit application form
- Incorrect fee calculation
- Missing product approvals

Respond with valid JSON in this exact format:
{
  "completionPercentage": number (0-100),
  "packetReady": boolean,
  "missingFields": [
    { "field": "field_name", "reason": "why it's needed", "priority": "high" | "medium" | "low" }
  ],
  "missingDocuments": [
    { "docType": "document_type", "reason": "why it's needed", "priority": "high" | "medium" | "low" }
  ],
  "complianceIssues": [
    { "issue": "description", "regulation": "applicable code/rule", "severity": "critical" | "warning" | "info" }
  ],
  "estimatedFee": number,
  "suggestions": ["suggestion1", "suggestion2"],
  "readyForPayment": boolean
}`;

    const userPrompt = `Analyze this permit request for completeness and compliance:

PERMIT REQUEST:
${JSON.stringify(permitRequest, null, 2)}

UPLOADED DOCUMENTS:
${JSON.stringify(uploadedDocuments || [], null, 2)}

JURISDICTION RULES:
${JSON.stringify(jurisdictionRules, null, 2)}

Check all requirements, identify gaps, and calculate completion percentage.`;

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
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
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      result = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      result = {
        completionPercentage: 0,
        packetReady: false,
        missingFields: [],
        missingDocuments: [],
        complianceIssues: [{ issue: 'Unable to analyze', regulation: 'N/A', severity: 'warning' }],
        estimatedFee: jurisdictionRules?.base_price || 99,
        suggestions: ['Please provide complete permit information'],
        readyForPayment: false,
        rawResponse: content
      };
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Gap detector AI error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze permit';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
