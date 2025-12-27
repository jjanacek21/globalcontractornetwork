import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

interface VisionRequest {
  latitude: number;
  longitude: number;
  address: string;
  zoomLevel?: number;
  context?: 'coating' | 'roofing';
}

interface VisionEstimation {
  estimatedSqft: number;
  estimatedSqftLow: number;
  estimatedSqftHigh: number;
  confidence: 'high' | 'medium' | 'low';
  methodology: string;
  roofShape: string;
  roofComplexity: 'flat' | 'gable' | 'hip' | 'complex';
  satelliteImageUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, address, zoomLevel = 19, context = 'roofing' } = await req.json() as VisionRequest;
    
    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ 
        error: 'Latitude and longitude are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Use dynamic zoom level (18, 19, or 20) - default to 19
    const zoom = Math.min(Math.max(zoomLevel, 18), 20);
    const satelliteImageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${longitude},${latitude},${zoom},0/800x800@2x?access_token=${MAPBOX_TOKEN}`;

    console.log('Analyzing roof at:', address);
    console.log('Zoom level:', zoom, 'Context:', context);

    const systemPrompt = `You are an expert aerial roof measurement analyst with extensive experience in roofing estimation.
Your task is to analyze satellite imagery and accurately estimate the FLAT FOOTPRINT area of the building at the center of the image.

CRITICAL SHADOW & TREE HANDLING:
- Shadows and tree coverage OFTEN obscure significant portions of roofs - this is VERY common
- You MUST estimate the FULL building footprint by mentally extending through shadowed areas
- Look for building corners, edges, walls, and structure patterns to estimate obscured portions
- A building with shadow covering 30-50% of it still has the same footprint - estimate the COMPLETE outline
- Trees hanging over roof edges should be IGNORED - estimate the actual building outline beneath
- NEVER reduce your estimate because part of the roof is in shadow
- Trace the building outline by looking for visible corners and extending through shadows

MEASUREMENT METHODOLOGY:
1. Identify the main building structure at the CENTER of the image
2. Trace the COMPLETE roof outline, accounting for any shadowed or obscured portions
3. Look for:
   - Visible building corners (extend through shadows to find hidden corners)
   - Wall edges visible at ground level
   - Roof edges that peek out from shadows or tree coverage
   - The overall building shape pattern
4. Calculate the FLAT FOOTPRINT area only - DO NOT apply any pitch factor
5. For scale reference:
   - A typical car is about 15ft long
   - A typical residential lot is 50-100ft wide
   - Single family homes typically have 1,500-3,500 sq ft footprint
   - Commercial buildings can be much larger

ROOF COMPLEXITY DETECTION (choose one):
- "flat": Commercial-style flat roof or very low slope (common on commercial buildings)
- "gable": Simple 2-sided roof with a ridge down the middle (most common residential)
- "hip": 4-sided roof with hips and valleys meeting at corners (slightly more complex)
- "complex": Multiple facets, dormers, different roof sections, multiple ridges (most complex)

CONFIDENCE LEVELS:
- HIGH: Clear image, simple shape, you can see most corners even if some shadow
- MEDIUM: Moderate shadow/tree coverage but you can estimate the full outline reasonably
- LOW: Heavy obstruction but you're still making your best estimate of the full footprint

IMPORTANT OUTPUT RULES:
- Return ONLY the flat footprint area in estimatedSqft - NO pitch factor applied
- The frontend will apply appropriate pitch and waste factors based on context
- Always provide your best estimate even if visibility isn't perfect
- If in doubt, estimate LARGER rather than smaller (shadows often hide roof area)

Respond ONLY with valid JSON in this exact format:
{
  "estimatedSqft": number (your best single estimate of FLAT footprint),
  "estimatedSqftLow": number (conservative low bound, about 10% below estimate),
  "estimatedSqftHigh": number (high bound, about 10% above estimate),
  "confidence": "high" | "medium" | "low",
  "roofShape": "rectangular" | "L-shaped" | "T-shaped" | "complex" | "hip" | "gable" | "flat",
  "roofComplexity": "flat" | "gable" | "hip" | "complex",
  "methodology": "brief 1-2 sentence explanation of how you estimated, mention if you extended through shadows"
}`;

    const userPrompt = `Analyze this satellite image and estimate the FLAT FOOTPRINT area for the property located at: ${address}

The property is centered in the image. Zoom level is ${zoom} (${zoom === 18 ? 'wide view for tree coverage' : zoom === 20 ? 'close-up detail' : 'standard view'}).

Please:
1. Identify the main building structure at the center
2. Trace the COMPLETE building outline, extending through any shadows or tree coverage
3. Estimate the FLAT FOOTPRINT area in square feet (do NOT apply pitch factor)
4. Determine the roof complexity (flat, gable, hip, or complex)
5. Provide your confidence level based on visibility

REMEMBER: If shadows cover parts of the roof, estimate the FULL building footprint anyway by tracing through the shadows.`;

    console.log('Calling Gemini Vision for roof analysis...');
    
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
                image_url: { url: satelliteImageUrl } 
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

    console.log('AI Vision Response:', aiResponse);

    let estimation: VisionEstimation;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        estimation = {
          ...parsed,
          roofComplexity: parsed.roofComplexity || 'gable',
          satelliteImageUrl
        };
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      estimation = {
        estimatedSqft: 2500,
        estimatedSqftLow: 2250,
        estimatedSqftHigh: 2750,
        confidence: 'low',
        roofShape: 'unknown',
        roofComplexity: 'gable',
        methodology: 'Could not analyze image clearly. Using average residential estimate.',
        satelliteImageUrl
      };
    }

    // Sanity check - if estimate seems too low, flag it
    if (estimation.estimatedSqft < 800) {
      console.warn('Very low estimate detected, may have missed shadowed areas');
      estimation.confidence = 'low';
      estimation.methodology += ' (Note: Estimate may be low due to shadow/tree coverage)';
    }

    if (estimation.estimatedSqft > 50000) {
      console.warn('Unusually high estimate detected');
      estimation.confidence = 'low';
    }

    return new Response(JSON.stringify({
      success: true,
      estimation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in roof-vision-ai:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
