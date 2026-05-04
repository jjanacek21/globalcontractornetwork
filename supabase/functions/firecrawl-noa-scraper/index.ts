import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MIAMI_DADE_HOME = 'https://www.miamidade.gov/building/';

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

function logStep(step: string, status: 'ok' | 'failed', extra: Record<string, unknown> = {}) {
  const parts = [`step=${step}`, `status=${status}`];
  for (const [k, v] of Object.entries(extra)) parts.push(`${k}=${JSON.stringify(v)}`);
  console.log(`[firecrawl-noa-scraper] ${parts.join(' ')}`);
}

function buildQuery(params: NoaSearchParams): string {
  if (params.searchType === 'noa_number') {
    return `site:miamidade.gov NOA ${params.searchValue}`;
  }
  if (params.searchType === 'category') {
    return `site:miamidade.gov NOA ${params.searchValue} product approval`;
  }
  return `site:miamidade.gov NOA "${params.searchValue}" product approval`;
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
    const body = await req.json();

    const params: NoaSearchParams = {
      searchType:
        body.searchType ??
        (body.noa_number ? 'noa_number' : body.manufacturer ? 'manufacturer' : body.category ? 'category' : 'manufacturer'),
      searchValue:
        body.searchValue ?? body.manufacturer ?? body.noa_number ?? (body.searchType === 'category' ? body.category : '') ?? '',
      category: body.searchType === 'category' ? undefined : (body.categoryFilter ?? body.category),
      classification: body.classification,
      limit: body.limit,
    };

    if (!params.searchValue) {
      return new Response(
        JSON.stringify({ success: false, error: 'searchValue (or manufacturer/noa_number/category) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`NOA Scraper: searching ${params.searchType}="${params.searchValue}"`);

    const { data: job, error: jobError } = await supabase
      .from('firecrawl_crawl_jobs')
      .insert({
        job_type: 'noa_search',
        target_url: MIAMI_DADE_HOME,
        target_department: 'Miami-Dade County',
        status: 'running',
        config: params,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (jobError) {
      logStep('create_job', 'failed', { error: jobError.message });
      throw jobError;
    }
    logStep('create_job', 'ok', { jobId: job.id });

    // === STEP 1: Firecrawl Search ===
    const query = buildQuery(params);
    let searchData: any;
    try {
      const searchResp = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: 20,
          scrapeOptions: { formats: ['markdown'] },
        }),
      });
      searchData = await searchResp.json();
      if (!searchResp.ok || searchData.success === false) {
        const errMsg = searchData?.error || `HTTP ${searchResp.status}`;
        logStep('search', 'failed', { query, error: errMsg });
        await supabase.from('firecrawl_crawl_jobs').update({
          status: 'failed', error_message: `Firecrawl search failed: ${errMsg}`, completed_at: new Date().toISOString(),
        }).eq('id', job.id);
        return new Response(
          JSON.stringify({ success: false, step: 'search', error: errMsg }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logStep('search', 'failed', { query, error: msg });
      await supabase.from('firecrawl_crawl_jobs').update({
        status: 'failed', error_message: `Search exception: ${msg}`, completed_at: new Date().toISOString(),
      }).eq('id', job.id);
      return new Response(
        JSON.stringify({ success: false, step: 'search', error: msg }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Firecrawl v2 search result shape: { success, data: { web: [...] } } or { data: [...] }
    const rawResults: any[] =
      searchData?.data?.web ??
      (Array.isArray(searchData?.data) ? searchData.data : []) ??
      [];
    logStep('search', 'ok', { query, results: rawResults.length });

    // === STEP 2: Aggregate snippets ===
    const aggregated = rawResults.slice(0, 20).map((r: any, i: number) => {
      const md = r.markdown || r.description || r.snippet || '';
      return `--- Result ${i + 1} ---\nTitle: ${r.title || ''}\nURL: ${r.url || ''}\n${md.substring(0, 1500)}`;
    }).join('\n\n');

    if (!aggregated) {
      logStep('aggregate', 'failed', { reason: 'no_results' });
      await supabase.from('firecrawl_crawl_jobs').update({
        status: 'completed', documents_found: 0, documents_downloaded: 0,
        results_summary: { total_extracted: 0, stored: 0, query },
        completed_at: new Date().toISOString(),
      }).eq('id', job.id);
      return new Response(
        JSON.stringify({ success: true, jobId: job.id, recordsFound: 0, recordsStored: 0, records: [], query }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === STEP 3: AI structured extraction ===
    let records: NoaResult[] = [];
    try {
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
              content: 'You extract Miami-Dade NOA (Notice of Acceptance) product approval records from search result snippets. Only return entries you can identify with a valid NOA number (format NN-NNNN.NN) and a real product name (never empty, never just brackets, never just the NOA number).',
            },
            {
              role: 'user',
              content: `Extract NOA records from these Miami-Dade web search results. Skip any result without a clearly identifiable product name and NOA number.\n\n${aggregated.substring(0, 18000)}`,
            },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'extract_noa_records',
                description: 'Extract NOA records',
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
                          product_name: { type: 'string', description: 'Real product name, never empty or just an NOA number' },
                          category: { type: 'string' },
                          classification: { type: 'string' },
                          expiration_date: { type: 'string', description: 'YYYY-MM-DD or empty' },
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
        logStep('ai_extract', 'failed', { httpStatus: aiResponse.status, error: errText.substring(0, 200) });
        if (aiResponse.status === 429) {
          await supabase.from('firecrawl_crawl_jobs').update({
            status: 'failed', error_message: 'Rate limited - try again later', completed_at: new Date().toISOString(),
          }).eq('id', job.id);
          return new Response(JSON.stringify({ success: false, step: 'ai_extract', error: 'Rate limited, please try again later' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        await supabase.from('firecrawl_crawl_jobs').update({
          status: 'failed', error_message: 'AI extraction failed', completed_at: new Date().toISOString(),
        }).eq('id', job.id);
        return new Response(
          JSON.stringify({ success: false, step: 'ai_extract', error: 'AI extraction failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const aiResult = await aiResponse.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        records = parsed.records || [];
      }
      logStep('ai_extract', 'ok', { records: records.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logStep('ai_extract', 'failed', { error: msg });
      await supabase.from('firecrawl_crawl_jobs').update({
        status: 'failed', error_message: `AI exception: ${msg}`, completed_at: new Date().toISOString(),
      }).eq('id', job.id);
      return new Response(
        JSON.stringify({ success: false, step: 'ai_extract', error: msg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out records with bogus product names
    records = records.filter(r => {
      if (!r.noa_number || !r.product_name) return false;
      const cleaned = r.product_name.replace(/[\[\](){}<>:|;,.\-_\s]+/g, '').trim();
      if (cleaned.length < 3) return false;
      if (/^\d{2}-?\d{4}\.?\d{2}$/.test(cleaned)) return false;
      return true;
    });

    const limit = params.limit || 100;
    const limitedRecords = records.slice(0, limit);

    // === STEP 4: Store ===
    let stored = 0;
    for (const record of limitedRecords) {
      try {
        const noaForUrl = record.noa_number.replace(/[-\.]/g, '');
        const pdfUrl = `https://www.miamidade.gov/building/library/noa/${noaForUrl}.pdf`;

        await supabase.from('firecrawl_discovered_documents').insert({
          crawl_job_id: job.id,
          source_url: MIAMI_DADE_HOME,
          document_type: 'noa',
          title: `NOA ${record.noa_number}`,
          description: record.product_name,
          department: 'Miami-Dade County',
          county: 'Miami-Dade',
          file_url: pdfUrl,
          metadata: record,
        });

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
            source_website: MIAMI_DADE_HOME,
            last_source_attempt: new Date().toISOString(),
            is_active: true,
          }, { onConflict: 'noa_number' });

        if (!upsertError) stored++;
        else logStep('store', 'failed', { noa: record.noa_number, error: upsertError.message });
      } catch (err) {
        logStep('store', 'failed', { noa: record.noa_number, error: err instanceof Error ? err.message : String(err) });
      }
    }
    logStep('store', 'ok', { stored, total: limitedRecords.length });

    await supabase.from('firecrawl_crawl_jobs').update({
      status: 'completed',
      documents_found: records.length,
      documents_downloaded: stored,
      results_summary: { total_extracted: records.length, stored, query, sample: limitedRecords.slice(0, 3) },
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        query,
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
