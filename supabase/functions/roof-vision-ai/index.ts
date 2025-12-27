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
    // Use higher resolution images (1200x1200) for better accuracy
    const zoom = Math.min(Math.max(zoomLevel, 18), 20);
    const satelliteImageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${longitude},${latitude},${zoom},0/1200x1200@2x?access_token=${MAPBOX_TOKEN}`;

    console.log('Analyzing roof at:', address);
    console.log('Zoom level:', zoom, 'Context:', context);

    const systemPrompt = `You are an expert aerial roof measurement analyst with 20+ years of experience in roofing estimation.
Your task is to analyze satellite imagery and accurately estimate the FLAT FOOTPRINT area of the building at the center of the image.

CRITICAL: MOST AI ESTIMATES ARE TOO LOW. You must account for shadows, trees, and obstructions that hide portions of the roof.

SHADOW & TREE HANDLING (VERY IMPORTANT):
- Shadows ALWAYS make roofs appear smaller than they are - this is the #1 source of underestimation
- When you see a shadow: mentally trace the building outline THROUGH the shadow to the corners
- Look for visible corners, then extend straight lines through shadowed areas to find hidden corners
- Trees overhanging roofs hide significant area - estimate what's beneath the tree canopy
- If shadow or trees cover ANY part of the building, your visible-only estimate is TOO LOW
- RULE: If you see shadows or tree coverage, add 20-40% to your visible estimate

MINIMUM SIZE GUIDELINES (Florida residential):
- Average single-family home: 2,000-3,500 sq ft footprint
- Small ranch homes: 1,500-2,000 sq ft minimum
- Multi-story homes appear smaller from above but still have 1,800+ sq ft footprint
- If your estimate is under 1,500 sq ft, you are likely missing hidden roof area
- Commercial buildings: typically 3,000-50,000+ sq ft

REFERENCE OBJECTS FOR SCALE:
- Standard car: ~15 ft long, ~6 ft wide (90 sq ft)
- HVAC unit: ~3 ft × 3 ft (9 sq ft)
- Skylight: ~2 ft × 4 ft (8 sq ft)
- Standard driveway width: ~10-12 ft
- Single garage door: ~9 ft wide
- Double garage door: ~16-18 ft wide

MEASUREMENT METHODOLOGY:
1. Find the main building structure at the CENTER of the image
2. Identify ALL visible corners of the building
3. For hidden corners (in shadow/under trees): extend visible edges to estimate full outline
4. Calculate the COMPLETE footprint including obscured portions
5. Apply shadow/tree correction if any obstruction is visible
6. Return FLAT FOOTPRINT only - NO pitch factor applied

ROOF COMPLEXITY DETECTION:
- "flat": Commercial-style flat roof, very low slope (common on commercial buildings)
- "gable": Simple 2-sided roof with a ridge (most common residential - default if unsure)
- "hip": 4-sided roof with hips meeting at corners
- "complex": Multiple facets, dormers, different sections, multiple ridges

CONFIDENCE LEVELS:
- HIGH: Clear image, you can trace the entire outline, minimal shadow/tree interference
- MEDIUM: Some shadow/tree coverage but you can reasonably estimate the full outline
- LOW: Heavy obstruction, estimate is your best guess with significant correction applied

IMPORTANT OUTPUT RULES:
- Return ONLY the flat footprint area in estimatedSqft - NO pitch factor
- When in doubt, estimate HIGHER not lower (shadows hide area, they don't add area)
- Your estimate should rarely be under 1,800 sq ft for a residential property

Respond ONLY with valid JSON in this exact format:
{
  "estimatedSqft": number (your best estimate of FLAT footprint - err on the high side),
  "estimatedSqftLow": number (absolute minimum, still accounting for shadows),
  "estimatedSqftHigh": number (if all hidden area is larger than expected),
  "confidence": "high" | "medium" | "low",
  "roofShape": "rectangular" | "L-shaped" | "T-shaped" | "complex" | "hip" | "gable" | "flat",
  "roofComplexity": "flat" | "gable" | "hip" | "complex",
  "methodology": "Brief explanation including any shadow/tree correction you applied"
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
