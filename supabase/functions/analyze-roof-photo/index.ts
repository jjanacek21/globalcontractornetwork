import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PhotoAnalysisRequest {
  photoUrl: string;
  address: string;
  normalizedAddress: string;
}

interface PhotoAnalysisResult {
  detectedColor: string;
  detectedMaterial: string;
  detectedCondition: string;
  estimatedAgeYears: number;
  ageConfidence: 'high' | 'medium' | 'low';
  damageIndicators: string[];
  recommendations: string[];
  analysisNotes: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photoUrl, address, normalizedAddress } = await req.json() as PhotoAnalysisRequest;
    
    if (!photoUrl) {
      return new Response(JSON.stringify({ 
        error: 'Photo URL is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing customer roof photo for:', address);

    const systemPrompt = `You are an expert roofing inspector analyzing customer-submitted photos of their roof.
Your task is to identify the roof material, color, condition, and estimate age based on visible wear patterns.

MATERIAL IDENTIFICATION:
- Asphalt Shingles (most common): 3-tab, architectural/dimensional, luxury/designer
- Metal Roofing: Standing seam, corrugated, metal tiles
- Tile: Concrete tile, clay tile, slate
- Flat Roof Materials: TPO (white), EPDM (black), Modified bitumen, Built-up roofing
- Wood: Cedar shakes, wood shingles

COLOR DETECTION:
Be specific about the color you see:
- Shingles: charcoal, black, weathered-wood, brown, tan, gray, slate-gray, red, green, blue
- Metal: galvanized silver, painted (specify color), rust-brown, copper
- Tile: terracotta, brown, gray, red, cream
- Flat: white, black, silver, tan

CONDITION ASSESSMENT:
- Excellent: Like new, no visible wear
- Good: Minor wear, still functional, 5+ years remaining life
- Fair: Visible wear, some granule loss, may need attention in 2-5 years
- Poor: Significant damage, curling, missing shingles, needs replacement soon
- Critical: Major damage, active leaks likely, immediate replacement needed

AGE ESTIMATION (from close-up photos):
Look for:
- Granule coverage (shingles): Full = new, sparse = old
- Color uniformity: Consistent = newer, faded/mottled = older
- Edge condition: Sharp = new, curled/cracked = old
- Surface texture: Smooth = new, rough/pitted = old
- Algae/moss: None = newer, heavy growth = older

DAMAGE INDICATORS to look for:
- Missing or broken shingles/tiles
- Curling or buckling
- Granule loss (bare spots on asphalt shingles)
- Cracking or splitting
- Rust (on metal roofs)
- Moss or algae growth
- Sagging areas
- Damaged flashing
- Exposed nail heads
- Storm damage (hail dents, wind lift)

Respond ONLY with valid JSON in this exact format:
{
  "detectedColor": "specific color name",
  "detectedMaterial": "specific material type",
  "detectedCondition": "excellent" | "good" | "fair" | "poor" | "critical",
  "estimatedAgeYears": number (best estimate),
  "ageConfidence": "high" | "medium" | "low",
  "damageIndicators": ["list", "of", "visible", "issues"],
  "recommendations": ["suggested", "actions", "or", "repairs"],
  "analysisNotes": "Detailed explanation of what you observed"
}`;

    const userPrompt = `Analyze this customer-submitted roof photo for the property at: ${address}

Please carefully examine this photo and determine:
1. The roofing material type (be specific - e.g., "architectural asphalt shingles" not just "shingles")
2. The exact color of the roof
3. The overall condition (excellent/good/fair/poor/critical)
4. Estimated age based on wear patterns visible in the photo
5. Any damage indicators you can see
6. Recommendations for the homeowner

Be thorough but honest - if the photo quality makes it difficult to assess certain aspects, note that in your analysis.`;

    console.log('Calling Gemini Vision for photo analysis...');
    
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
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              { 
                type: 'image_url', 
                image_url: { url: photoUrl } 
              }
            ]
          }
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
        return new Response(JSON.stringify({ error: 'AI service credits exhausted. Please try again later.' }), {
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

    console.log('AI Photo Analysis Response:', aiResponse);

    let analysis: PhotoAnalysisResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = {
        detectedColor: 'unknown',
        detectedMaterial: 'asphalt shingles',
        detectedCondition: 'fair',
        estimatedAgeYears: 10,
        ageConfidence: 'low',
        damageIndicators: [],
        recommendations: ['Schedule professional inspection for accurate assessment'],
        analysisNotes: 'Could not fully analyze photo. Please ensure good lighting and clear view of roof.'
      };
    }

    return new Response(JSON.stringify({
      success: true,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-roof-photo:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
