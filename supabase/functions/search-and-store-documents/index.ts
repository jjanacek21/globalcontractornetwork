import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchQuery, documentType, jurisdiction } = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Build search prompt based on document type
    let searchPrompt = ''
    
    if (documentType === 'NOA') {
      searchPrompt = `Search for Miami-Dade County NOA (Notice of Acceptance) for: ${searchQuery}
      
Find official PDF documents from miamidade.gov/economy or Miami-Dade County Product Control.

For each document, provide:
1. Direct PDF download URL
2. NOA number (format: ##-####.##)
3. Expiration date
4. Product name
5. Manufacturer

Look for documents like "NOA No.: XX-XXXX.XX" format.`
    } else if (documentType === 'Product Approval') {
      searchPrompt = `Search for Florida Product Approval: ${searchQuery}
      
Find documents from floridabuilding.org or Florida Building Commission.

Look for:
1. FL approval numbers (format: FL#####)
2. Engineering reports
3. Installation instructions
4. Load tables and specifications

Provide direct PDF URLs.`
    } else if (documentType === 'Permit Form') {
      searchPrompt = `Search for ${jurisdiction || searchQuery} building permit application forms.
      
Find official blank permit forms for roofing permits.

Look for:
1. Building permit applications
2. Roofing permit forms
3. Contractor registration forms
4. Required affidavits

Provide direct PDF download links from official .gov websites.`
    } else if (documentType === 'Installation Spec') {
      searchPrompt = `Search for installation specifications and nail patterns for: ${searchQuery}
      
Find:
1. Manufacturer installation guides
2. Nail pattern diagrams
3. Fastener specifications
4. Wind load requirements

Provide direct PDF links from manufacturer websites.`
    } else {
      searchPrompt = `Search for ${documentType} related to: ${searchQuery}
      
Find official building/roofing documents with direct PDF download links.`
    }

    // Call Lovable AI Gateway with web search
    const searchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: [{
          role: 'user',
          content: searchPrompt
        }],
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search'
        }],
        max_tokens: 4096
      })
    })

    if (!searchResponse.ok) {
      throw new Error(`AI Gateway error: ${searchResponse.statusText}`)
    }

    const searchData = await searchResponse.json()
    
    // Extract response text
    let responseText = ''
    if (searchData.choices && searchData.choices[0]) {
      const message = searchData.choices[0].message
      if (message.content) {
        if (typeof message.content === 'string') {
          responseText = message.content
        } else if (Array.isArray(message.content)) {
          responseText = message.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n')
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        searchResults: responseText,
        documentType,
        query: searchQuery,
        jurisdiction
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders }}
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  }
})
