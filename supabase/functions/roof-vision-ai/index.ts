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
  // Mixed roof detection
  hasMixedRoof?: boolean;
  shingleSection?: {
    sqft: number;
    color: string;
  };
  flatSection?: {
    sqft: number;
    color: string;
  };
  // Roof age estimation
  estimatedAgeYears?: number;
  ageConfidence?: 'high' | 'medium' | 'low';
  degradationNotes?: string;
  // Primary roof color
  primaryRoofColor?: string;
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

CRITICAL GEOMETRY RULES FOR SHADOW RECONSTRUCTION:
- Residential buildings are ALWAYS rectangular or composed of rectangles joined together
- Houses DO NOT have irregular, organic shapes - they have 90-degree right angles
- When shadows obscure a corner: assume walls continue in STRAIGHT LINES from visible edges
- If you see 3 corners of a rectangle, the 4th corner is where the two visible edges would meet at 90°
- L-shaped homes = two rectangles joined at right angles
- T-shaped homes = rectangle with perpendicular extension
- U-shaped homes = three rectangles forming a U pattern

SHADOW RECONSTRUCTION METHOD:
1. Find all visible corners and edges of the main building
2. Extend visible edges as STRAIGHT LINES through shadowed areas
3. Where extended lines meet at 90° angles = hidden corners
4. Calculate area of complete geometric shapes
5. DO NOT follow shadow outlines - shadows distort true building edges

TREE COVERAGE HANDLING:
- Trees overhanging roofs hide significant area
- Look for roof edges visible beyond tree canopy
- Estimate what's beneath based on visible building geometry
- RULE: If trees cover ANY part of roof, add 15-25% to visible estimate

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

ROOF COMPLEXITY DETECTION (Critical for pricing):
- "flat": Commercial-style flat roof, very low slope (common on commercial buildings)
- "gable": Simple 2-sided roof with a single ridge (most common residential - DEFAULT if unsure)
- "hip": 4-sided roof with hips meeting at corners, slopes on all 4 sides
- "complex": Multiple facets, dormers, different sections, multiple ridges, valleys

MIXED ROOF TYPE DETECTION (Critical for Florida homes):
Many Florida homes have BOTH pitched shingle sections AND flat sections. Common patterns:
- Main house with shingle roof + flat-roofed addition/carport/lanai
- Two-story with shingle + flat section over garage
- Ranch home with shingle + flat lanai/patio cover
- Commercial-residential hybrid buildings

If you detect BOTH roof types on the same building:
1. Estimate each section separately
2. Note the approximate color of each section:
   - Shingle colors: gray, black, brown, tan, red, blue, green, weathered-gray
   - Flat roof colors: white (reflective coating), black (tar/rubber), silver (metal), tan

ROOF COLOR DETECTION:
- Shingle roofs: Look at the dominant color visible from satellite
- Flat roofs: White = likely coated/reflective, Black = tar/EPDM rubber, Silver = metal
- Color affects coating/replacement recommendations

ROOF AGE ESTIMATION (From satellite imagery):
Analyze shingle degradation patterns to estimate roof age:

NEW (0-5 years):
- Uniform dark color
- Sharp, well-defined edges on shingles
- No visible streaking or discoloration
- Consistent texture across entire roof

MODERATE WEAR (5-12 years):
- Some color fading, especially on south-facing slopes
- Early signs of dark streaking (algae)
- Minor granule loss visible as lighter patches
- Still relatively uniform appearance

SIGNIFICANT WEAR (12-20 years):
- Obvious color inconsistency across roof
- Heavy dark streaking (algae/moss growth)
- Visible granule loss creating mottled appearance
- Curling edges visible on some shingles
- Possible moss growth in shaded areas

END OF LIFE (20+ years):
- Severe discoloration and weathering
- Large patches of missing granules
- Visible sagging or warping
- Multiple patched areas
- Very faded, almost gray appearance regardless of original color

IMPORTANT: The frontend will apply these adjustments to your flat footprint estimate:
- 1.1x multiplier for satellite angle correction (converting overhead view to true area)
- Additional complexity factor: +10% for gable, +15% for hip, +17% for complex roofs
So return ONLY the flat footprint - do NOT apply any pitch or slope factors yourself.

CONFIDENCE LEVELS:
- HIGH: Clear image, you can trace the entire outline, minimal shadow/tree interference
- MEDIUM: Some shadow/tree coverage but you can reasonably estimate the full outline
- LOW: Heavy obstruction, estimate is your best guess with significant correction applied

Respond ONLY with valid JSON in this exact format:
{
  "estimatedSqft": number (your best estimate of FLAT footprint - err on the high side),
  "estimatedSqftLow": number (absolute minimum, still accounting for shadows),
  "estimatedSqftHigh": number (if all hidden area is larger than expected),
  "confidence": "high" | "medium" | "low",
  "roofShape": "rectangular" | "L-shaped" | "T-shaped" | "complex" | "hip" | "gable" | "flat",
  "roofComplexity": "flat" | "gable" | "hip" | "complex",
  "hasMixedRoof": boolean (true if both shingle and flat sections detected),
  "shingleSection": { "sqft": number, "color": "gray" | "black" | "brown" | "tan" | "red" | "weathered-gray" | "other" } | null,
  "flatSection": { "sqft": number, "color": "white" | "black" | "silver" | "tan" } | null,
  "primaryRoofColor": "string describing dominant roof color",
  "estimatedAgeYears": number (best estimate of roof age in years),
  "ageConfidence": "high" | "medium" | "low",
  "degradationNotes": "Brief description of visible wear indicators",
  "methodology": "Brief explanation including any shadow/tree correction and age assessment reasoning"
}`;

    const userPrompt = `Analyze this satellite image and estimate the FLAT FOOTPRINT area for the property located at: ${address}

The property is centered in the image. Zoom level is ${zoom} (${zoom === 18 ? 'wide view for tree coverage' : zoom === 20 ? 'close-up detail' : 'standard view'}).

Please:
1. Identify the main building structure at the center
2. Trace the COMPLETE building outline, extending through any shadows or tree coverage
3. Estimate the FLAT FOOTPRINT area in square feet (do NOT apply pitch factor)
4. Determine the roof complexity (flat, gable, hip, or complex)
5. Check if this is a MIXED ROOF (both shingle pitched sections AND flat sections)
6. If mixed roof detected, estimate each section's square footage and color separately
7. Detect the primary roof color(s) visible from satellite
8. ESTIMATE THE ROOF AGE based on shingle degradation patterns:
   - Look for color fading, streaking, granule loss, moss/algae growth
   - Check for curling, warping, or patched areas
   - Consider the uniformity of the roof surface
9. Provide your confidence level based on visibility

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
          hasMixedRoof: parsed.hasMixedRoof || false,
          shingleSection: parsed.shingleSection || null,
          flatSection: parsed.flatSection || null,
          primaryRoofColor: parsed.primaryRoofColor || 'unknown',
          estimatedAgeYears: parsed.estimatedAgeYears || null,
          ageConfidence: parsed.ageConfidence || 'low',
          degradationNotes: parsed.degradationNotes || null,
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
        hasMixedRoof: false,
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
