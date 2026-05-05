// Chained background runner for bulk PDF field extraction.
// Each invocation processes ONE template, then self-invokes for the next one.
// This avoids any single invocation hitting the 60s edge-function timeout.
//
// Trigger:
//   POST { action: "start", scopeTemplateId?: uuid }   -> creates a job, kicks off chain
//   POST { action: "process", jobId: uuid }            -> processes ONE template for jobId
//
// The admin UI calls "start" once and then polls field_extraction_jobs by job id.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function admin() {
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

async function chainNext(jobId: string) {
  // fire-and-forget self-invocation so we return immediately
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/permit-field-extraction-runner`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
      },
      body: JSON.stringify({ action: "process", jobId }),
    });
  } catch (err) {
    console.error("[runner] chain self-invoke failed", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "start";
    const sb = admin();

    // ---------- START ----------
    if (action === "start") {
      const scopeTemplateId: string | undefined = body?.scopeTemplateId;
      const triggeredBy: string | null = body?.triggeredBy ?? null;

      // Build template id list to process
      let q = sb
        .from("permit_form_templates")
        .select("id, form_name")
        .not("file_path", "is", null);

      if (scopeTemplateId) {
        q = q.eq("id", scopeTemplateId);
      } else {
        q = q.not("file_path", "ilike", "pending/%");
      }

      const { data: tpls, error: tplErr } = await q;
      if (tplErr) throw tplErr;

      const ids = (tpls || []).map((t) => t.id);
      if (ids.length === 0) {
        return new Response(
          JSON.stringify({ error: "No templates to process" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: job, error: jobErr } = await sb
        .from("field_extraction_jobs")
        .insert({
          status: "queued",
          total_templates: ids.length,
          template_ids: ids,
          scope_template_id: scopeTemplateId ?? null,
          triggered_by: triggeredBy,
        })
        .select("id")
        .single();
      if (jobErr) throw jobErr;

      console.log(`[runner] start job=${job.id} templates=${ids.length}`);

      // Kick off the chain (do not await)
      chainNext(job.id);

      return new Response(
        JSON.stringify({ success: true, jobId: job.id, total: ids.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---------- PROCESS ONE ----------
    if (action === "process") {
      const jobId: string = body?.jobId;
      if (!jobId) {
        return new Response(JSON.stringify({ error: "jobId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: job, error: jobErr } = await sb
        .from("field_extraction_jobs")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();
      if (jobErr || !job) throw jobErr ?? new Error("Job not found");
      if (job.status === "completed" || job.status === "failed") {
        return new Response(JSON.stringify({ ok: true, status: job.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ids: string[] = job.template_ids ?? [];
      const idx = job.processed ?? 0;

      if (idx >= ids.length) {
        await sb
          .from("field_extraction_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            current_template_id: null,
            current_template_name: null,
          })
          .eq("id", jobId);
        console.log(`[runner] job=${jobId} done`);
        return new Response(JSON.stringify({ ok: true, status: "completed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const templateId = ids[idx];

      // Mark running + current template
      const { data: tpl } = await sb
        .from("permit_form_templates")
        .select("id, form_name, file_path")
        .eq("id", templateId)
        .maybeSingle();

      await sb
        .from("field_extraction_jobs")
        .update({
          status: "running",
          started_at: job.started_at ?? new Date().toISOString(),
          current_template_id: templateId,
          current_template_name: tpl?.form_name ?? null,
        })
        .eq("id", jobId);

      console.log(
        `[runner] job=${jobId} idx=${idx}/${ids.length} template=${tpl?.form_name ?? templateId}`
      );

      let ok = false;
      let errorMsg: string | null = null;

      try {
        if (!tpl?.file_path || tpl.file_path.startsWith("pending/")) {
          throw new Error("Template missing file_path or still pending upload");
        }

        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/permit-form-extractor`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SERVICE_KEY}`,
              apikey: SERVICE_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              templateId,
              filePath: tpl.file_path,
              autoMap: true,
            }),
          }
        );
        const txt = await res.text();
        if (!res.ok) throw new Error(`extractor ${res.status}: ${txt.slice(0, 200)}`);
        ok = true;
        console.log(`[runner] job=${jobId} template=${templateId} ok`);
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[runner] job=${jobId} template=${templateId} FAIL`, errorMsg);
      }

      // Update progress
      const newProcessed = idx + 1;
      const updates: Record<string, unknown> = {
        processed: newProcessed,
        succeeded: (job.succeeded ?? 0) + (ok ? 1 : 0),
        failed: (job.failed ?? 0) + (ok ? 0 : 1),
      };
      if (!ok) {
        const log = Array.isArray(job.error_log) ? job.error_log : [];
        log.push({
          template_id: templateId,
          template_name: tpl?.form_name ?? null,
          error: errorMsg,
          at: new Date().toISOString(),
        });
        updates.error_log = log;
      }
      if (newProcessed >= ids.length) {
        updates.status = "completed";
        updates.completed_at = new Date().toISOString();
        updates.current_template_id = null;
        updates.current_template_name = null;
      }

      await sb.from("field_extraction_jobs").update(updates).eq("id", jobId);

      // Chain next iteration if more remain
      if (newProcessed < ids.length) {
        chainNext(jobId);
      }

      return new Response(
        JSON.stringify({ ok: true, processed: newProcessed, total: ids.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[runner] fatal", err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
