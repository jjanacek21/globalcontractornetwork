import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Florida-specific package pricing (per square = 100 sq ft)
const PACKAGE_PRICING = {
  shingle: {
    bronze: { name: "Bronze (Economy)", priceLow: 575, priceHigh: 650 },
    silver: { name: "Silver (Standard)", priceLow: 700, priceHigh: 725, popular: true },
    gold: { name: "Gold (Premium)", priceLow: 800, priceHigh: 850 },
  },
  metal: {
    blueCollar: { name: "Blue Collar (5V Crimp)", priceLow: 860, priceHigh: 860 },
    blueCollarPlus: { name: "Blue Collar+ (Kynar)", priceLow: 930, priceHigh: 930 },
    platinum: { name: "Platinum (Standing Seam)", priceLow: 1100, priceHigh: 1300, popular: true },
    ultimate: { name: "Ultimate (Premium Standing Seam)", priceLow: 1360, priceHigh: 1850 },
  },
  tile: {
    tile: { name: "Tile (Standard)", priceLow: 900, priceHigh: 1000 },
    tilePlus: { name: "Tile+ (Premium)", priceLow: 1100, priceHigh: 1300 },
  },
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AssistantRequest {
  messages: Message[];
  photoUrls?: string[];
  userId?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, photoUrls, userId } = await req.json() as AssistantRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Homeowner assistant request:', { messageCount: messages.length, hasPhotos: !!photoUrls?.length });

    // Define available tools
    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_roof_measurement',
          description: 'Get instant roof measurement from satellite imagery for a given address. Use this when the user asks about cost estimates and provides an address.',
          parameters: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'The full property address including city and state'
              }
            },
            required: ['address']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'calculate_roof_estimate',
          description: 'Calculate price ranges for different roof packages based on roof size in squares',
          parameters: {
            type: 'object',
            properties: {
              squares: {
                type: 'number',
                description: 'The roof size in squares (1 square = 100 sq ft)'
              },
              roofType: {
                type: 'string',
                enum: ['shingle', 'metal', 'tile', 'all'],
                description: 'The type of roofing material to quote'
              }
            },
            required: ['squares', 'roofType']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'analyze_project_photos',
          description: 'Analyze uploaded photos to assess roof condition, material, and provide recommendations',
          parameters: {
            type: 'object',
            properties: {
              photoUrls: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of photo URLs to analyze'
              },
              projectType: {
                type: 'string',
                description: 'Type of project (roofing, siding, windows, etc.)'
              }
            },
            required: ['photoUrls']
          }
        }
      }
    ];

    const systemPrompt = `You are a helpful AI assistant for homeowners on the Global Contractor Network platform. You help Florida homeowners with:

1. **Cost Estimates**: When asked about costs, ALWAYS ask for the property address first, then use get_roof_measurement to get the roof size, and calculate_roof_estimate to provide accurate pricing.

2. **Photo Analysis**: When photos are uploaded, use analyze_project_photos to assess condition and provide recommendations.

3. **Contractor Advice**: Provide guidance on:
   - What to look for when hiring contractors
   - Florida-specific requirements (licensing, insurance, permits)
   - HVHZ (High-Velocity Hurricane Zone) requirements for coastal areas
   - Questions to ask contractors before hiring

4. **Project Guidance**: Help homeowners understand:
   - Different roofing materials (shingle, metal, tile) and their pros/cons
   - Timeline expectations for different project types
   - Permit requirements in Florida
   - Insurance claim processes for storm damage

IMPORTANT RULES:
- Be friendly, helpful, and professional
- Always provide price RANGES, never exact quotes
- Clarify that estimates are AI-generated and a professional inspection is needed for final pricing
- For addresses, ask for the full Florida address if not provided
- When providing cost estimates, explain the different package tiers

Current photo URLs available for analysis: ${photoUrls?.length ? photoUrls.join(', ') : 'None'}`;

    // Initial AI call with tools
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools,
        tool_choice: 'auto',
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.',
          response: "I'm experiencing high demand right now. Please try again in a moment."
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let assistantMessage = aiData.choices?.[0]?.message;
    
    // Check if the AI wants to use tools
    if (assistantMessage?.tool_calls?.length > 0) {
      console.log('AI requested tool calls:', assistantMessage.tool_calls.map((tc: ToolCall) => tc.function.name));
      
      const toolResults: Array<{ tool_call_id: string; role: 'tool'; content: string }> = [];
      
      for (const toolCall of assistantMessage.tool_calls as ToolCall[]) {
        const args = JSON.parse(toolCall.function.arguments);
        let result: string;
        
        switch (toolCall.function.name) {
          case 'get_roof_measurement': {
            console.log('Getting roof measurement for:', args.address);
            
            // First geocode the address
            const geocodeResponse = await fetch(`${supabaseUrl}/functions/v1/geocode-address`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: args.address }),
            });
            
            if (!geocodeResponse.ok) {
              result = JSON.stringify({ error: 'Could not find that address. Please provide a valid Florida address.' });
              break;
            }
            
            const geocodeData = await geocodeResponse.json();
            const feature = geocodeData.features?.[0];
            
            if (!feature) {
              result = JSON.stringify({ error: 'Address not found. Please provide a complete address.' });
              break;
            }
            
            const [longitude, latitude] = feature.center;
            
            // Call roof-vision-ai
            const visionResponse = await fetch(`${supabaseUrl}/functions/v1/roof-vision-ai`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                latitude,
                longitude,
                address: feature.place_name,
                zoomLevel: 19,
              }),
            });
            
            if (!visionResponse.ok) {
              result = JSON.stringify({ error: 'Could not measure roof at this time. Please try again.' });
              break;
            }
            
            const visionData = await visionResponse.json();
            const est = visionData.estimation;
            
            result = JSON.stringify({
              address: feature.place_name,
              estimatedSqft: est.estimatedSqft,
              estimatedSquares: Math.round(est.estimatedSqft / 100 * 10) / 10,
              confidence: est.confidence,
              roofShape: est.roofShape,
              roofComplexity: est.roofComplexity,
              primaryColor: est.primaryRoofColor,
              estimatedAge: est.estimatedAgeYears,
            });
            break;
          }
          
          case 'calculate_roof_estimate': {
            const { squares, roofType } = args;
            console.log('Calculating estimate for:', squares, 'squares, type:', roofType);
            
            const estimates: Record<string, { name: string; low: number; high: number; popular?: boolean }> = {};
            
            const calculatePackage = (pkg: { name: string; priceLow: number; priceHigh: number; popular?: boolean }) => ({
              name: pkg.name,
              low: Math.round(pkg.priceLow * squares),
              high: Math.round(pkg.priceHigh * squares),
              popular: pkg.popular,
            });
            
            if (roofType === 'shingle' || roofType === 'all') {
              estimates.bronze = calculatePackage(PACKAGE_PRICING.shingle.bronze);
              estimates.silver = calculatePackage(PACKAGE_PRICING.shingle.silver);
              estimates.gold = calculatePackage(PACKAGE_PRICING.shingle.gold);
            }
            
            if (roofType === 'metal' || roofType === 'all') {
              estimates.blueCollar = calculatePackage(PACKAGE_PRICING.metal.blueCollar);
              estimates.blueCollarPlus = calculatePackage(PACKAGE_PRICING.metal.blueCollarPlus);
              estimates.platinum = calculatePackage(PACKAGE_PRICING.metal.platinum);
              estimates.ultimate = calculatePackage(PACKAGE_PRICING.metal.ultimate);
            }
            
            if (roofType === 'tile' || roofType === 'all') {
              estimates.tile = calculatePackage(PACKAGE_PRICING.tile.tile);
              estimates.tilePlus = calculatePackage(PACKAGE_PRICING.tile.tilePlus);
            }
            
            result = JSON.stringify({
              squares,
              sqft: squares * 100,
              roofType,
              estimates,
              note: 'Prices are estimates based on typical Florida installations. Final pricing requires on-site inspection.',
            });
            break;
          }
          
          case 'analyze_project_photos': {
            const urls = args.photoUrls || photoUrls || [];
            console.log('Analyzing photos:', urls.length);
            
            if (urls.length === 0) {
              result = JSON.stringify({ error: 'No photos provided for analysis.' });
              break;
            }
            
            // Call project-advisor-ai for detailed analysis
            const analysisResponse = await fetch(`${supabaseUrl}/functions/v1/project-advisor-ai`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                photoUrls: urls,
                projectType: args.projectType || 'roofing',
              }),
            });
            
            if (!analysisResponse.ok) {
              // Fallback to basic analysis
              const basicAnalysis = await fetch(`${supabaseUrl}/functions/v1/analyze-roof-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  photoUrl: urls[0],
                  address: 'Unknown',
                  normalizedAddress: 'unknown',
                }),
              });
              
              if (basicAnalysis.ok) {
                const basicData = await basicAnalysis.json();
                result = JSON.stringify(basicData.analysis);
              } else {
                result = JSON.stringify({ error: 'Could not analyze photos at this time.' });
              }
              break;
            }
            
            const analysisData = await analysisResponse.json();
            result = JSON.stringify(analysisData.analysis);
            break;
          }
          
          default:
            result = JSON.stringify({ error: `Unknown tool: ${toolCall.function.name}` });
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: result,
        });
      }
      
      // Make follow-up call with tool results
      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            assistantMessage,
            ...toolResults,
          ],
        }),
      });
      
      if (!followUpResponse.ok) {
        throw new Error(`AI follow-up error: ${followUpResponse.status}`);
      }
      
      const followUpData = await followUpResponse.json();
      assistantMessage = followUpData.choices?.[0]?.message;
    }

    const responseText = assistantMessage?.content || "I apologize, but I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({
      success: true,
      response: responseText,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in homeowner-assistant:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      response: "I apologize, but I encountered an error. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
