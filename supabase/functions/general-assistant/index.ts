import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Navigation route mapping
const navigationRoutes: Record<string, { path: string; description: string }> = {
  'roofing': { path: '/roofing', description: 'Roofing quotes and estimates' },
  'roof-coating': { path: '/coating-kings', description: 'Roof coating services' },
  'windows': { path: '/green-home-solutions', description: 'Impact windows and doors' },
  'doors': { path: '/green-home-solutions', description: 'Impact windows and doors' },
  'tree-removal': { path: '/northern-landscaping', description: 'Tree and landscaping services' },
  'landscaping': { path: '/northern-landscaping', description: 'Landscaping services' },
  'emergency': { path: '/emergency-mitigation', description: 'Emergency water/storm damage' },
  'mold': { path: '/emergency-mitigation', description: 'Mold remediation services' },
  'permits': { path: '/permit-queens', description: 'Permit processing services' },
  'insurance-claim': { path: '/supplement-kings', description: 'Insurance claim supplements' },
  'florida-license': { path: '/academy?q=florida+license', description: 'Florida contractor licensing' },
  'contractor-license': { path: '/academy?category=licensing', description: 'Contractor licensing resources' },
  'learning-center': { path: '/academy', description: 'Training Academy resources' },
  'directory': { path: '/directory', description: 'Find verified contractors' },
  'join': { path: '/join', description: 'Join the contractor network' },
  'store': { path: '/store', description: 'Merchandise store' },
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

    const systemPrompt = `You are a helpful AI assistant for a South Florida contractor services platform. You provide expert guidance on:

**Services We Offer:**
- **Coating Kings**: Professional roof coating services (silicone, acrylic, elastomeric, polyurea)
- **Green Home Solutions**: Impact-rated windows and doors for hurricane protection
- **Emergency Mitigation**: 24/7 water damage, mold remediation, storm cleanup
- **Northern Landscaping**: Tree removal, stump grinding, landscaping services
- **Permit Queens**: Permit processing, building department liaison, inspection scheduling
- **Supplement Kings**: Insurance claim supplements and recoveries
- **General Roofing**: Full roof replacements, repairs, inspections
- **Training Academy**: Contractor resources, licensing guides, and educational materials

**NAVIGATION ACTIONS - VERY IMPORTANT:**
When users want to:
- Get a quote/estimate for any service → Use navigate_user tool with the appropriate destination
- Find learning resources, licensing info → Use navigate_user to learning-center or specific resource
- Find a contractor → Use find_contractors tool

**Navigation Examples:**
- "Get me a roof quote" → navigate_user("roofing", "I'll take you to our instant roof estimator!")
- "Quote for impact windows" → navigate_user("windows", "Let's get you a window quote!")
- "Tree removal estimate" → navigate_user("tree-removal", "I'll connect you with our tree service team!")
- "How do I get my Florida license?" → navigate_user("florida-license", "Here are our Florida licensing resources!")
- "Find me a roofer" → find_contractors("Roofing") and ask about location if needed

**CONTRACTOR MATCHING:**
When users want to find contractors:
1. If category is clear, use find_contractors immediately
2. Ask about location if they want local results
3. Present results with ratings and verified status

**Guidelines:**
- Be friendly, professional, and helpful
- ALWAYS use the navigation tools when users want quotes or resources
- Provide specific, actionable advice
- When asked for estimates, give realistic ranges
- Always recommend professional inspections for major work
- Emphasize safety and code compliance
- Keep responses concise but comprehensive

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
              if (jsonStr === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta;
                finishReason = parsed.choices?.[0]?.finish_reason || finishReason;

                // Handle regular content
                if (delta?.content) {
                  accumulatedContent += delta.content;
                  controller.enqueue(encoder.encode(`data: ${jsonStr}\n\n`));
                }

                // Handle tool calls
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

                // Process completed tool calls
                if (finishReason === 'tool_calls' && accumulatedToolCalls.length > 0) {
                  for (const toolCall of accumulatedToolCalls) {
                    const funcName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments || '{}');

                    if (funcName === 'navigate_user') {
                      const route = navigationRoutes[args.destination];
                      if (route) {
                        const actionData = {
                          type: 'navigate',
                          path: route.path,
                          label: route.description,
                          message: args.message
                        };
                        // Send the message content with action
                        const actionEvent = {
                          choices: [{
                            delta: { 
                              content: args.message,
                              action: actionData
                            },
                            finish_reason: null
                          }]
                        };
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(actionEvent)}\n\n`));
                      }
                    } else if (funcName === 'find_contractors') {
                      const contractors = await searchContractors(supabase, args.category, args.location);
                      const actionData = {
                        type: 'contractors',
                        contractors: contractors.slice(0, 3).map((c: any) => ({
                          id: c.id,
                          company_name: c.company_name,
                          category: c.category,
                          average_rating: c.average_rating,
                          is_verified: c.is_verified,
                          phone: c.phone
                        }))
                      };
                      const message = contractors.length > 0 
                        ? `I found ${contractors.length} ${args.category} contractors for you! Here are the top matches:`
                        : `I couldn't find any ${args.category} contractors at the moment. Try browsing our directory for more options.`;
                      
                      const actionEvent = {
                        choices: [{
                          delta: { 
                            content: message,
                            action: actionData
                          },
                          finish_reason: null
                        }]
                      };
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(actionEvent)}\n\n`));
                    }
                  }
                  accumulatedToolCalls = [];
                  finishReason = '';
                }
              } catch (e) {
                // Pass through unparseable chunks
                controller.enqueue(encoder.encode(`${line}\n`));
              }
            }
          }
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
