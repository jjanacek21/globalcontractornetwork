import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SOUTH_FL_DEPARTMENTS: Record<string, { url: string; county: string }> = {
  'Miami-Dade County': { url: 'https://www.miamidade.gov/building', county: 'Miami-Dade' },
  'Broward County': { url: 'https://www.broward.org/CodeAppeals', county: 'Broward' },
  'Boca Raton': { url: 'https://www.myboca.us/204/Building-Division', county: 'Palm Beach' },
  'West Palm Beach': { url: 'https://www.wpb.org/government/development-services/building-division', county: 'Palm Beach' },
  'Hollywood': { url: 'https://www.hollywoodfl.org/297/Building-Division', county: 'Broward' },
  'Coral Springs': { url: 'https://www.coralsprings.gov/government/departments/building', county: 'Broward' },
  'Pompano Beach': { url: 'https://www.pompanobeachfl.gov/government/departments/development-services/building-division', county: 'Broward' },
  'Palm Beach County': { url: 'https://discover.pbcgov.org/pzb/building', county: 'Palm Beach' },
  'Fort Lauderdale': { url: 'https://www.fortlauderdale.gov/departments/sustainable-development/development-services', county: 'Broward' },
  'City of Miami': { url: 'https://www.miamigov.com/Government/Departments-Organizations/Building', county: 'Miami-Dade' },
};

