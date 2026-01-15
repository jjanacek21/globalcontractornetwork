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
    const { permitRequest, documents, jurisdictionRules } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert permit packet assembler for Florida building permits. Your job is to:
1. Generate a professional cover sheet summarizing the permit application
2. Create a document index listing all included documents
3. Generate any standard forms that can be auto-filled
4. Provide submission notes for the expediter

COVER SHEET FORMAT:
The cover sheet should include:
- Property address
- Owner information
- Contractor information (name, license, contact)
- Permit type and scope summary
- Valuation
- Key dates
- Document checklist

COMMON FORMS TO GENERATE:
- Owner Authorization Letter (simple template)
- Scope of Work Summary
- Contractor Statement of Compliance

Respond with valid JSON:
{
  "coverSheet": {
    "title": "Permit Application Cover Sheet",
    "html": "<html content for cover sheet>",
    "sections": [
      { "title": "section name", "content": "section content" }
    ]
  },
  "documentIndex": [
    { "number": 1, "name": "Cover Sheet", "pages": "1-2" },
    { "number": 2, "name": "Document Name", "pages": "3" }
  ],
  "generatedForms": [
    {
      "formType": "owner_authorization",
      "title": "Owner Authorization Letter",
      "html": "<html content>",
      "needsSignature": true
    }
  ],
  "submissionNotes": [
    "Note for expediter about submission"
  ],
  "packetSummary": "Brief summary of the complete packet"
}`;

    const userPrompt = `Generate a permit packet for this application:

PERMIT REQUEST:
${JSON.stringify(permitRequest, null, 2)}

UPLOADED DOCUMENTS:
${JSON.stringify(documents || [], null, 2)}

JURISDICTION:
${JSON.stringify(jurisdictionRules, null, 2)}

Create a professional cover sheet, document index, and any forms that can be auto-generated.`;

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
        temperature: 0.3,
        max_tokens: 4000,
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

    let result;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      result = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      result = {
        coverSheet: {
          title: 'Permit Application',
          html: `<h1>Permit Application</h1><p>${permitRequest.property_address || 'Address pending'}</p>`,
          sections: []
        },
        documentIndex: [],
        generatedForms: [],
        submissionNotes: ['Please review packet manually'],
        packetSummary: 'Packet generation incomplete - manual review required',
        rawResponse: content
      };
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Packet generator AI error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate packet';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
