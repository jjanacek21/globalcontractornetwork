import { supabase } from "@/integrations/supabase/client";

/**
 * What this permit packet still needs.
 *
 * This runs in the browser rather than in an edge function, and that is
 * deliberate. Nothing here needs a service-role key: the requirement lists are
 * public reference data, and the project and its documents are already readable
 * by their owner under RLS. Keeping it client-side means it ships with the
 * frontend on every deploy.
 *
 * A language model is never asked what is required. The building department
 * publishes what it wants, so the checklist is READ from
 * permit_required_documents for this jurisdiction and trade, merged with the
 * items Florida requires everywhere, matched against what has actually been
 * uploaded, and the completion number is counted rather than estimated.
 *
 * Every requirement carries HOW it gets satisfied, because that is the thing a
 * contractor actually needs to be told:
 *
 *   generated          we fill it and hand it back
 *   print_sign_upload  we fill it, they print, sign or notarize, and upload
 *   auto_sourced       we pull it from the product approval library
 *   upload             only they can supply it — license, insurance, comp
 */

export type Fulfilment = "generated" | "print_sign_upload" | "auto_sourced" | "upload";

export interface Requirement {
  key: string;
  name: string;
  required: boolean;
  fulfilment: Fulfilment;
  instruction: string;
  satisfied: boolean;
  satisfiedBy?: string;
}

export interface MissingField {
  field: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface UserAction {
  docType: string;
  name: string;
  how: Fulfilment;
  instruction: string;
}

export interface PacketAnalysis {
  projectId: string;
  jurisdiction: string | null;
  isHvhz: boolean;
  /** "jurisdiction" when the county published its own list, else the FL baseline. */
  requirementSource: "jurisdiction" | "florida_baseline";
  completionPercentage: number;
  packetReady: boolean;
  requirements: Requirement[];
  missingFields: MissingField[];
  /** What the contractor has to go and do, in the order they would do it. */
  actionsForUser: UserAction[];
  /** What we handle for them — shown so they stop chasing it. */
  autoHandled: UserAction[];
}

/**
 * How each document gets satisfied, keyed by words that appear in the
 * department's own document_name. Order matters — first match wins, so the
 * narrow patterns sit above the broad ones.
 */
const RULES: Array<{
  match: RegExp;
  key: string;
  how: Fulfilment;
  instruction: string;
}> = [
  {
    match: /notice of commencement|\bnoc\b/i,
    key: "noc",
    how: "print_sign_upload",
    instruction:
      "We fill this from the job. Print it, have the owner sign it before a notary, record it with the county Clerk, then upload the recorded copy.",
  },
  {
    match: /permit application/i,
    key: "permit_application",
    how: "print_sign_upload",
    instruction:
      "We fill this from the job. Print it, have the qualifier and the owner sign, then upload the signed copy.",
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
    match: /affidavit/i,
    key: "product_approval_affidavit",
    how: "print_sign_upload",
    instruction:
      "We fill this from the products on the job. Print it, have the qualifier sign, then upload it.",
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
    instruction: "Required on older structures. Upload the survey.",
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
    instruction:
      "Pulled from the product approval library where the manufacturer publishes it.",
  },
];

/**
 * Required on every Florida job regardless of what a department bothered to
 * publish. Several of the curated lists omit license, insurance and comp —
 * every counter asks for them anyway, so they are merged in rather than
 * trusted to the list.
 */
const CORE = [
  "Permit Application",
  "Notice of Commencement (NOC)",
  "Qualifier License (CCC/CGC)",
  "General Liability Insurance",
  "Workers Compensation",
  "Signed Contract",
];

/** Used when a department has no curated list at all. */
const BASELINE = [...CORE, "Florida Product Approval / NOA"];

/**
 * A document uploaded under an older type name still counts. The uploader has
 * used short names ("license", "contract") for a while; the checklist keys are
 * longer. Both have to resolve to the same requirement.
 */
const ALIASES: Record<string, string> = {
  notice_of_commencement: "noc",
  permit_app: "permit_application",
  application: "permit_application",
  license: "qualifier_license",
  contractor_license: "qualifier_license",
  coi: "insurance",
  general_liability: "insurance",
  liability_insurance: "insurance",
  workers_compensation: "workers_comp",
  wc: "workers_comp",
  contract: "signed_contract",
  noa: "product_approval",
  product_approvals: "product_approval",
  measurement: "roof_layout",
  measurement_report: "roof_layout",
  asbestos: "asbestos_survey",
  hoa: "hoa_approval",
  roof_photos: "photos",
};

function classify(name: string) {
  for (const r of RULES) if (r.match.test(name)) return r;
  return {
    key: name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40),
    how: "upload" as Fulfilment,
    instruction: "Upload this document.",
  };
}

