import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * What this permit packet still needs.
 *
 * The previous version asked a language model to invent the requirement list
 * from a prompt. That is backwards for permitting: the building department
 * publishes what it wants, and guessing wrong means a rejection weeks later.
 * So the checklist is now READ from permit_required_documents for this
 * jurisdiction and trade, matched against what has actually been uploaded, and
 * the completion number is counted rather than estimated.
 *
 * Every requirement is labelled with HOW it gets satisfied, because that is the
 * thing a contractor actually needs to be told:
 *
 *   generated          we fill it and hand it back
 *   print_sign_upload  we fill it, they print, sign or notarize, and upload
 *   auto_sourced       we pull it from the product approval library
 *   upload             only they can supply it — license, insurance, comp
 *
 * A model is never asked what is required.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Fulfilment = "generated" | "print_sign_upload" | "auto_sourced" | "upload";

interface Requirement {
  key: string;
  name: string;
  required: boolean;
  fulfilment: Fulfilment;
  instruction: string;
  satisfied: boolean;
  satisfiedBy?: string;
}

/**
 * How each document gets satisfied, keyed by words that appear in the
 * department's own document_name. Order matters — first match wins, so the
 * narrow patterns sit above the broad ones.
 */
const RULES: Array<{ match: RegExp; key: string; how: Fulfilment; instruction: string }> = [
  {
    match: /notice of commencement|\bnoc\b/i,
    key: "noc",
    how: "print_sign_upload",
    instruction:
      "We fill this from the job. Print it, have the owner sign before a notary, record it with the county Clerk, then upload the recorded copy.",
  },
  {
    match: /permit application/i,
    key: "permit_application",
    how: "print_sign_upload",
    instruction:
      "We fill this from the job. Print it, have the qualifier and owner sign, then upload the signed copy.",
  },
  {
    match: /workers.?comp/i,
    key: "workers_comp",
    how: "upload",
    instruction:
      "Upload current workers compensation coverage, or the state exemption certificate.",
  },
  {
    match: /qualifier license|\bccc\b|\bcgc\b|license/i,
    key: "qualifier_license",
    how: "upload",
    instruction: "Upload the current state license for the person qualifying this job.",
  },
  {
    match: /liability|insurance|\bcoi\b/i,
    key: "insurance",
    how: "upload",
    instruction:
      "Upload the current certificate of insurance, with the building department named as certificate holder.",
  },
  {
    match: /noa|product approval/i,
    key: "product_approval",
    how: "auto_sourced",
    instruction:
      "We pull these from the product approval library using the NOA numbers on this job.",
  },
  {
    match: /contract/i,
    key: "signed_contract",
    how: "upload",
    instruction: "Upload the contract signed by the property owner.",
  },
  {
    match: /roof layout|measurement|diagram/i,
    key: "roof_layout",
    how: "generated",
    instruction: "Generated from the measurement on this job.",
  },
  {
    match: /wind mitigation/i,
    key: "wind_mitigation",
    how: "upload",
    instruction: "Upload the completed wind mitigation form.",
  },
  {
    match: /asbestos/i,
    key: "asbestos_survey",
    how: "upload",
    instruction: "Required on pre-1981 structures. Upload the survey.",
  },
  {
    match: /hoa|architectural/i,
    key: "hoa_approval",
    how: "upload",
    instruction: "Upload the HOA or architectural review approval letter.",
  },
  {
    match: /photo/i,
    key: "photos",
    how: "upload",
    instruction: "Upload photos of the existing roof.",
  },
  {
    match: /spec sheet/i,
    key: "spec_sheet",
    how: "auto_sourced",
    instruction: "Pulled from the product approval library where the manufacturer publishes it.",
  },
];

/** Used when a department has no curated list yet — the Florida baseline. */
const BASELINE = [
  "Permit Application",
  "Notice of Commencement (NOC)",
  "Qualifier License (CCC/CGC)",
  "General Liability Insurance",
  "Workers Compensation",
  "Signed Contract",
  "Florida Product Approval / NOA",
];

