import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MIAMI_DADE_SEARCH_URL = 'https://www.miamidade.gov/building/pc-searchnoa.asp';

interface NoaSearchParams {
  searchType: 'noa_number' | 'manufacturer' | 'category';
  searchValue: string;
  category?: string;
  classification?: string;
  limit?: number;
}

interface NoaResult {
  noa_number: string;
  manufacturer: string;
  product_name: string;
  category: string;
  classification: string;
  expiration_date: string | null;
  pdf_url: string;
  hvhz_approved: boolean;
}

function buildScrapeActions(params: NoaSearchParams): any[] {
  const actions: any[] = [
    { type: 'wait', milliseconds: 2000 },
  ];

  if (params.searchType === 'noa_number') {
    actions.push(
      { type: 'click', selector: 'input[name="fldNOA"]' },
      { type: 'write', text: params.searchValue },
    );
  } else if (params.searchType === 'manufacturer') {
    actions.push(
      { type: 'click', selector: 'input[name="Applicant"]' },
      { type: 'write', text: params.searchValue },
    );
  }

  if (params.category) {
    actions.push(
      { type: 'click', selector: 'select[name="Classification"]' },
      { type: 'write', text: params.category },
    );
  }

  // Submit the form
  actions.push(
    { type: 'click', selector: 'input[name="AdvancedSearch"][value="Go"]' },
    { type: 'wait', milliseconds: 8000 },
  );

  return actions;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const params: NoaSearchParams = await req.json();

    if (!params.searchValue) {
      return new Response(
        JSON.stringify({ success: false, error: 'searchValue is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`NOA Scraper: searching ${params.searchType}="${params.searchValue}"`);

    // Create a crawl job record
    const { data: job, error: jobError } = await supabase
      .from('firecrawl_crawl_jobs')
      .insert({
        job_type: 'noa_search',
        target_url: MIAMI_DADE_SEARCH_URL,
        target_department: 'Miami-Dade County',
        status: 'running',
        config: params,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (jobError) {
      console.error('Failed to create job record:', jobError);
      throw jobError;
    }

    const actions = buildScrapeActions(params);

    // Use Firecrawl v2 scrape with actions
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: MIAMI_DADE_SEARCH_URL,
        formats: ['rawHtml', 'markdown'],
        actions,
        waitFor: 10000,
        timeout: 60000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl scrape failed:', scrapeData);
      await supabase.from('firecrawl_crawl_jobs').update({
        status: 'failed',
        error_message: scrapeData.error || 'Scrape failed',
        completed_at: new Date().toISOString(),
      }).eq('id', job.id);

      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Scrape failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = scrapeData.data?.rawHtml || scrapeData.data?.html || '';
    const markdown = scrapeData.data?.markdown || '';
    console.log(`Received ${html.length} chars HTML, ${markdown.length} chars markdown`);

    // Use AI to extract structured NOA data from the scraped content
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'Extract NOA product approval records from Miami-Dade search results HTML. Return structured data for each product found.',
          },
          {
            role: 'user',
            content: `Extract all NOA records from this Miami-Dade search results page. The table has columns: NOA Number, Applicant/Manufacturer, Category, Subcategory, Material, Description, Impact Rating, MDP+, MDP-, Classification, Expiration Date.\n\nHTML content (first 15000 chars):\n${html.substring(0, 15000)}\n\nMarkdown:\n${markdown.substring(0, 5000)}`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_noa_records',
              description: 'Extract NOA records from Miami-Dade search results',
              parameters: {
                type: 'object',
                properties: {
                  records: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        noa_number: { type: 'string', description: 'NOA number e.g. 24-0101.01' },
                        manufacturer: { type: 'string' },
                        product_name: { type: 'string' },
                        category: { type: 'string' },
                        classification: { type: 'string' },
                        expiration_date: { type: 'string', description: 'YYYY-MM-DD format or null' },
                        hvhz_approved: { type: 'boolean' },
                      },
                      required: ['noa_number', 'manufacturer', 'product_name', 'category'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['records'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_noa_records' } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI extraction failed:', aiResponse.status, errText);

      if (aiResponse.status === 429) {
        await supabase.from('firecrawl_crawl_jobs').update({
          status: 'failed', error_message: 'Rate limited - try again later', completed_at: new Date().toISOString(),
        }).eq('id', job.id);
        return new Response(JSON.stringify({ success: false, error: 'Rate limited, please try again later' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('firecrawl_crawl_jobs').update({
        status: 'failed', error_message: 'AI extraction failed', completed_at: new Date().toISOString(),
      }).eq('id', job.id);
      return new Response(
        JSON.stringify({ success: false, error: 'AI extraction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let records: NoaResult[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        records = parsed.records || [];
      } catch (e) {
        console.error('Failed to parse AI response:', e);
      }
    }

    console.log(`AI extracted ${records.length} NOA records`);

    const limit = params.limit || 100;
    const limitedRecords = records.slice(0, limit);

    // Store results in product_approvals and firecrawl_discovered_documents
    let stored = 0;
    for (const record of limitedRecords) {
      const noaForUrl = record.noa_number.replace(/[-\.]/g, '');
      const pdfUrl = `https://www.miamidade.gov/building/library/noa/${noaForUrl}.pdf`;

      // Insert discovered document
      await supabase.from('firecrawl_discovered_documents').insert({
        crawl_job_id: job.id,
        source_url: MIAMI_DADE_SEARCH_URL,
        document_type: 'noa',
        title: `NOA ${record.noa_number}`,
        description: record.product_name,
        department: 'Miami-Dade County',
        county: 'Miami-Dade',
        file_url: pdfUrl,
        metadata: record,
      });

      // Upsert into product_approvals
      const { error: upsertError } = await supabase
        .from('product_approvals')
        .upsert({
          noa_number: record.noa_number.replace('.', ''),
          manufacturer: record.manufacturer,
          product_name: record.product_name.substring(0, 200),
          product_category: mapCategory(record.category),
          noa_pdf_url: pdfUrl,
          file_url: pdfUrl,
          expiration_date: record.expiration_date || null,
          hvhz_approved: record.hvhz_approved || false,
          source_status: 'crawl_discovered',
          source_website: MIAMI_DADE_SEARCH_URL,
          last_source_attempt: new Date().toISOString(),
          is_active: true,
        }, { onConflict: 'noa_number' });

      if (!upsertError) stored++;
    }

    // Update job
    await supabase.from('firecrawl_crawl_jobs').update({
      status: 'completed',
      documents_found: records.length,
      documents_downloaded: stored,
      results_summary: { total_extracted: records.length, stored, sample: limitedRecords.slice(0, 3) },
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        recordsFound: records.length,
        recordsStored: stored,
        records: limitedRecords,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('NOA scraper error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function mapCategory(cat: string): string {
  const lower = (cat || '').toLowerCase();
  if (lower.includes('roof')) return 'roofing';
  if (lower.includes('window')) return 'windows_doors';
  if (lower.includes('door')) return 'windows_doors';
  if (lower.includes('glass') || lower.includes('glazing')) return 'windows_doors';
  if (lower.includes('shutter')) return 'shutters';
  if (lower.includes('panel')) return 'panels';
  if (lower.includes('fastener')) return 'fasteners';
  if (lower.includes('insulation')) return 'insulation';
  if (lower.includes('coating')) return 'coatings';
  return 'other';
}
