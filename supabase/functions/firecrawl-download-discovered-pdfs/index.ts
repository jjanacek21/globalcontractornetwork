import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/pdf,application/octet-stream,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

async function fetchAndUpload(supabase: any, doc: any): Promise<{ ok: boolean; storagePath?: string; size?: number; error?: string }> {
  if (!doc.file_url) return { ok: false, error: 'no file_url' };
  try {
    const resp = await fetch(doc.file_url, { headers: BROWSER_HEADERS, redirect: 'follow' });
    if (!resp.ok) return { ok: false, error: `http ${resp.status}` };
    const buf = new Uint8Array(await resp.arrayBuffer());
    if (buf.length < 5) return { ok: false, error: 'empty body' };
    // Verify %PDF magic bytes
    if (!(buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)) {
      return { ok: false, error: 'not a PDF (no %PDF magic)' };
    }
    const county = (doc.county || 'Unknown').replace(/\s+/g, '-');
    const dept = (doc.department || 'unknown').replace(/\s+/g, '-');
    const fname = safeName(doc.file_url.split('/').pop() || `${doc.id}.pdf`);
    const storagePath = `firecrawl/${county}/${dept}/${Date.now()}_${fname}`;
    const { error: upErr } = await supabase.storage
      .from('permit-documents')
      .upload(storagePath, buf, { contentType: 'application/pdf', upsert: true });
    if (upErr) return { ok: false, error: upErr.message };
    return { ok: true, storagePath, size: buf.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'fetch failed' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const { department, crawlJobId, documentIds, limit = 100 } = body;

    let query = supabase
      .from('firecrawl_discovered_documents')
      .select('id, file_url, department, county, storage_path, is_downloaded')
      .is('storage_path', null)
      .ilike('file_url', '%.pdf');

    if (department) query = query.eq('department', department);
    if (crawlJobId) query = query.eq('crawl_job_id', crawlJobId);
    if (documentIds?.length) query = query.in('id', documentIds);

    const { data: docs, error } = await query.limit(limit);
    if (error) throw error;

    let downloaded = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const doc of docs || []) {
      const res = await fetchAndUpload(supabase, doc);
      if (res.ok) {
        await supabase.from('firecrawl_discovered_documents').update({
          storage_path: res.storagePath,
          is_downloaded: true,
          file_size: res.size,
        }).eq('id', doc.id);
        downloaded++;
      } else {
        failed++;
        errors.push({ id: doc.id, url: doc.file_url, error: res.error });
      }
      // tiny gap to avoid hammering origin
      await new Promise(r => setTimeout(r, 150));
    }

    return new Response(
      JSON.stringify({ success: true, total: docs?.length || 0, downloaded, failed, errors: errors.slice(0, 20) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