async function pollCrawlJob(firecrawlApiKey: string, jobId: string, maxAttempts = 30): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const response = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
      headers: { 'Authorization': `Bearer ${firecrawlApiKey}` },
    });

    if (!response.ok) {
      console.error(`Poll attempt ${i + 1} failed:`, response.status);
      continue;
    }

    const data = await response.json();
    console.log(`Poll ${i + 1}: status=${data.status}, completed=${data.completed}/${data.total}`);

    if (data.status === 'completed') return data;
    if (data.status === 'failed' || data.status === 'cancelled') {
      throw new Error(`Crawl ${data.status}: ${data.error || 'Unknown'}`);
    }
  }
  throw new Error('Crawl timed out after maximum polling attempts');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { department, action } = await req.json();

    if (!department) {
      return new Response(
        JSON.stringify({ success: false, error: 'department is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve dept: try DB first, fall back to hardcoded map
    let dept: { url: string; county: string } | null = null;
    const { data: dbDept } = await supabase
      .from('permit_building_departments')
      .select('name, county, website, portal_url')
      .eq('name', department)
      .maybeSingle();
    if (dbDept) {
      const raw = dbDept.website || dbDept.portal_url;
      if (raw) {
        dept = { url: raw.startsWith('http') ? raw : `https://${raw}`, county: dbDept.county || 'Unknown' };
      }
    }
    if (!dept && SOUTH_FL_DEPARTMENTS[department]) {
      dept = SOUTH_FL_DEPARTMENTS[department];
    }
    if (!dept) {
      return new Response(
        JSON.stringify({ success: false, error: `Department "${department}" not found and no website on record` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`Processing ${department}: ${action} at ${dept.url}`);

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('firecrawl_crawl_jobs')
      .insert({
        job_type: action === 'map' ? 'building_dept_map' : 'permit_docs_crawl',
        target_url: dept.url,
        target_department: department,
        status: 'running',
        config: { department, county: dept.county, action },
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (jobError) throw jobError;

    if (action === 'map') {
      // Step 1: Map the site to discover URLs
      const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: dept.url,
          search: 'permit forms applications building requirements documents',
          limit: 200,
          includeSubdomains: true,
        }),
      });

      const mapData = await mapResponse.json();

      if (!mapResponse.ok || !mapData.success) {
        await supabase.from('firecrawl_crawl_jobs').update({
          status: 'failed', error_message: mapData.error || 'Map failed', completed_at: new Date().toISOString(),
        }).eq('id', job.id);
        return new Response(
          JSON.stringify({ success: false, error: mapData.error || 'Map failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const allUrls: string[] = mapData.links || [];
      const permitUrls = allUrls.filter(u => {
        const lower = u.toLowerCase();
        return lower.endsWith('.pdf') || lower.includes('permit') || lower.includes('form') ||
          lower.includes('application') || lower.includes('building') || lower.includes('document');
      });

      console.log(`Map found ${allUrls.length} total URLs, ${permitUrls.length} permit-related`);

      // Store discovered URLs
      let docsFound = 0;
      for (const url of permitUrls.slice(0, 200)) {
        const isPdf = url.toLowerCase().endsWith('.pdf');
        await supabase.from('firecrawl_discovered_documents').insert({
          crawl_job_id: job.id,
          source_url: url,
          document_type: isPdf ? 'pdf' : 'webpage',
          title: decodeURIComponent(url.split('/').pop() || url).replace(/[-_]/g, ' ').substring(0, 200),
          department,
          county: dept.county,
          file_url: isPdf ? url : null,
          metadata: { discovered_via: 'map' },
        });
        docsFound++;
      }

      await supabase.from('firecrawl_crawl_jobs').update({
        status: 'completed',
        documents_found: docsFound,
        results_summary: { total_urls: allUrls.length, permit_urls: permitUrls.length },
        completed_at: new Date().toISOString(),
      }).eq('id', job.id);

      return new Response(
        JSON.stringify({ success: true, jobId: job.id, totalUrls: allUrls.length, permitUrls: permitUrls.length, docsFound }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Step 2: Crawl for permit documents
      const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: dept.url,
          limit: 50,
          maxDepth: 3,
          includePaths: ['*permit*', '*form*', '*application*', '*building*', '*document*'],
          scrapeOptions: { formats: ['markdown', 'links'] },
        }),
      });

      const crawlData = await crawlResponse.json();

      if (!crawlResponse.ok || !crawlData.success) {
        await supabase.from('firecrawl_crawl_jobs').update({
          status: 'failed', error_message: crawlData.error || 'Crawl start failed', completed_at: new Date().toISOString(),
        }).eq('id', job.id);
        return new Response(
          JSON.stringify({ success: false, error: crawlData.error || 'Crawl start failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store the firecrawl job ID
      const firecrawlJobId = crawlData.id;
      await supabase.from('firecrawl_crawl_jobs').update({
        firecrawl_job_id: firecrawlJobId,
      }).eq('id', job.id);

      console.log(`Crawl started with Firecrawl job ID: ${firecrawlJobId}`);

      // Poll for results
      let crawlResult;
      try {
        crawlResult = await pollCrawlJob(FIRECRAWL_API_KEY, firecrawlJobId);
      } catch (pollError) {
        await supabase.from('firecrawl_crawl_jobs').update({
          status: 'failed',
          error_message: pollError instanceof Error ? pollError.message : 'Poll failed',
          completed_at: new Date().toISOString(),
        }).eq('id', job.id);
        return new Response(
          JSON.stringify({ success: false, error: 'Crawl timed out or failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Process crawled pages and extract PDF links
      let docsFound = 0;
      let docsDownloaded = 0;
      const pages = crawlResult.data || [];

      for (const page of pages) {
        const links: string[] = page.links || [];
        const pdfLinks = links.filter((l: string) => l.toLowerCase().endsWith('.pdf'));

        for (const pdfUrl of pdfLinks) {
          // Download and store PDF
          let storagePath: string | null = null;
          let fileSize = 0;
          try {
            const pdfResponse = await fetch(pdfUrl);
            if (pdfResponse.ok) {
              const buffer = await pdfResponse.arrayBuffer();
              fileSize = buffer.byteLength;
              if (fileSize > 1000) {
                const safeName = pdfUrl.split('/').pop()?.replace(/[^a-zA-Z0-9.-]/g, '-') || `doc-${Date.now()}.pdf`;
                storagePath = `firecrawl/${dept.county}/${department.replace(/\s+/g, '-')}/${safeName}`;

                const { error: uploadError } = await supabase.storage
                  .from('permit-documents')
                  .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true });

                if (!uploadError) docsDownloaded++;
                else storagePath = null;
              }
            }
          } catch (e) {
            console.warn(`Failed to download ${pdfUrl}:`, e);
          }

          await supabase.from('firecrawl_discovered_documents').insert({
            crawl_job_id: job.id,
            source_url: pdfUrl,
            document_type: 'pdf',
            title: decodeURIComponent(pdfUrl.split('/').pop() || '').replace(/[-_]/g, ' ').substring(0, 200),
            department,
            county: dept.county,
            file_url: pdfUrl,
            storage_path: storagePath,
            file_size: fileSize,
            content_markdown: page.markdown?.substring(0, 5000) || null,
            is_downloaded: !!storagePath,
            metadata: { source_page: page.metadata?.sourceURL },
          });
          docsFound++;
        }
      }

      await supabase.from('firecrawl_crawl_jobs').update({
        status: 'completed',
        documents_found: docsFound,
        documents_downloaded: docsDownloaded,
        results_summary: { pages_crawled: pages.length, pdfs_found: docsFound, pdfs_downloaded: docsDownloaded },
        completed_at: new Date().toISOString(),
      }).eq('id', job.id);

      return new Response(
        JSON.stringify({ success: true, jobId: job.id, pagesCrawled: pages.length, docsFound, docsDownloaded }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Permit docs crawler error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
