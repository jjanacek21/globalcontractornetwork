import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Navigation route mapping with residential/commercial split
const navigationRoutes: Record<string, { path: string; description: string }> = {
  // Roofing - split by property type
  'roofing': { path: '/roofing', description: 'Roofing Quotes & Estimates' },
  'roofing-residential': { path: '/roofing?type=residential', description: 'Residential Roof Quote' },
  'roofing-commercial': { path: '/roofing?type=commercial', description: 'Commercial Roof Quote' },
  
  // Roof Coating - split by property type
  'roof-coating': { path: '/coating-kings', description: 'Roof Coating Services' },
  'coating-residential': { path: '/coating-kings?propertyType=residential', description: 'Residential Roof Coating Quote' },
  'coating-commercial': { path: '/coating-kings?propertyType=commercial', description: 'Commercial Roof Coating Quote' },
  
  // Windows & Doors
  'windows': { path: '/green-home-solutions', description: 'Impact Windows Quote' },
  'windows-residential': { path: '/green-home-solutions?type=residential', description: 'Residential Windows Quote' },
  'windows-commercial': { path: '/green-home-solutions?type=commercial', description: 'Commercial Windows Quote' },
  'doors': { path: '/green-home-solutions', description: 'Impact Doors Quote' },
  
  // Other services
  'tree-removal': { path: '/northern-landscaping', description: 'Tree Removal Estimate' },
  'landscaping': { path: '/northern-landscaping', description: 'Landscaping Services' },
  'emergency': { path: '/emergency-mitigation', description: 'Emergency Water/Storm Damage' },
  'mold': { path: '/emergency-mitigation', description: 'Mold Remediation Services' },
  'permits': { path: '/permit-queens', description: 'Permit Processing Services' },
  'insurance-claim': { path: '/supplement-kings', description: 'Insurance Claim Supplements' },
  'florida-license': { path: '/academy?q=florida+license', description: 'Florida Contractor Licensing' },
  'contractor-license': { path: '/academy?category=licensing', description: 'Contractor Licensing Resources' },
  'learning-center': { path: '/academy', description: 'Training Academy Resources' },
  'directory': { path: '/directory', description: 'Find Verified Contractors' },
  'join': { path: '/join', description: 'Join the Contractor Network' },
  'store': { path: '/store', description: 'Merchandise Store' },
};

// AI tools for navigation and contractor matching
const tools = [
  {
    type: "function",
    function: {
      name: "navigate_user",
      description: "Navigate the user to a specific page when they want quotes, services, or resources. Use this when users ask for quotes, estimates, or want to access specific services.",
      parameters: {
        type: "object",
        properties: {
          destination: {
            type: "string",
            enum: Object.keys(navigationRoutes),
            description: "The destination page to navigate to"
          },
          message: {
            type: "string",
            description: "A brief, friendly message to show the user before navigation"
          }
        },
        required: ["destination", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_contractors",
      description: "Search for contractors matching user's project needs. Use this when users want to find, hire, or get recommendations for contractors.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["Roofing", "Windows & Doors", "Tree Service", "Landscaping", "General Contractor", "Electrical", "Plumbing", "HVAC", "Painting", "Flooring"],
            description: "Primary service category"
          },
          location: {
            type: "string",
            description: "City, area, or ZIP code if provided by user"
          },
          projectType: {
            type: "string",
            description: "Brief description of the project"
          }
        },
        required: ["category"]
      }
    }
  }
];

