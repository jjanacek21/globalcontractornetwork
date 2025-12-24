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
    const { leadData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a lead scoring AI for a contractor services company. Analyze leads and provide actionable insights.

**Scoring Factors (0-100 total):**

1. **Urgency (0-25 points)**
   - Emergency/immediate need: 25 points
   - Within 1 month: 15 points
   - Within 3 months: 10 points
   - Just researching: 5 points

2. **Budget Fit (0-25 points)**
   - Clear budget matches service: 25 points
   - Reasonable expectations: 15 points
   - Unknown budget: 10 points
   - Budget concerns: 5 points

3. **Decision Authority (0-20 points)**
   - Sole decision maker: 20 points
   - With spouse/partner: 15 points
   - Needs approval: 10 points
   - Unclear: 5 points

4. **Project Scope (0-15 points)**
   - Large project ($10k+): 15 points
   - Medium project ($5-10k): 10 points
   - Small project (under $5k): 5 points

5. **Lead Source Quality (0-15 points)**
   - Referral: 15 points
   - Repeat customer: 15 points
   - Organic search: 10 points
   - Paid ads: 8 points
   - Cold lead: 5 points

**Score Interpretation:**
- 80-100: Hot lead - immediate follow-up
- 60-79: Warm lead - priority follow-up
- 40-59: Cool lead - nurture sequence
- 0-39: Cold lead - low priority

Return JSON:
{
  "score": number,
  "grade": "A|B|C|D|F",
  "category": "HOT|WARM|COOL|COLD",
  "breakdown": {
    "urgency": number,
    "budgetFit": number,
    "decisionAuthority": number,
    "projectScope": number,
    "sourceQuality": number
  },
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "recommendedAction": "what to do next",
  "followUpPriority": "immediate|same-day|next-day|this-week|nurture",
  "talkingPoints": ["point1", "point2"],
  "objectionHandlers": ["potential objection": "how to handle"]
}`;

    const userPrompt = `Score this lead:

Contact Information:
- Name: ${leadData.name || 'Unknown'}
- Phone: ${leadData.phone || 'Unknown'}
- Email: ${leadData.email || 'Unknown'}

Lead Source: ${leadData.source || 'Unknown'}
Service Interested: ${leadData.service || 'Unknown'}
Project Description: ${leadData.description || 'Not provided'}

Timeline: ${leadData.timeline || 'Unknown'}
Budget Range: ${leadData.budget || 'Unknown'}
Decision Maker: ${leadData.isDecisionMaker ? 'Yes' : 'Unknown'}

Property Details:
- Type: ${leadData.propertyType || 'Unknown'}
- Location: ${leadData.location || 'Unknown'}

Previous Interactions: ${leadData.previousInteractions || 'None'}
Notes: ${leadData.notes || 'None'}

Provide comprehensive lead scoring and recommendations.`;

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
    
    let scoring;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scoring = JSON.parse(jsonMatch[0]);
      }
    } catch {
      scoring = { rawResponse: content };
    }

    return new Response(JSON.stringify(scoring), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Lead scorer AI error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
