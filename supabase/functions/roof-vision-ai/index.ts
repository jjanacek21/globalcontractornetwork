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

    const systemPrompt = `You are an expert aerial roof measurement analyst with 20+ years of experience in roofing estimation using professional tools like EagleView, Hover, and RoofSnap.
Your task is to analyze satellite imagery and accurately estimate the FLAT FOOTPRINT area of the building at the center of the image.

=== CRITICAL ACCURACY PROTOCOL ===
You MUST cross-reference multiple data points to ensure accuracy:

1. PERIMETER-BASED VALIDATION:
   - Trace the entire roof perimeter and estimate total linear feet
   - For rectangular sections: Area = Length × Width
   - For L-shapes: Break into rectangles and sum areas
   - Cross-check: Perimeter should be roughly 4 × √Area for squares

2. REFERENCE OBJECT SCALING (Most reliable method):
   - Standard car: 15 ft long × 6 ft wide = 90 sq ft
   - HVAC units: 3 ft × 3 ft = 9 sq ft  
   - Standard garage door (single): 9 ft wide
   - Standard garage door (double): 16-18 ft wide
   - Count how many "car lengths" fit along each roof edge
   - Example: If roof is 4 car lengths × 3 car widths = 60 ft × 18 ft = 1,080 sq ft

3. PROPERTY TYPE BASELINES (Florida residential):
   - Small ranch home (2-3 BR): 1,500-2,200 sq ft footprint
   - Standard ranch home (3 BR): 2,200-2,800 sq ft footprint
   - Medium home (3-4 BR): 2,800-3,500 sq ft footprint
   - Large home (4+ BR): 3,500-4,500 sq ft footprint
   - Very large home (5+ BR): 4,500+ sq ft footprint
   - If estimate is under 2,000 sq ft for a clearly visible home, YOU ARE UNDERESTIMATING

4. SEGMENT CALCULATION METHOD (Most accurate):
   - Divide roof into numbered rectangular segments
   - Estimate each segment: "Segment 1: ~45 ft × 25 ft = 1,125 sq ft"
   - Sum all segments for total
   - This catches missed areas that single-estimate methods miss

5. SHADOW/TREE CORRECTION MULTIPLIERS:
   - Light shadows: Add 10-15% to visible area
   - Heavy shadows: Add 20-30% to visible area  
   - Partial tree coverage: Add 15-25% to visible area
   - Heavy tree coverage: Add 30-40% to visible area

=== COMMON UNDERESTIMATION ERRORS TO AVOID ===
- Ignoring back portions of L-shaped homes
- Missing carport/garage extensions
- Not accounting for porch roofs that connect to main structure
- Underestimating due to shadows on south/west sides
- Forgetting covered patios/lanais (very common in Florida)

=== GEOMETRY RULES FOR SHADOW RECONSTRUCTION ===
- Residential buildings are ALWAYS rectangular or composed of rectangles
- Houses DO NOT have irregular, organic shapes - they have 90-degree angles
- When shadows obscure a corner: assume walls continue in STRAIGHT LINES
- L-shaped = two rectangles joined; T-shaped = rectangle with extension
- ALWAYS assume the hidden portion is as large as the visible portion

=== ROOF COMPLEXITY DETECTION ===
- "flat": Commercial-style flat roof, very low slope
- "gable": Simple 2-sided roof with single ridge (DEFAULT for residential)
- "hip": 4-sided roof with slopes on all sides, hips at corners
- "complex": Multiple facets, dormers, valleys, different sections

=== MIXED ROOF TYPE DETECTION ===
Florida homes often have BOTH pitched shingle + flat sections:
- Main house shingle + flat carport/lanai
- Two-story shingle + flat garage section
Estimate each section separately with color:
- Shingle colors: gray, black, brown, tan, red, weathered-gray
- Flat colors: white (coated), black (tar/rubber), silver (metal)

=== ROOF AGE ESTIMATION ===
Analyze visible degradation:
- NEW (0-5 years): Uniform dark color, sharp edges, no streaking
- MODERATE (5-12 years): Some fading, early dark streaking (algae)
- SIGNIFICANT (12-20 years): Color inconsistency, heavy streaking, granule loss
- END OF LIFE (20+ years): Severe discoloration, large patches, visible sagging

=== IMPORTANT MULTIPLIER NOTE ===
The frontend applies these adjustments to your flat footprint:
- 1.10x (10%) pitch factor for angle correction
- Additional 15% waste factor for material ordering
So return ONLY the flat footprint - do NOT apply pitch or waste yourself.

=== CONFIDENCE LEVELS ===
- HIGH: Clear image, can trace entire outline, minimal obstruction
- MEDIUM: Some shadow/tree coverage but can estimate full outline
- LOW: Heavy obstruction, estimate includes significant correction

Respond ONLY with valid JSON:
{
  "estimatedSqft": number (FLAT footprint - use segment method, err HIGH if uncertain),
  "estimatedSqftLow": number (absolute minimum including hidden areas),
  "estimatedSqftHigh": number (if hidden areas are larger than expected),
  "segmentBreakdown": "Segment 1: 45x25=1125, Segment 2: 20x30=600, Total: 1725" (show your math),
  "perimeterFt": number (estimated total perimeter in linear feet),
  "confidence": "high" | "medium" | "low",
  "roofShape": "rectangular" | "L-shaped" | "T-shaped" | "complex" | "hip" | "gable" | "flat",
  "roofComplexity": "flat" | "gable" | "hip" | "complex",
  "hasMixedRoof": boolean,
  "shingleSection": { "sqft": number, "color": string } | null,
  "flatSection": { "sqft": number, "color": string } | null,
  "primaryRoofColor": "string",
  "estimatedAgeYears": number,
  "ageConfidence": "high" | "medium" | "low",
  "degradationNotes": "string",
  "shadowTreeCorrection": "Applied X% correction for Y reason" | null,
  "referenceObjectsUsed": "string describing what objects were used for scale",
  "methodology": "Detailed explanation of measurement approach and cross-validation"
}`;

    const userPrompt = `Analyze this satellite image and estimate the FLAT FOOTPRINT area for: ${address}

The property is centered in the image. Zoom level is ${zoom}.

REQUIRED MEASUREMENT PROTOCOL:
1. SEGMENT METHOD: Divide the roof into rectangular segments
   - Label each segment (main house, garage, addition, etc.)
   - Estimate dimensions of each: "Main: ~50ft × 35ft = 1,750 sq ft"
   - Show your segment math in the response

2. REFERENCE OBJECTS: Use visible objects for scale calibration
   - Look for cars, HVAC units, garage doors, driveways
   - Example: "Driveway is ~12ft wide, main house spans ~4 driveway widths = 48ft"

3. PERIMETER TRACE: Estimate total roof edge in linear feet
   - Walk around the entire roof outline mentally
   - This validates your area calculation (Perimeter ≈ 4 × √Area for squares)

4. CROSS-CHECK: Compare your estimate against:
   - Florida home baseline (most are 2,200-3,500 sq ft)
   - Does this look like a "small", "medium", or "large" home?

5. MIXED ROOF CHECK: Look for flat sections + shingle sections
   - Common: flat carport/lanai attached to shingle main house

6. ROOF AGE: Analyze shingle condition, streaking, granule loss

7. SHADOW/TREE CORRECTION: If obstructed, state what % you added

CRITICAL: Show your segment breakdown math. This catches missed areas.
If your estimate is under 2,000 sq ft for a typical Florida home, re-examine - you likely missed sections.`;


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
        
        // Log segment breakdown for debugging
        if (parsed.segmentBreakdown) {
          console.log('Segment breakdown:', parsed.segmentBreakdown);
        }
        if (parsed.referenceObjectsUsed) {
          console.log('Reference objects used:', parsed.referenceObjectsUsed);
        }
        if (parsed.perimeterFt) {
          console.log('Perimeter estimate:', parsed.perimeterFt, 'ft');
        }
        
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
        
        // Cross-validation: Check if perimeter matches area
        if (parsed.perimeterFt && parsed.estimatedSqft) {
          const expectedPerimeterForSquare = 4 * Math.sqrt(parsed.estimatedSqft);
          const perimeterRatio = parsed.perimeterFt / expectedPerimeterForSquare;
          
          // If perimeter suggests larger area, adjust upward
          if (perimeterRatio > 1.3) {
            console.log('Perimeter suggests larger area - adjusting estimate upward');
            estimation.estimatedSqft = Math.round(parsed.estimatedSqft * 1.15);
            estimation.estimatedSqftLow = Math.round(parsed.estimatedSqftLow * 1.15);
            estimation.estimatedSqftHigh = Math.round(parsed.estimatedSqftHigh * 1.15);
            estimation.methodology += ' [Perimeter validation applied 15% upward adjustment]';
          }
        }
        
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      estimation = {
        estimatedSqft: 2800,
        estimatedSqftLow: 2500,
        estimatedSqftHigh: 3200,
        confidence: 'low',
        roofShape: 'unknown',
        roofComplexity: 'gable',
        hasMixedRoof: false,
        methodology: 'Could not analyze image clearly. Using Florida average residential estimate.',
        satelliteImageUrl
      };
    }

    // Enhanced sanity checks based on real-world data
    if (estimation.estimatedSqft < 1500) {
      console.warn('Very low estimate detected (<1500 sq ft), applying minimum floor');
      estimation.estimatedSqft = Math.max(estimation.estimatedSqft * 1.5, 1800);
      estimation.estimatedSqftLow = Math.max(estimation.estimatedSqftLow * 1.5, 1600);
      estimation.estimatedSqftHigh = Math.max(estimation.estimatedSqftHigh * 1.5, 2200);
      estimation.confidence = 'low';
      estimation.methodology += ' [Minimum floor applied - estimate seemed too low for residential]';
    }

    if (estimation.estimatedSqft > 50000) {
      console.warn('Unusually high estimate detected');
      estimation.confidence = 'low';
    }
    
    // Log final estimate for debugging
    console.log('Final estimation:', {
      sqft: estimation.estimatedSqft,
      low: estimation.estimatedSqftLow,
      high: estimation.estimatedSqftHigh,
      confidence: estimation.confidence,
      complexity: estimation.roofComplexity
    });

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