async function searchContractors(supabase: any, category: string, location?: string) {
  let query = supabase
    .from('contractor_profiles')
    .select('id, company_name, category, average_rating, is_verified, phone, email, service_area, price_tier')
    .eq('category', category)
    .order('average_rating', { ascending: false, nullsFirst: false })
    .limit(5);

  const { data, error } = await query;
  
  if (error) {
    console.error('Error searching contractors:', error);
    return [];
  }

  // Filter by location if provided
  if (location && data) {
    const locationLower = location.toLowerCase();
    return data.filter((c: any) => {
      if (!c.service_area) return true;
      const areas = Array.isArray(c.service_area) ? c.service_area : [];
      return areas.some((area: string) => area.toLowerCase().includes(locationLower)) || true;
    });
  }

  return data || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const systemPrompt = `You are a helpful AI assistant for a South Florida contractor services platform. Keep responses SHORT and action-oriented.

**CRITICAL: ALWAYS USE NAVIGATION TOOLS FOR QUOTES**
When users want ANY quote or estimate, you MUST use navigate_user tool immediately. DO NOT just respond with text.

**PROPERTY TYPE SELECTION - VERY IMPORTANT:**
For roofing, coating, or window quotes, if user hasn't specified residential or commercial:
1. Ask: "Is this for a residential or commercial property?"
2. Then use the appropriate destination:
   - Residential roof → navigate_user("roofing-residential", "Taking you to our residential roof estimator!")
   - Commercial roof → navigate_user("roofing-commercial", "Taking you to our commercial roof estimator!")
   - Residential coating → navigate_user("coating-residential", "Let's get your residential coating quote!")
   - Commercial coating → navigate_user("coating-commercial", "Taking you to commercial coating options!")
   - Residential windows → navigate_user("windows-residential", "Let's get your window quote!")
   - Commercial windows → navigate_user("windows-commercial", "Taking you to commercial window options!")

**DIRECT NAVIGATION - When user specifies property type:**
- "residential roof quote" → navigate_user("roofing-residential", "Taking you to our residential roof estimator!")
- "commercial roof coating" → navigate_user("coating-commercial", "Here's our commercial coating calculator!")
- "I need windows for my house" → navigate_user("windows-residential", "Let's get your home's window quote!")

**OTHER SERVICES - Navigate immediately:**
- Tree removal → navigate_user("tree-removal", "I'll connect you with our tree service team!")
- Emergency/water damage → navigate_user("emergency", "Let me get you emergency help!")
- Permits → navigate_user("permits", "Taking you to permit services!")
- Insurance claims → navigate_user("insurance-claim", "Here's our claims supplement team!")
- Find contractor → Use find_contractors tool

**Services Available:**
- Roofing: Replacements, repairs, inspections (residential & commercial)
- Coating Kings: Silicone, acrylic, elastomeric roof coatings
- Green Home Solutions: Impact windows & doors
- Emergency Mitigation: Water damage, mold, storm cleanup
- Northern Landscaping: Tree removal, stump grinding
- Permit Queens: Permit processing & inspections
- Supplement Kings: Insurance claim supplements

Be concise. Always use tools for quotes - never just describe services without navigation.

Current context: ${context || 'General inquiry'}`;

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
          ...messages,
        ],
        tools,
        tool_choice: 'auto',
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Transform the stream to handle tool calls
    const reader = response.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let accumulatedToolCalls: any[] = [];
    let currentToolCall: any = null;
    let accumulatedContent = '';
    let finishReason = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              
              // Don't send [DONE] yet - wait until we process tool calls
              if (jsonStr === '[DONE]') {
                continue; // Will send [DONE] after loop ends
              }

              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta;
                finishReason = parsed.choices?.[0]?.finish_reason || finishReason;

                // Handle regular content - stream it immediately
                if (delta?.content) {
                  accumulatedContent += delta.content;
                  controller.enqueue(encoder.encode(`data: ${jsonStr}\n\n`));
                }

                // Accumulate tool calls (they come in chunks)
                if (delta?.tool_calls) {
                  for (const toolCall of delta.tool_calls) {
                    if (toolCall.index !== undefined) {
                      if (!accumulatedToolCalls[toolCall.index]) {
                        accumulatedToolCalls[toolCall.index] = {
                          id: toolCall.id || '',
                          type: 'function',
                          function: { name: '', arguments: '' }
                        };
                      }
                      if (toolCall.id) {
                        accumulatedToolCalls[toolCall.index].id = toolCall.id;
                      }
                      if (toolCall.function?.name) {
                        accumulatedToolCalls[toolCall.index].function.name = toolCall.function.name;
                      }
                      if (toolCall.function?.arguments) {
                        accumulatedToolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                      }
                    }
                  }
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }

          // AFTER stream ends, process any accumulated tool calls
          if (accumulatedToolCalls.length > 0) {
            console.log('Processing tool calls:', JSON.stringify(accumulatedToolCalls));
            
            for (const toolCall of accumulatedToolCalls) {
              const funcName = toolCall.function?.name;
              if (!funcName) continue;

              try {
                const args = JSON.parse(toolCall.function.arguments || '{}');
                console.log(`Tool call: ${funcName}`, args);

                if (funcName === 'navigate_user') {
                  const route = navigationRoutes[args.destination];
                  if (route) {
                    const actionEvent = {
                      choices: [{
                        delta: { 
                          content: args.message || `Taking you to ${route.description}...`,
                          action: {
                            type: 'navigate',
                            path: route.path,
                            label: route.description,
                            message: args.message
                          }
                        },
                        finish_reason: null
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(actionEvent)}\n\n`));
                  }
                } else if (funcName === 'find_contractors') {
                  const contractors = await searchContractors(supabase, args.category, args.location);
                  const message = contractors.length > 0 
                    ? `I found ${contractors.length} ${args.category} contractors for you! Here are the top matches:`
                    : `I couldn't find any ${args.category} contractors at the moment. Try browsing our directory.`;
                  
                  const actionEvent = {
                    choices: [{
                      delta: { 
                        content: message,
                        action: {
                          type: 'contractors',
                          contractors: contractors.slice(0, 3).map((c: any) => ({
                            id: c.id,
                            company_name: c.company_name,
                            category: c.category,
                            average_rating: c.average_rating,
                            is_verified: c.is_verified,
                            phone: c.phone
                          }))
                        }
                      },
                      finish_reason: null
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(actionEvent)}\n\n`));
                }
              } catch (e) {
                console.error('Error processing tool call:', e);
              }
            }
          }

          // NOW send [DONE] after all tool calls processed
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (e) {
          console.error('Stream processing error:', e);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('General assistant error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
