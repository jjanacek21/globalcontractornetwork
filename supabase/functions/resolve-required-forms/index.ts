// Resolve required forms/documents for a permit project.
// Single source of truth merging permit_form_requirements + permit_packet_structures
// + permit_form_templates + permit_packets cache.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ResolvedItem {
  key: string;
  doc_type: string;
  order: number;
  source: string; // generated|auto_fill|auto_source|user_upload|city_specific
  template_id?: string | null;
  template_name?: string | null;
  field_mapping?: any;
  file_path?: string | null;
  view_url?: string | null;
  status: "included" | "pending" | "upload_required" | "sourcing" | "missing_pdf";
  cached_hash?: string | null;
  packet_row_id?: string | null;
  needs_signature?: boolean;
  needs_notary?: boolean;
  meta?: any;
}

function evalConditions(cond: any, ctx: Record<string, any>): boolean {
  if (!cond || typeof cond !== "object") return true;
  for (const [k, v] of Object.entries(cond)) {
    if (k.endsWith("_gte")) {
      const f = k.slice(0, -4);
      if (ctx[f] == null || Number(ctx[f]) < Number(v)) return false;
    } else if (k.endsWith("_lte")) {
      const f = k.slice(0, -4);
      if (ctx[f] == null || Number(ctx[f]) > Number(v)) return false;
    } else if (k.endsWith("_before")) {
      const f = k.slice(0, -7);
      if (ctx[f] == null || Number(ctx[f]) >= Number(v)) return false;
    } else if (k.endsWith("_after")) {
      const f = k.slice(0, -6);
      if (ctx[f] == null || Number(ctx[f]) <= Number(v)) return false;
    } else if (Array.isArray(v)) {
      if (!v.includes(ctx[k])) return false;
    } else {
      if (ctx[k] !== v) return false;
    }
  }
  return true;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { permit_project_id } = await req.json();
    if (!permit_project_id) {
      return new Response(JSON.stringify({ error: "permit_project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Project
    const { data: project, error: projErr } = await sb
      .from("permit_projects")
      .select("*")
      .eq("id", permit_project_id)
      .maybeSingle();
    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "project not found", details: projErr?.message }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx: Record<string, any> = {
      year_built: project.year_built ?? null,
      is_hvhz: project.is_hvhz ?? false,
      valuation: project.valuation ?? 0,
      roof_work_type: project.roof_work_type ?? project.work_type ?? null,
      work_type: project.work_type ?? null,
      permit_type: project.permit_type ?? project.service_type ?? null,
    };

    // 2) form_requirements rules
    const requiredTemplateIds = new Set<string>();
    if (project.building_dept_id && ctx.permit_type) {
      const { data: rules } = await sb
        .from("permit_form_requirements")
        .select("conditions, required_template_ids, priority")
        .eq("building_dept_id", project.building_dept_id)
        .eq("permit_type", ctx.permit_type)
        .order("priority", { ascending: false });
      for (const r of rules ?? []) {
        if (evalConditions(r.conditions, ctx)) {
          for (const id of r.required_template_ids ?? []) requiredTemplateIds.add(id);
        }
      }
    }

    // 3) Resolve packet_structure (city+material → city → county+material → county)
    const county = project.jurisdiction_county;
    const city = project.city;
    const trade = ctx.permit_type;
    const material = project.material_type ?? project.roof_material ?? null;
    const hvhz = !!ctx.is_hvhz;

    let structure: any = null;
    if (county && trade) {
      const tries = [
        { county, city, trade_type: trade, material_type: material, is_hvhz: hvhz },
        { county, city, trade_type: trade, is_hvhz: hvhz },
        { county, trade_type: trade, material_type: material, is_hvhz: hvhz },
        { county, trade_type: trade, is_hvhz: hvhz },
        { county, trade_type: trade },
      ];
      for (const filter of tries) {
        let q = sb.from("permit_packet_structures").select("*").eq("is_active", true);
        for (const [k, v] of Object.entries(filter)) {
          if (v == null || v === "") continue;
          q = q.eq(k, v);
        }
        const { data } = await q.limit(1);
        if (data && data[0]) {
          structure = data[0];
          break;
        }
      }
    }

    // 4) Fetch templates referenced by the rules
    const templateIds = Array.from(requiredTemplateIds);
    let templates: any[] = [];
    if (templateIds.length) {
      const { data: t } = await sb
        .from("permit_form_templates")
        .select("id, form_name, form_type, file_path, field_mapping, requires_signature, requires_notary, document_classification")
        .in("id", templateIds);
      templates = t ?? [];
    }

    // 5) Build merged item list
    const items: ResolvedItem[] = [];
    const docList: any[] = Array.isArray(structure?.document_structure) ? structure.document_structure : [];

    docList.forEach((d: any, idx: number) => {
      items.push({
        key: `struct:${d.type}:${d.order ?? idx}`,
        doc_type: d.type,
        order: d.order ?? idx + 1,
        source: d.source ?? "auto_fill",
        needs_signature: d.needs_signature ?? false,
        needs_notary: d.needs_notary ?? false,
        status: "pending",
        meta: d,
      });
    });

    let nextOrder = (items.reduce((m, i) => Math.max(m, i.order), 0) || 0) + 1;
    for (const tpl of templates) {
      items.push({
        key: `tpl:${tpl.id}`,
        doc_type: tpl.form_type || tpl.document_classification || tpl.form_name,
        order: nextOrder++,
        source: tpl.field_mapping ? "auto_fill" : "auto_source",
        template_id: tpl.id,
        template_name: tpl.form_name,
        field_mapping: tpl.field_mapping,
        file_path: tpl.file_path,
        needs_signature: tpl.requires_signature,
        needs_notary: tpl.requires_notary,
        status: "pending",
      });
    }

    // 6) Compute project hash for caching
    const hashInput = JSON.stringify({
      owner_name: project.owner_name,
      owner_email: project.owner_email,
      owner_phone: project.owner_phone,
      property_address: project.property_address,
      city: project.city,
      jurisdiction_county: project.jurisdiction_county,
      zip_code: project.zip_code,
      valuation: project.valuation,
      year_built: project.year_built,
      permit_type: ctx.permit_type,
      roof_work_type: ctx.roof_work_type,
      is_hvhz: ctx.is_hvhz,
      selected_products: project.selected_products,
    });
    const projectHash = await sha256Hex(hashInput);

    // 7) Hydrate cached packets by template_id-derived doc_type
    const { data: cached } = await sb
      .from("permit_packets")
      .select("id, packet_type, file_path, source_hash, documents_included")
      .eq("permit_request_id", permit_project_id);

    for (const item of items) {
      const match = (cached ?? []).find(
        (c: any) =>
          c.packet_type === item.doc_type ||
          (item.template_id && c.documents_included && JSON.stringify(c.documents_included).includes(item.template_id)),
      );
      if (match) {
        item.packet_row_id = match.id;
        item.cached_hash = match.source_hash;
        if (match.source_hash === projectHash && match.file_path) {
          item.status = "included";
          item.file_path = match.file_path;
        }
      }
    }

    return new Response(
      JSON.stringify({
        items,
        project_hash: projectHash,
        structure_id: structure?.id ?? null,
        rules_evaluated: templateIds.length,
        context: ctx,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[resolve-required-forms] error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
