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

    const systemPrompt = `You are an expert aerial roof measurement analyst. Your task is to analyze satellite imagery and accurately estimate the FLAT FOOTPRINT area of the building at the center of the image.

=== CRITICAL: DO NOT OVERESTIMATE ===
Historical data shows AI tends to OVERESTIMATE by 30-80%. Be conservative and precise.
When in doubt, use the LOWER reasonable estimate, not higher.

=== MAPBOX SATELLITE SCALE CALIBRATION ===
At zoom level 19, the image shows approximately:
- 1200x1200 pixel image at 2x = ~150-200 meters across (~500-650 feet)
- Each pixel represents approximately 0.4-0.5 feet
- A standard parking space (9x18 ft) = approximately 18x36 pixels
- A standard car (6x15 ft) = approximately 12x30 pixels

=== MEASUREMENT PROTOCOL ===

1. IDENTIFY BUILDING TYPE FIRST:
   - COMMERCIAL (flat roof, simple rectangle): Use precise edge-to-edge measurement
   - RESIDENTIAL (pitched roof): May need shadow/tree corrections

2. FOR COMMERCIAL FLAT ROOFS (like shopping centers, warehouses):
   - These are SIMPLE RECTANGLES - trace the actual visible edges
   - Flat white/gray roofs have CLEARLY VISIBLE EDGES
   - DO NOT add shadow corrections - flat roofs show their true footprint
   - DO NOT apply residential baseline minimums
   - Estimate: Length × Width, that's it

3. PIXEL-TO-FEET CALIBRATION (MOST IMPORTANT):
   - At zoom 19, estimate the building dimensions in pixels first
   - Then convert: pixels × 0.45 = approximate feet
   - Example: Building appears 400 pixels wide × 150 pixels deep
   - Calculation: (400 × 0.45) × (150 × 0.45) = 180 ft × 67.5 ft = 12,150 sq ft

4. REFERENCE OBJECTS (secondary validation):
   - Standard car: ~15 ft long × 6 ft wide
   - Parking space: ~9 ft wide × 18 ft long
   - Standard lane width: ~10-12 ft
   - Count how many cars/spaces fit along the building edge

5. FOR RESIDENTIAL PITCHED ROOFS:
   - Florida ranch home (3 BR): 1,800-2,500 sq ft typical
   - Medium home (3-4 BR): 2,500-3,500 sq ft typical
   - Large home (4+ BR): 3,500-4,500 sq ft typical
   - These have shadows/trees - modest corrections may apply (10-20% max)

=== GEOMETRY RULES ===
- Trace ONLY the actual roof edges you can see
- For flat commercial roofs: What you see IS the footprint
- For pitched residential: Footprint ≈ visible satellite outline
- DO NOT assume hidden sections unless evidence supports it

=== CONFIDENCE LEVELS ===
- HIGH: Clear edges visible, simple geometry, no obstruction
- MEDIUM: Some shadow/tree but can estimate reasonably
- LOW: Heavy obstruction, significant guessing required

=== RESPOND WITH VALID JSON ONLY ===
{
  "estimatedSqft": number (FLAT footprint - be precise, not inflated),
  "estimatedSqftLow": number (conservative minimum),
  "estimatedSqftHigh": number (reasonable maximum),
  "buildingType": "commercial" | "residential",
  "segmentBreakdown": "Main section: 180ft × 90ft = 16,200 sq ft" (show your math),
  "pixelEstimate": "Building appears ~400px × 200px at zoom 19",
  "confidence": "high" | "medium" | "low",
  "roofShape": "rectangular" | "L-shaped" | "T-shaped" | "complex",
  "roofComplexity": "flat" | "gable" | "hip" | "complex",
  "primaryRoofColor": "string",
  "estimatedAgeYears": number | null,
  "ageConfidence": "high" | "medium" | "low",
  "degradationNotes": "string" | null,
  "referenceObjectsUsed": "string describing scale references",
  "methodology": "Detailed explanation"
}`;

    const userPrompt = `Analyze this satellite image and estimate the FLAT FOOTPRINT area for: ${address}

The property is centered in the image. Zoom level is ${zoom}.

STEP 1: IDENTIFY BUILDING TYPE
- Is this a COMMERCIAL building (flat roof, simple rectangle)? 
- Or RESIDENTIAL (pitched roof with shingles)?

STEP 2: PIXEL MEASUREMENT (PRIMARY METHOD)
- At zoom ${zoom}, estimate building dimensions in pixels
- Convert: pixels × 0.45 ≈ feet at zoom 19 (adjust for zoom: 18=0.9, 20=0.22)
- Example: 350px × 180px → 157ft × 81ft = 12,717 sq ft

STEP 3: REFERENCE OBJECT VALIDATION
- Count parking spaces or cars along building edges for scale check
- A car is ~15ft long, parking space ~18ft long

STEP 4: CALCULATE AREA
- For simple rectangles: Length × Width
- For L-shapes: Sum of rectangular segments
- Show your math clearly

CRITICAL WARNINGS:
- DO NOT inflate estimates - historical AI estimates are 30-80% too high
- For FLAT commercial roofs: The visible outline IS the true footprint
- Do NOT add shadow corrections for flat roofs with clear edges
- When uncertain, choose the LOWER reasonable number

Return precise JSON with your segmentBreakdown showing the calculation.`;


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
        if (parsed.pixelEstimate) {
          console.log('Pixel estimate:', parsed.pixelEstimate);
        }
        if (parsed.referenceObjectsUsed) {
          console.log('Reference objects used:', parsed.referenceObjectsUsed);
        }
        if (parsed.buildingType) {
          console.log('Building type:', parsed.buildingType);
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
        
        // For commercial flat roofs, do NOT apply any upward adjustments
        // The visible outline IS the true footprint
        if (parsed.buildingType === 'commercial' || parsed.roofComplexity === 'flat') {
          console.log('Commercial/flat roof detected - using precise measurement without adjustments');
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

    // Sanity checks - but only for residential properties
    // Commercial properties can legitimately be under 1500 sq ft or over 50000 sq ft
    const isCommercial = estimation.roofComplexity === 'flat' || 
                         (estimation as any).buildingType === 'commercial';
    
    if (!isCommercial && estimation.estimatedSqft < 1200) {
      console.warn('Very low residential estimate detected (<1200 sq ft), applying minimum floor');
      estimation.estimatedSqft = Math.max(estimation.estimatedSqft, 1500);
      estimation.estimatedSqftLow = Math.max(estimation.estimatedSqftLow, 1300);
      estimation.estimatedSqftHigh = Math.max(estimation.estimatedSqftHigh, 1800);
      estimation.confidence = 'low';
      estimation.methodology += ' [Minimum floor applied for residential]';
    }

    if (estimation.estimatedSqft > 100000) {
      console.warn('Unusually high estimate detected (>100k sq ft)');
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
