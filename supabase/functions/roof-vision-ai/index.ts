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
}

interface VisionEstimation {
  estimatedSqft: number;
  estimatedSqftLow: number;
  estimatedSqftHigh: number;
  confidence: 'high' | 'medium' | 'low';
  methodology: string;
  roofShape: string;
  satelliteImageUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, address } = await req.json() as VisionRequest;
    
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

    // Get high-resolution satellite image from Mapbox Static API
    // Using zoom 19 for detailed roof visibility, 800x800 image
    const satelliteImageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${longitude},${latitude},19,0/800x800@2x?access_token=${MAPBOX_TOKEN}`;

    console.log('Fetching satellite image for:', address);
    console.log('Image URL:', satelliteImageUrl);

    // Create the vision analysis prompt
    const systemPrompt = `You are an expert aerial roof measurement analyst with extensive experience in roofing estimation. 
Your task is to analyze satellite imagery and accurately estimate the roof area of the property at the center of the image.

ANALYSIS METHODOLOGY:
1. Identify the main building structure at the center of the image
2. Trace the roof outline carefully, identifying:
   - The overall roof shape (rectangular, L-shaped, T-shaped, complex, etc.)
   - Approximate dimensions in feet (estimate based on typical residential scales)
   - Any extensions, garages, or attached structures
3. Calculate the roof footprint area
4. Account for roof pitch (most residential roofs have 4/12 to 8/12 pitch, add 5-20% for pitch factor)

ESTIMATION GUIDELINES:
- For rectangular/square roofs: Length × Width
- For L-shaped roofs: Break into rectangles and sum
- For complex roofs: Break into component shapes
- Add 10-15% for typical residential roof pitch
- A typical car is about 15ft long, use for scale reference if visible
- A typical residential lot is 50-100ft wide
- Single family homes typically have 1,500-3,500 sq ft of roof area

CONFIDENCE LEVELS:
- HIGH: Clear image, simple roof shape, obvious boundaries
- MEDIUM: Partially obscured, moderate complexity, or some uncertainty
- LOW: Tree coverage, shadows, complex architecture, or unclear boundaries

IMPORTANT: Always provide reasonable estimates even if conditions aren't perfect. Roofs under 1,000 sq ft are rare for homes. Most suburban homes have 1,800-3,000 sq ft roofs.

Respond ONLY with valid JSON in this exact format:
{
  "estimatedSqft": number (your best single estimate),
  "estimatedSqftLow": number (conservative low bound, about 10% below estimate),
  "estimatedSqftHigh": number (high bound, about 10% above estimate),
  "confidence": "high" | "medium" | "low",
  "roofShape": "rectangular" | "L-shaped" | "T-shaped" | "complex" | "hip" | "gable" | "flat",
  "methodology": "brief 1-2 sentence explanation of how you estimated"
}`;

    const userPrompt = `Analyze this satellite image and estimate the roof area for the property located at: ${address}

The property is centered in the image. Please:
1. Identify the main roof structure
2. Estimate its approximate dimensions
3. Calculate the total roof area in square feet
4. Provide your confidence level based on image clarity

Remember to account for roof pitch in your final estimate.`;

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

    // Parse the JSON response
    let estimation: VisionEstimation;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        estimation = {
          ...parsed,
          satelliteImageUrl
        };
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback - return a reasonable default with low confidence
      estimation = {
        estimatedSqft: 2000,
        estimatedSqftLow: 1800,
        estimatedSqftHigh: 2200,
        confidence: 'low',
        roofShape: 'unknown',
        methodology: 'Could not analyze image. Using average residential estimate.',
        satelliteImageUrl
      };
    }

    // Sanity check the values
    if (estimation.estimatedSqft < 500 || estimation.estimatedSqft > 50000) {
      console.warn('Unusual estimate detected, adjusting...');
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