function classify(name: string) {
  for (const r of RULES) if (r.match.test(name)) return r;
  return {
    key: name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40),
    how: "upload" as Fulfilment,
    instruction: "Upload this document.",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const projectId: string | undefined = body.projectId ?? body.permitRequestId;
    if (!projectId) {
      return new Response(JSON.stringify({ success: false, error: "projectId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: project, error: projErr } = await supabase
      .from("permit_projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();
    if (projErr) throw projErr;
    if (!project) {
      return new Response(JSON.stringify({ success: false, error: "project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [deptRes, uploadedRes, contractorRes] = await Promise.all([
      project.building_dept_id
        ? supabase
            .from("permit_building_departments")
            .select("id, name, county, city, is_hvhz, website, submission_method")
            .eq("id", project.building_dept_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("permit_project_documents")
        .select("id, document_type, file_name, validation_status")
        .eq("project_id", projectId),
      project.contractor_id
        ? supabase
            .from("permit_contractors")
            .select("company_name, license_number")
            .eq("id", project.contractor_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const dept = deptRes.data as { id: string; name: string; is_hvhz: boolean } | null;
    const uploaded = (uploadedRes.data ?? []) as { document_type: string }[];
    const contractor = contractorRes.data as { license_number?: string } | null;

    /* ── the checklist, from the county rather than from a model ── */
    const trade = String(project.service_type ?? "roofing").toLowerCase();
    let deptDocs: { document_name: string; is_required: boolean; notes: string | null }[] = [];
    if (dept?.id) {
      const { data } = await supabase
        .from("permit_required_documents")
        .select("document_name, is_required, notes, sort_order")
        .eq("building_dept_id", dept.id)
        .eq("trade_type", trade)
        .order("sort_order");
      deptDocs = (data ?? []) as typeof deptDocs;
    }
    const usingBaseline = deptDocs.length === 0;
    if (usingBaseline) {
      deptDocs = BASELINE.map((d) => ({ document_name: d, is_required: true, notes: null }));
    }

    const have = new Set(uploaded.map((d) => String(d.document_type).toLowerCase()));

    const requirements: Requirement[] = deptDocs.map((d) => {
      const rule = classify(d.document_name);
      /* NOAs count as satisfied once the job carries NOA numbers — we source
         those ourselves, so they are never the contractor's homework. */
      const autoNoa =
        rule.key === "product_approval" &&
        Boolean(project.roof_covering_noa || project.underlayment_noa || project.fastener_noa);
      const satisfied = have.has(rule.key) || autoNoa;
      return {
        key: rule.key,
        name: d.document_name,
        required: d.is_required !== false,
        fulfilment: rule.how,
        instruction: d.notes || rule.instruction,
        satisfied,
        satisfiedBy: autoNoa ? "product approval library" : satisfied ? "uploaded" : undefined,
      };
    });

    /* ── fields the forms cannot be filled without ── */
    const FIELDS: Array<[string, unknown, string]> = [
      ["Property address", project.property_address, "On every form, and it sets the jurisdiction."],
      ["Owner name", project.owner_name, "Goes on the permit application and the NOC."],
      ["Jurisdiction", dept?.name, "Determines which forms and which fee schedule apply."],
      ["Scope of work", project.scope_description, "Drives the permit type and the sub-documents."],
      ["Contractor license", contractor?.license_number, "Verifies eligibility to pull the permit."],
      ["Roof area", project.roof_size_sqft, "Used for the fee calculation and the scope."],
      ["Legal description", project.legal_description, "Required on the Notice of Commencement."],
      [
        "Folio / parcel number",
        project.folio_number ?? project.parcel_id,
        "Required on the NOC and the application.",
      ],
    ];
    const missingFields = FIELDS.filter(([, v]) => v === null || v === undefined || v === "").map(
      ([field, , reason]) => ({ field, reason, priority: "high" as const }),
    );

    const requiredReqs = requirements.filter((r) => r.required);
    const doneCount = requiredReqs.filter((r) => r.satisfied).length;
    const fieldCount = FIELDS.length;
    const denom = requiredReqs.length + fieldCount;
    const completionPercentage =
      denom === 0
        ? 100
        : Math.round(((doneCount + (fieldCount - missingFields.length)) / denom) * 100);

    const outstanding = requiredReqs.filter((r) => !r.satisfied);
    const actionsForUser = outstanding.filter(
      (r) => r.fulfilment === "upload" || r.fulfilment === "print_sign_upload",
    );

    const result = {
      projectId,
      jurisdiction: dept?.name ?? null,
      isHvhz: dept?.is_hvhz ?? project.is_hvhz ?? false,
      requirementSource: usingBaseline ? "florida_baseline" : "jurisdiction",
      completionPercentage,
      packetReady: outstanding.length === 0 && missingFields.length === 0,
      requirements,
      missingFields,
      /* What the contractor has to go and do, in the order they would do it. */
      actionsForUser: actionsForUser.map((r) => ({
        docType: r.key,
        name: r.name,
        how: r.fulfilment,
        instruction: r.instruction,
      })),
      autoHandled: requirements
        .filter((r) => r.fulfilment === "generated" || r.fulfilment === "auto_sourced")
        .map((r) => ({ docType: r.key, name: r.name, how: r.fulfilment, satisfied: r.satisfied })),
      readyForPayment: outstanding.length === 0,
    };

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Gap detector error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze permit",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
