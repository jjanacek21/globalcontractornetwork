import { PDFDocument } from "pdf-lib";
import { supabase } from "@/integrations/supabase/client";

/**
 * Filling the jurisdiction's own permit application from the project record.
 *
 * The county forms are real AcroForm PDFs, so this fills the actual document the
 * counter expects rather than generating a look-alike. Two of them are mapped so
 * far and both are the countywide form every municipality in that county accepts:
 *
 *   Broward County Uniform Building Permit Application  (107 fields)
 *   Miami-Dade Universal Permit Application             (202 fields)
 *
 * The map lives in permit_form_templates.field_mapping rather than in this file,
 * so adding a county is a data change. Broward's PDF names its fields with bare
 * numbers ("33", "47"), which is why the map is worth storing and verifying once
 * instead of re-deriving it.
 *
 * Nothing here signs anything. Signature and notary fields are deliberately left
 * empty — the contractor prints the result, signs it, has the owner sign, and
 * uploads the executed copy.
 */

/** Every value a form map is allowed to ask for. */
type SourceKey =
  | "property_address"
  | "property_city"
  | "property_state"
  | "property_zip"
  | "folio"
  | "legal_description"
  | "square_footage"
  | "valuation"
  | "scope_description"
  | "today"
  | "owner_name"
  | "owner_phone"
  | "owner_email"
  | "owner_address"
  | "owner_city"
  | "owner_state"
  | "owner_zip"
  | "contractor_company"
  | "contractor_phone"
  | "contractor_email"
  | "contractor_address"
  | "contractor_city"
  | "contractor_state"
  | "contractor_zip"
  | "qualifier_name"
  | "license_number"
  | "lender_name"
  | "lender_address"
  | "surety_name";

/** Conditions a checkbox in a map may be keyed on. */
type FlagKey =
  | "always"
  | "new_construction"
  | "reroof_or_repair"
  | "reroof_replacement"
  | "recover_overlay";

interface FieldMapping {
  version?: number;
  text?: Record<string, SourceKey>;
  checks?: Record<string, FlagKey>;
}

export interface FormTemplate {
  id: string;
  form_name: string;
  form_type: string;
  county: string | null;
  file_path: string;
  field_mapping: FieldMapping;
  requires_notary: boolean | null;
  instructions: string | null;
}

export interface FilledForm {
  bytes: Uint8Array;
  fileName: string;
  template: FormTemplate;
  /** Mapped fields the project had nothing to put in. */
  blanks: { field: string; needs: string }[];
}

/** Human labels, used when telling the contractor what is still blank. */
const LABELS: Record<string, string> = {
  property_address: "Property address",
  property_city: "Property city",
  folio: "Folio / parcel number",
  legal_description: "Legal description",
  square_footage: "Roof area",
  valuation: "Job value",
  scope_description: "Description of work",
  owner_name: "Owner name",
  owner_phone: "Owner phone",
  owner_email: "Owner email",
  owner_address: "Owner mailing address",
  owner_city: "Owner city",
  owner_state: "Owner state",
  owner_zip: "Owner ZIP",
  contractor_company: "Contracting company",
  contractor_phone: "Company phone",
  contractor_email: "Company email",
  contractor_address: "Company address",
  qualifier_name: "Qualifier name",
  license_number: "Qualifier license number",
  lender_name: "Mortgage lender",
  lender_address: "Lender address",
  surety_name: "Bonding company",
};

const BUCKET = "permit-form-templates";

function text(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  return String(v).trim();
}

