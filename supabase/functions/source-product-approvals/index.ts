import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Known manufacturer website patterns for direct lookups
const MANUFACTURER_PATTERNS: Record<string, string> = {
  'GAF': 'gaf.com',
  'CertainTeed': 'certainteed.com',
  'Owens Corning': 'owenscorning.com',
  'IKO': 'iko.com',
  'Tamko': 'tamko.com',
  'Atlas': 'atlasroofing.com',
  'BASF': 'basf.com',
  'Polyglass': 'polyglass.us',
  'Johns Manville': 'jm.com',
  'Tremco': 'tremcoinc.com',
  'Andersen': 'andersenwindows.com',
  'Pella': 'pella.com',
  'PGT': 'pgtindustries.com',
  'CGI': 'cgiwindows.com',
  'Milgard': 'milgard.com',
  'Simonton': 'simonton.com',
  'Marvin': 'marvin.com',
};

async function searchForDocument(
  firecrawlApiKey: string,
  manufacturer: string,
  productName: string,
  noaNumber: string | null,
  flApproval: string | null
): Promise<{ noa_url: string | null; fl_url: string | null; source_website: string | null }> {
  try {
    // Build search query focusing on manufacturer resources
    const searchTerms = [];
    if (noaNumber) searchTerms.push(noaNumber);
    if (flApproval) searchTerms.push(flApproval);
    searchTerms.push(manufacturer, productName, 'NOA PDF approval');

    const query = searchTerms.join(' ');
    
    // Get manufacturer domain for targeted search
    const manufacturerKey = Object.keys(MANUFACTURER_PATTERNS).find(
      key => manufacturer.toLowerCase().includes(key.toLowerCase())
    );
    const manufacturerDomain = manufacturerKey ? MANUFACTURER_PATTERNS[manufacturerKey] : null;

    console.log(`Searching for: ${query}${manufacturerDomain ? ` (site:${manufacturerDomain})` : ''}`);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: manufacturerDomain ? `${query} site:${manufacturerDomain}` : query,
        limit: 5,
        scrapeOptions: {
          formats: ['links', 'markdown']
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl search error:', response.status, errorText);
      return { noa_url: null, fl_url: null, source_website: null };
    }

    const searchResults = await response.json();
    console.log(`Found ${searchResults.data?.length || 0} results`);

    // Look for PDF links in results
    let noaUrl: string | null = null;
    let flUrl: string | null = null;
    let sourceWebsite: string | null = null;

    if (searchResults.data && Array.isArray(searchResults.data)) {
      for (const result of searchResults.data) {
        const links = result.links || [];

        // Check for PDF links in the result
        for (const link of links) {
          const linkLower = link.toLowerCase();
          if (linkLower.includes('.pdf')) {
            // Check if it's an NOA document
            if (noaNumber && (linkLower.includes(noaNumber.toLowerCase().replace(/\s+/g, '')) || linkLower.includes('noa'))) {
              noaUrl = link;
              try { sourceWebsite = new URL(result.url).hostname; } catch {}
            }
            // Check if it's an FL approval document
            if (flApproval && (linkLower.includes(flApproval.toLowerCase().replace(/\s+/g, '')) || linkLower.includes('fl-'))) {
              flUrl = link;
              try { sourceWebsite = new URL(result.url).hostname; } catch {}
            }
          }
        }

        if (noaUrl || flUrl) break;
      }
    }

    return { noa_url: noaUrl, fl_url: flUrl, source_website: sourceWebsite };
  } catch (error) {
    console.error('Search error:', error);
    return { noa_url: null, fl_url: null, source_website: null };
  }
}

async function analyzeWithAI(
  lovableApiKey: string,
  manufacturer: string,
  productName: string,
  noaNumber: string | null,
  flApproval: string | null,
  searchResults: any
): Promise<{ noa_url: string | null; fl_url: string | null; source_website: string | null }> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert at finding building product approval documents. Extract the most relevant PDF URLs for NOA or Florida Product Approval documents from search results. Focus on manufacturer websites. Only return URLs that are direct PDF links.`
          },
          {
            role: 'user',
            content: `Find the NOA/FL Product Approval PDF for:
Manufacturer: ${manufacturer}
Product: ${productName}
${noaNumber ? `NOA Number: ${noaNumber}` : ''}
${flApproval ? `FL Product Approval: ${flApproval}` : ''}