function normalizeUploadedType(t: string): string {
  const raw = String(t ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_");
  return ALIASES[raw] ?? raw;
}

interface ProjectRow {
  id: string;
  service_type: string | null;
  building_dept_id: string | null;
  contractor_id: string | null;
  property_address: string | null;
  owner_name: string | null;
  scope_description: string | null;
  roof_size_sqft: number | null;
  legal_description: string | null;
  folio_number: string | null;
  parcel_id: string | null;
  is_hvhz: boolean | null;
  roof_covering_noa: string | null;
  underlayment_noa: string | null;
  fastener_noa: string | null;
  license_numbers_json: Record<string, unknown> | null;
}

export async function analyzePermitPacket(projectId: string): Promise<PacketAnalysis> {
  const { data: project, error: projErr } = await supabase
    .from("permit_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (projErr) throw projErr;
  if (!project) throw new Error("Permit project not found");
  const p = project as unknown as ProjectRow;

  const [deptRes, uploadedRes, contractorRes] = await Promise.all([
    p.building_dept_id
      ? supabase
          .from("permit_building_departments")
          .select("id, name, county, city, is_hvhz")
          .eq("id", p.building_dept_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("permit_project_documents")
      .select("id, document_type, file_name, validation_status")
      .eq("project_id", projectId),
    p.contractor_id
      ? supabase
          .from("permit_contractors")
          .select("company_name, license_number")
          .eq("id", p.contractor_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const dept = deptRes.data as { id: string; name: string; is_hvhz: boolean } | null;
  const uploaded = (uploadedRes.data ?? []) as { document_type: string }[];
  const contractor = contractorRes.data as { license_number?: string } | null;

  /* ── the checklist, from the county rather than from a model ── */
  const trade = String(p.service_type ?? "roofing").toLowerCase();
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
  } else {
    /* Merge in anything universally required that this department left off its
       published list, so the packet does not arrive at the counter short. */
    const present = new Set(deptDocs.map((d) => classify(d.document_name).key));
    for (const name of CORE) {
      if (!present.has(classify(name).key)) {
        deptDocs.push({ document_name: name, is_required: true, notes: null });
      }
    }
  }

  const have = new Set(uploaded.map((d) => normalizeUploadedType(d.document_type)));

  /* NOAs count as satisfied once the job carries NOA numbers — we source those
     ourselves, so they are never the contractor's homework. */
  const hasNoaNumbers = Boolean(
    p.roof_covering_noa || p.underlayment_noa || p.fastener_noa,
  );

  const seen = new Set<string>();
  const requirements: Requirement[] = [];
  for (const d of deptDocs) {
    const rule = classify(d.document_name);
    if (seen.has(rule.key)) continue;
    seen.add(rule.key);

    const autoNoa = rule.key === "product_approval" && hasNoaNumbers;
    const satisfied = have.has(rule.key) || autoNoa;
    requirements.push({
      key: rule.key,
      name: d.document_name,
      required: d.is_required !== false,
      fulfilment: rule.how,
      instruction: d.notes || rule.instruction,
      satisfied,
      satisfiedBy: autoNoa ? "product approval library" : satisfied ? "uploaded" : undefined,
    });
  }

  /* ── fields the forms cannot be filled without ── */
  const licenseOnFile =
    contractor?.license_number ??
    (p.license_numbers_json && Object.values(p.license_numbers_json)[0]) ??
    null;

  const FIELDS: Array<[string, unknown, string]> = [
    ["Property address", p.property_address, "On every form, and it sets the jurisdiction."],
    ["Owner name", p.owner_name, "Goes on the permit application and the NOC."],
    ["Jurisdiction", dept?.name, "Determines which forms and which fee schedule apply."],
    ["Scope of work", p.scope_description, "Drives the permit type and the sub-documents."],
    ["Contractor license", licenseOnFile, "Verifies eligibility to pull the permit."],
    ["Roof area", p.roof_size_sqft, "Used for the fee calculation and the scope."],
    ["Legal description", p.legal_description, "Required on the Notice of Commencement."],
    [
      "Folio / parcel number",
      p.folio_number ?? p.parcel_id,
      "Required on the NOC and the application.",
    ],
  ];

  const missingFields: MissingField[] = FIELDS.filter(
    ([, v]) => v === null || v === undefined || v === "",
  ).map(([field, , reason]) => ({ field, reason, priority: "high" as const }));

  const requiredReqs = requirements.filter((r) => r.required);
  const doneCount = requiredReqs.filter((r) => r.satisfied).length;
  const fieldCount = FIELDS.length;
  const denom = requiredReqs.length + fieldCount;
  const completionPercentage =
    denom === 0
      ? 100
      : Math.round(((doneCount + (fieldCount - missingFields.length)) / denom) * 100);

  const outstanding = requiredReqs.filter((r) => !r.satisfied);
  const toAction = (r: Requirement): UserAction => ({
    docType: r.key,
    name: r.name,
    how: r.fulfilment,
    instruction: r.instruction,
  });

  return {
    projectId,
    jurisdiction: dept?.name ?? null,
    isHvhz: dept?.is_hvhz ?? p.is_hvhz ?? false,
    requirementSource: usingBaseline ? "florida_baseline" : "jurisdiction",
    completionPercentage,
    packetReady: outstanding.length === 0 && missingFields.length === 0,
    requirements,
    missingFields,
    actionsForUser: outstanding
      .filter((r) => r.fulfilment === "upload" || r.fulfilment === "print_sign_upload")
      .map(toAction),
    autoHandled: requirements
      .filter((r) => r.fulfilment === "generated" || r.fulfilment === "auto_sourced")
      .map(toAction),
  };
}
