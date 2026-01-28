import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProjectAdvisorRequest {
  photoUrls: string[];
  projectType?: string;
  address?: string;
}

interface ProjectAnalysis {
  overallAssessment: {
    material: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    estimatedAge: number;
    ageConfidence: 'high' | 'medium' | 'low';
    primaryColor: string;
  };
  issuesDetected: Array<{
    issue: string;
    severity: 'minor' | 'moderate' | 'severe' | 'critical';
    location?: string;
    urgency: string;
  }>;
  scopeOfWork: Array<{
    task: string;
    priority: 'required' | 'recommended' | 'optional';
    estimatedCost?: string;
  }>;
  costEstimate: {
    low: number;
    high: number;
    breakdown?: string;
  };
  contractorTips: string[];
  codeCompliance: string[];
  timeline: string;
  urgencyLevel: 'routine' | 'soon' | 'urgent' | 'emergency';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photoUrls, projectType = 'roofing', address } = await req.json() as ProjectAdvisorRequest;
    
    if (!photoUrls || photoUrls.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'At least one photo URL is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Project advisor analyzing', photoUrls.length, 'photos for', projectType);

    const systemPrompt = `You are an expert home improvement project advisor specializing in Florida construction and building codes. 
Analyze the provided photos to give homeowners comprehensive guidance on their project.

Your analysis should be thorough yet practical, focusing on:

1. **CONDITION ASSESSMENT**
   - Identify the material type and current condition
   - Estimate age based on wear patterns
   - Note any visible damage or deterioration

2. **ISSUES DETECTION**
   Categorize issues by severity:
   - Minor: Cosmetic issues, normal wear
   - Moderate: Issues needing attention within 1-2 years
   - Severe: Issues requiring prompt attention
   - Critical: Safety hazards or active damage requiring immediate action

3. **SCOPE OF WORK**
   Provide realistic scope with priorities:
   - Required: Must-do items for safety/function
   - Recommended: Should-do items for longevity
   - Optional: Nice-to-have upgrades

4. **COST ESTIMATES**
   Provide Florida-typical price ranges based on what you see:
   - Roofing: $575-$1,850 per square (100 sq ft) depending on material
   - Consider complexity factors visible in photos

5. **CONTRACTOR SELECTION TIPS**
   Florida-specific guidance:
   - License verification (check DBPR)
   - Insurance requirements
   - Permit requirements
   - Questions to ask
   - Red flags to avoid

6. **CODE COMPLIANCE**
   Florida Building Code considerations:
   - HVHZ requirements if applicable (Miami-Dade, Broward)
   - Wind mitigation features
   - Permit requirements
   - NOA (Notice of Acceptance) for products

IMPORTANT:
- Be honest about limitations if photo quality is poor
- Always recommend professional inspection for final assessment
- Prices are estimates based on typical Florida market rates
- Emphasize licensed, insured contractors for safety

Respond with valid JSON in this format:
{
  "overallAssessment": {
    "material": "string",
    "condition": "excellent|good|fair|poor|critical",
    "estimatedAge": number,
    "ageConfidence": "high|medium|low",
    "primaryColor": "string"
  },
  "issuesDetected": [
    {
      "issue": "description",
      "severity": "minor|moderate|severe|critical",
      "location": "where visible",
      "urgency": "timeframe"
    }
  ],
  "scopeOfWork": [
    {
      "task": "description",
      "priority": "required|recommended|optional",
      "estimatedCost": "range or description"
    }
  ],
  "costEstimate": {
    "low": number,
    "high": number,
    "breakdown": "explanation"
  },
  "contractorTips": ["tip1", "tip2"],
  "codeCompliance": ["consideration1", "consideration2"],
  "timeline": "recommended timeline",
  "urgencyLevel": "routine|soon|urgent|emergency"
}`;

    // Build the content array with all photos
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { 
        type: 'text', 
        text: `Analyze these ${photoUrls.length} photo(s) of a ${projectType} project${address ? ` at ${address}` : ''} in Florida. Provide comprehensive assessment and recommendations.`
      }
    ];

    for (const url of photoUrls.slice(0, 5)) { // Limit to 5 photos
      content.push({
        type: 'image_url',
        image_url: { url }
      });
    }

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
          { role: 'user', content }
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
        return new Response(JSON.stringify({ error: 'AI service credits exhausted.' }), {
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
      throw new Error('No response from AI vision model');
    }

    console.log('Project advisor response received');

    let analysis: ProjectAnalysis;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Provide fallback analysis
      analysis = {
        overallAssessment: {
          material: 'Unable to determine',
          condition: 'fair',
          estimatedAge: 10,
          ageConfidence: 'low',
          primaryColor: 'unknown',
        },
        issuesDetected: [
          {
            issue: 'Unable to fully analyze photos - recommend professional inspection',
            severity: 'moderate',
            urgency: 'Schedule inspection within 30 days',
          }
        ],
        scopeOfWork: [
          {
            task: 'Professional roof inspection',
            priority: 'required',
            estimatedCost: '$150-$300',
          }
        ],
        costEstimate: {
          low: 0,
          high: 0,
          breakdown: 'Unable to estimate without proper analysis',
        },
        contractorTips: [
          'Get at least 3 quotes from licensed Florida contractors',
          'Verify license at myfloridalicense.com',
          'Request proof of insurance and workers comp',
          'Ask for references from recent local projects',
        ],
        codeCompliance: [
          'All roofing work in Florida requires permits',
          'Verify contractor will pull permits',
        ],
        timeline: 'Schedule professional inspection first',
        urgencyLevel: 'routine',
      };
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      photoCount: photoUrls.length,
      projectType,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in project-advisor-ai:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
