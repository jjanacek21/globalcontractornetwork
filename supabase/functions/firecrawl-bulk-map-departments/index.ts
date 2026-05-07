import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { departmentIds } = await req.json().catch(() => ({}));

    let q = supabase
      .from('permit_building_departments')
      .select('id, name, county, website, portal_url')
      .not('website', 'is', null);
    if (departmentIds?.length) q = q.in('id', departmentIds);

    const { data: depts, error } = await q;
    if (error) throw error;

    const summary: any[] = [];

    for (const dept of depts || []) {
      const url = dept.website || dept.portal_url;
      if (!url) continue;

      const fullUrl = url.startsWith('http') ? url : `https://${url}`;

      const { data: job } = await supabase.from('firecrawl_crawl_jobs').insert({
        job_type: 'building_dept_map',
        target_url: fullUrl,
        target_department: dept.name,
        status: 'running',
        config: { department: dept.name, county: dept.county, action: 'map', bulk: true },
        started_at: new Date().toISOString(),
      }).select('id').single();

      try {
        const mapResp = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: fullUrl,
            search: 'permit application form NOA checklist affidavit pdf',
            limit: 200,
            includeSubdomains: true,
          }),
        });
        const mapData = await mapResp.json();
        if (!mapResp.ok || !mapData.success) {
          await supabase.from('firecrawl_crawl_jobs').update({
            status: 'failed', error_message: mapData.error || 'map failed', completed_at: new Date().toISOString(),
          }).eq('id', job?.id);
          summary.push({ department: dept.name, ok: false, error: mapData.error || 'map failed' });
          continue;
        }
        const allUrls: string[] = mapData.links || [];
        const permitUrls = allUrls.filter(u => {
          const lo = u.toLowerCase();
          return lo.endsWith('.pdf') || lo.includes('permit') || lo.includes('form') ||
            lo.includes('application') || lo.includes('noa') || lo.includes('checklist');
        });

        let docsFound = 0;
        for (const u of permitUrls.slice(0, 200)) {
          const isPdf = u.toLowerCase().endsWith('.pdf');
          await supabase.from('firecrawl_discovered_documents').insert({
            crawl_job_id: job?.id,
            source_url: u,
            document_type: isPdf ? 'pdf' : 'webpage',
            title: decodeURIComponent(u.split('/').pop() || u).replace(/[-_]/g, ' ').substring(0, 200),
            department: dept.name,
            county: dept.county,
            file_url: isPdf ? u : null,
            metadata: { discovered_via: 'bulk_map' },
          });
          docsFound++;
        }

        await supabase.from('firecrawl_crawl_jobs').update({
          status: 'completed',
          documents_found: docsFound,
          results_summary: { total_urls: allUrls.length, permit_urls: permitUrls.length },
          completed_at: new Date().toISOString(),
        }).eq('id', job?.id);

        summary.push({ department: dept.name, ok: true, docsFound, totalUrls: allUrls.length });

        // Fire-and-forget downloader for this job
        supabase.functions.invoke('firecrawl-download-discovered-pdfs', {
          body: { crawlJobId: job?.id, limit: 200 },
        }).catch(() => {});
      } catch (e) {
        await supabase.from('firecrawl_crawl_jobs').update({
          status: 'failed', error_message: e instanceof Error ? e.message : 'map error', completed_at: new Date().toISOString(),
        }).eq('id', job?.id);
        summary.push({ department: dept.name, ok: false, error: e instanceof Error ? e.message : 'error' });
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    return new Response(
      JSON.stringify({ success: true, total: depts?.length || 0, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