function money(v: unknown): string {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || !Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/**
 * Which application this jurisdiction uses. The department's own row wins; the
 * county is the fallback, because a Broward city permit is pulled on the Broward
 * countywide form. Only templates we have actually mapped are eligible — an
 * unmapped template would produce a blank PDF and look like a bug.
 */
export async function findApplicationTemplate(dept: {
  id?: string | null;
  county?: string | null;
}): Promise<FormTemplate | null> {
  const { data, error } = await supabase
    .from("permit_form_templates")
    .select(
      "id, form_name, form_type, county, file_path, field_mapping, requires_notary, instructions, building_dept_id",
    )
    .eq("form_type", "permit_application");
  if (error) throw error;

  const mapped = ((data ?? []) as unknown as (FormTemplate & {
    building_dept_id: string | null;
  })[]).filter((t) => t.field_mapping && t.field_mapping.text);

  return (
    mapped.find((t) => dept.id && t.building_dept_id === dept.id) ??
    mapped.find((t) => dept.county && t.county === dept.county) ??
    null
  );
}

interface FillContext {
  values: Partial<Record<SourceKey, string>>;
  flags: Partial<Record<FlagKey, boolean>>;
}

function buildContext(
  p: Record<string, unknown>,
  contractor: Record<string, unknown> | null,
): FillContext {
  const work = text(p.roof_work_type ?? p.permit_type).toLowerCase();
  const isNewConstruction = /new construction/.test(work);
  const isOverlay = /recover|overlay/.test(work);
  const isReplacement = !isNewConstruction && !isOverlay && /replace|tear|re-?roof|roof/.test(work);

  return {
    values: {
      property_address: text(p.property_address),
      property_city: text(p.city),
      property_state: text(p.state) || "FL",
      property_zip: text(p.zip_code),
      folio: text(p.folio_number) || text(p.parcel_id),
      legal_description: text(p.legal_description),
      square_footage: text(p.roof_size_sqft) || text(p.square_footage),
      valuation: money(p.valuation),
      scope_description: text(p.scope_description),
      today: new Date().toLocaleDateString("en-US"),
      owner_name: text(p.owner_name) || text(p.customer_name),
      owner_phone: text(p.owner_phone) || text(p.customer_phone),
      owner_email: text(p.owner_email) || text(p.customer_email),
      owner_address: text(p.owner_address) || text(p.property_address),
      owner_city: text(p.owner_city) || text(p.city),
      owner_state: text(p.owner_state) || text(p.state) || "FL",
      owner_zip: text(p.owner_zip) || text(p.zip_code),
      contractor_company: text(contractor?.company_name),
      contractor_phone: text(contractor?.phone),
      contractor_email: text(contractor?.email),
      contractor_address: text(contractor?.address),
      contractor_city: "",
      contractor_state: "FL",
      contractor_zip: "",
      qualifier_name: text(contractor?.contact_name),
      license_number: text(contractor?.license_number),
      lender_name: text(p.lender_name),
      lender_address: text(p.lender_address),
      surety_name: text(p.surety_name),
    },
    flags: {
      always: true,
      new_construction: isNewConstruction,
      reroof_or_repair: !isNewConstruction && (isOverlay || isReplacement),
      reroof_replacement: isReplacement,
      recover_overlay: isOverlay,
    },
  };
}

export async function fillPermitApplication(projectId: string): Promise<FilledForm> {
  const { data: project, error: projErr } = await supabase
    .from("permit_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (projErr) throw projErr;
  if (!project) throw new Error("Permit project not found");
  const p = project as unknown as Record<string, unknown>;

  const [deptRes, contractorRes] = await Promise.all([
    p.building_dept_id
      ? supabase
          .from("permit_building_departments")
          .select("id, name, county")
          .eq("id", p.building_dept_id as string)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    p.contractor_id
      ? supabase
          .from("permit_contractors")
          .select("company_name, contact_name, phone, email, address, license_number")
          .eq("id", p.contractor_id as string)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const dept = (deptRes.data ?? null) as { id: string; name: string; county: string } | null;
  const template = await findApplicationTemplate({
    id: dept?.id,
    county: dept?.county ?? text(p.jurisdiction_county),
  });
  if (!template) {
    throw new Error(
      dept?.name
        ? `No mapped permit application for ${dept.name} yet.`
        : "Set the building department on this project first.",
    );
  }

  const { data: file, error: dlErr } = await supabase.storage
    .from(BUCKET)
    .download(template.file_path);
  if (dlErr) throw dlErr;

  /* County forms are frequently saved with permissions encryption set. That flag
     only asks a viewer to be polite about editing; the contractor is entitled to
     fill their own application, so it is ignored. */
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const form = pdf.getForm();

  /* Some county PDFs ship with a damaged cross-reference table. The page content
     still renders, but the form dictionary comes back empty, and filling it would
     silently hand back an untouched blank. Say so instead. */
  if (form.getFields().length === 0) {
    throw new Error(
      `${template.form_name} needs a repaired copy uploaded — its form fields are unreadable.`,
    );
  }
  const ctx = buildContext(p, contractorRes.data as Record<string, unknown> | null);

  const blanks: { field: string; needs: string }[] = [];

  for (const [pdfField, source] of Object.entries(template.field_mapping.text ?? {})) {
    const value = ctx.values[source] ?? "";
    if (!value) {
      /* Report each missing input once, not once per field that wanted it —
         the Broward form asks for the address twice. */
      if (!blanks.some((b) => b.needs === source)) {
        blanks.push({ field: pdfField, needs: LABELS[source] ?? source });
      }
      continue;
    }
    try {
      form.getTextField(pdfField).setText(value);
    } catch {
      /* A field named in the map is not in this build of the PDF. The county
         reissues these forms, so skip it rather than failing the whole packet. */
      console.warn(`permit form: no text field "${pdfField}" in ${template.form_name}`);
    }
  }

  for (const [pdfField, flag] of Object.entries(template.field_mapping.checks ?? {})) {
    if (!ctx.flags[flag]) continue;
    try {
      form.getCheckBox(pdfField).check();
    } catch {
      console.warn(`permit form: no checkbox "${pdfField}" in ${template.form_name}`);
    }
  }

  /* Leave the fields editable. The contractor often has one correction to make
     at the kitchen table, and a flattened PDF forces a reprint. */
  const bytes = await pdf.save();

  const who = text(p.owner_name) || text(p.customer_name) || "permit";
  const fileName = `${template.form_name.replace(/[^\w]+/g, "-")}-${who.replace(/[^\w]+/g, "-")}.pdf`;

  return { bytes, fileName, template, blanks };
}

/** Hand the filled application to the browser as a download. */
export function downloadFilledForm(filled: FilledForm) {
  const blob = new Blob([filled.bytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filled.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Keep a copy on the project so the packet has it and the checklist can see it.
 * Stored under the generated-forms folder, separate from what the contractor
 * uploads, because this one still needs signatures before it counts.
 */
export async function saveFilledForm(projectId: string, filled: FilledForm) {
  const path = `${projectId}/generated/${Date.now()}-${filled.fileName}`;
  const { error: upErr } = await supabase.storage
    .from("permit-documents")
    .upload(path, new Blob([filled.bytes as unknown as BlobPart], { type: "application/pdf" }), {
      contentType: "application/pdf",
      upsert: true,
    });
  if (upErr) throw upErr;

  const { error: rowErr } = await supabase.from("permit_project_documents").insert({
    project_id: projectId,
    document_type: "permit_application_unsigned",
    file_name: filled.fileName,
    file_path: path,
    validation_status: "needs_signature",
    validation_notes: "Filled from the project. Print, sign, and upload the executed copy.",
  });
  if (rowErr) throw rowErr;

  return path;
}