Search results: ${JSON.stringify(searchResults, null, 2)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_document_urls',
              description: 'Extract NOA and FL Product Approval PDF URLs',
              parameters: {
                type: 'object',
                properties: {
                  noa_pdf_url: { type: 'string', description: 'Direct URL to NOA PDF' },
                  fl_approval_pdf_url: { type: 'string', description: 'Direct URL to FL Approval PDF' },
                  source_website: { type: 'string', description: 'Website domain where found' },
                  confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
                },
                required: ['confidence'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_document_urls' } }
      }),
    });

    if (!response.ok) {
      console.error('AI analysis error:', response.status);
      return { noa_url: null, fl_url: null, source_website: null };
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      console.log('AI extracted:', args);
      
      if (args.confidence === 'high' || args.confidence === 'medium') {
        return {
          noa_url: args.noa_pdf_url || null,
          fl_url: args.fl_approval_pdf_url || null,
          source_website: args.source_website || null
        };
      }
    }

    return { noa_url: null, fl_url: null, source_website: null };
  } catch (error) {
    console.error('AI analysis error:', error);
    return { noa_url: null, fl_url: null, source_website: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured. Please connect Firecrawl in Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get products that need document sourcing (with NOA numbers, no file URL yet)
    const { data: products, error: fetchError } = await supabase
      .from('product_approvals')
      .select('id, manufacturer, product_name, product_category, noa_number, fl_product_approval, file_url, noa_pdf_url, fl_approval_pdf_url, source_status')
      .eq('is_active', true)
      .or('source_status.is.null,source_status.eq.pending,source_status.eq.not_found')
      .is('file_url', null)
      .not('noa_number', 'is', null)
      .limit(25); // Smaller batches to avoid timeouts

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      throw fetchError;
    }

    console.log(`Processing ${products?.length || 0} products for document sourcing`);

    let updated = 0;
    let failed = 0;
    const total = products?.length || 0;

    for (const product of products || []) {
      try {
        console.log(`\n--- Processing: ${product.manufacturer} - ${product.product_name} ---`);
        
        // Mark as searching
        await supabase
          .from('product_approvals')
          .update({ source_status: 'searching', last_source_attempt: new Date().toISOString() })
          .eq('id', product.id);

        // Step 1: Search with Firecrawl
        const searchResults = await searchForDocument(
          FIRECRAWL_API_KEY,
          product.manufacturer,
          product.product_name,
          product.noa_number,
          product.fl_product_approval
        );

        let finalNoaUrl = searchResults.noa_url;
        let finalFlUrl = searchResults.fl_url;
        let sourceWebsite = searchResults.source_website;

        // Step 2: If no direct PDFs found, use AI to analyze broader search
        if (!finalNoaUrl && !finalFlUrl) {
          const response = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `${product.manufacturer} ${product.product_name} ${product.noa_number || ''} product approval document resources`,
              limit: 8,
              scrapeOptions: { formats: ['links', 'markdown'] }
            }),
          });

          if (response.ok) {
            const moreResults = await response.json();
            const aiAnalysis = await analyzeWithAI(
              LOVABLE_API_KEY,
              product.manufacturer,
              product.product_name,
              product.noa_number,
              product.fl_product_approval,
              moreResults.data
            );

            finalNoaUrl = aiAnalysis.noa_url;
            finalFlUrl = aiAnalysis.fl_url;
            sourceWebsite = aiAnalysis.source_website;
          }
        }

        // Update product with found URLs
        if (finalNoaUrl || finalFlUrl) {
          const updateData: Record<string, any> = {
            source_status: 'found',
            source_website: sourceWebsite,
            last_source_attempt: new Date().toISOString()
          };

          if (finalNoaUrl) {
            updateData.noa_pdf_url = finalNoaUrl;
            updateData.file_url = finalNoaUrl;
          }
          if (finalFlUrl) {
            updateData.fl_approval_pdf_url = finalFlUrl;
            if (!finalNoaUrl) updateData.file_url = finalFlUrl;
          }

          const { error: updateError } = await supabase
            .from('product_approvals')
            .update(updateData)
            .eq('id', product.id);

          if (updateError) {
            console.error(`Error updating ${product.id}:`, updateError);
            failed++;
          } else {
            console.log(`✅ Found documents for: ${product.product_name}`);
            updated++;
          }
        } else {
          await supabase
            .from('product_approvals')
            .update({ source_status: 'not_found', last_source_attempt: new Date().toISOString() })
            .eq('id', product.id);
          
          console.log(`❌ No documents found for: ${product.product_name}`);
          failed++;
        }

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 1200));

      } catch (productError) {
        console.error(`Error processing ${product.id}:`, productError);
        failed++;
        
        await supabase
          .from('product_approvals')
          .update({ source_status: 'error', last_source_attempt: new Date().toISOString() })
          .eq('id', product.id);
      }
    }

    console.log(`\n=== Sourcing complete: ${updated} updated, ${failed} failed, ${total} total ===`);

    return new Response(
      JSON.stringify({ success: true, updated, failed, total, message: `Found documents for ${updated} products` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});