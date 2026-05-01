// Permit form template extractor + AI field mapper
// - Loads PDF from `permit-form-templates` bucket
// - Reads AcroForm field names via pdf-lib
// - Optionally AI-maps PDF field names -> canonical project fields
// - Persists rows in `permit_field_mappings` (template_id, pdf_field, our_field, field_type, is_required)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Canonical field catalog (kept in sync with src/pages/PermitQueensAdminTemplates.tsx OUR_FIELDS)
const CANONICAL_FIELDS: { id: string; label: string; aliases?: string[] }[] = [
  { id: "property_address", label: "Property Address", aliases: ["jobsite address", "site address", "project address"] },
  { id: "property_unit", label: "Property Unit/Suite" },
  { id: "property_city", label: "Property City" },
  { id: "property_state", label: "Property State" },
  { id: "property_zip", label: "Property ZIP" },
  { id: "folio_number", label: "Folio/Parcel #", aliases: ["folio", "parcel id", "parcel number"] },
  { id: "legal_description", label: "Legal Description" },
  { id: "flood_zone", label: "Flood Zone" },
  { id: "wind_speed_zone", label: "Wind Speed Zone" },
  { id: "owner_name", label: "Owner Name", aliases: ["property owner", "homeowner"] },
  { id: "owner_address", label: "Owner Address" },
  { id: "owner_city", label: "Owner City" },
  { id: "owner_state", label: "Owner State" },
  { id: "owner_zip", label: "Owner ZIP" },
  { id: "owner_phone", label: "Owner Phone" },
  { id: "owner_email", label: "Owner Email" },
  { id: "owner_fax", label: "Owner Fax" },
  { id: "tenant_name", label: "Tenant Name" },
  { id: "contractor_name", label: "Contractor Name" },
  { id: "contractor_company", label: "Contractor Company/DBA", aliases: ["company name", "business name"] },
  { id: "contractor_license", label: "Contractor License #", aliases: ["license number", "cgc", "cbc", "ccc"] },
  { id: "contractor_address", label: "Contractor Address" },
  { id: "contractor_suite", label: "Contractor Suite" },
  { id: "contractor_city", label: "Contractor City" },
  { id: "contractor_state", label: "Contractor State" },
  { id: "contractor_zip", label: "Contractor ZIP" },
  { id: "contractor_phone", label: "Contractor Phone" },
  { id: "contractor_fax", label: "Contractor Fax" },
  { id: "contractor_email", label: "Contractor Email" },
  { id: "contractor_qualifier", label: "Qualifier Name" },
  { id: "permit_type", label: "Permit Type" },
  { id: "scope_description", label: "Scope of Work", aliases: ["work description", "description of work"] },
  { id: "work_type", label: "Work Type" },
  { id: "valuation", label: "Project Valuation", aliases: ["estimated cost", "job value"] },
  { id: "square_footage", label: "Square Footage" },
  { id: "commencement_date", label: "Commencement Date" },
  { id: "expiration_date", label: "Expiration Date" },
  { id: "roof_work_type", label: "Roof Work Type" },
  { id: "roof_size_sqft", label: "Roof Size (sq ft)" },
  { id: "roof_pitch", label: "Roof Pitch" },
  { id: "roof_stories", label: "# of Stories" },
  { id: "existing_roof_material", label: "Existing Roof Material" },
  { id: "new_roof_material", label: "New Roof Material" },
  { id: "underlayment_product", label: "Underlayment Product" },
  { id: "underlayment_noa", label: "Underlayment NOA #" },
  { id: "roof_covering_product", label: "Roof Covering Product" },
  { id: "roof_covering_noa", label: "Roof Covering NOA #" },
  { id: "fastener_product", label: "Fastener Product" },
  { id: "fastener_noa", label: "Fastener NOA #" },
  { id: "deck_type", label: "Deck Type" },
  { id: "year_built", label: "Year Built" },
  { id: "building_type", label: "Building Type" },
  { id: "window_count", label: "Window Count" },
  { id: "door_count", label: "Door Count" },
  { id: "sliding_door_count", label: "Sliding Door Count" },
  { id: "frame_material", label: "Frame Material" },
  { id: "u_factor", label: "U-Factor" },
  { id: "shgc", label: "SHGC" },
  { id: "window_product", label: "Window Product" },
  { id: "window_noa", label: "Window NOA #" },
  { id: "door_product", label: "Door Product" },
  { id: "door_noa", label: "Door NOA #" },
  { id: "improvement_description", label: "Improvement Description" },
  { id: "lender_name", label: "Lender Name" },
  { id: "lender_address", label: "Lender Address" },
  { id: "bond_amount", label: "Bond Amount" },
  { id: "surety_name", label: "Surety Name" },
  { id: "is_hvhz", label: "Is HVHZ" },
  { id: "hvhz_protocol", label: "HVHZ Protocol" },
  { id: "energy_code_compliant", label: "Energy Code Compliant" },
  { id: "engineer_required", label: "Engineer Required" },
  { id: "date_today", label: "Today's Date", aliases: ["date"] },
  { id: "application_number", label: "Application Number" },
];

interface ExtractRequest {
  templateId: string;
  filePath: string;
  autoMap?: boolean; // if true, run AI mapping and persist permit_field_mappings rows
}

async function aiMapFields(
  pdfFields: string[],
  formContext: { jurisdiction?: string; form_name?: string; form_type?: string }
): Promise<Array<{ pdf_field: string; our_field: string | null; confidence: number }>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || pdfFields.length === 0) return [];

  const catalog = CANONICAL_FIELDS.map(
    (f) => `${f.id} (${f.label}${f.aliases ? ` — also: ${f.aliases.join(", ")}` : ""})`
  ).join("\n");

  const prompt = `You are mapping PDF AcroForm field names from a building permit form to canonical project fields.

Form context:
- Jurisdiction: ${formContext.jurisdiction ?? "Unknown"}
- Form name: ${formContext.form_name ?? "Unknown"}
- Form type: ${formContext.form_type ?? "Unknown"}

PDF field names to map:
${pdfFields.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Available canonical fields:
${catalog}

Return STRICT JSON: { "mappings": [ { "pdf_field": "<exact name>", "our_field": "<canonical id or null if no match>", "confidence": 0..1 } ] }
Use null for our_field when no canonical field is a clear match. Do not invent canonical ids.`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You map permit-form field names to canonical IDs. Output strict JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("AI mapping HTTP error", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    const mappings = Array.isArray(parsed?.mappings) ? parsed.mappings : [];
    const validIds = new Set(CANONICAL_FIELDS.map((f) => f.id));
    return mappings
      .filter((m: any) => m && typeof m.pdf_field === "string")
      .map((m: any) => ({
        pdf_field: String(m.pdf_field),
        our_field: m.our_field && validIds.has(m.our_field) ? m.our_field : null,
        confidence: typeof m.confidence === "number" ? m.confidence : 0.5,
      }));
  } catch (err) {
    console.error("AI mapping failed", err);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ExtractRequest;
    const { templateId, filePath, autoMap = true } = body;

    if (!templateId || !filePath) {
      return new Response(JSON.stringify({ error: "templateId and filePath required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load template metadata for AI context
    const { data: template } = await supabase
      .from("permit_form_templates")
      .select("id, form_name, form_type, jurisdiction_name")
      .eq("id", templateId)
      .maybeSingle();

    // Download PDF
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("permit-form-templates")
      .download(filePath);
    if (dlErr || !fileData) {
      return new Response(
        JSON.stringify({ error: "Failed to download PDF", details: dlErr?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const buf = new Uint8Array(await fileData.arrayBuffer());

    // Real AcroForm extraction via pdf-lib
    const fields: string[] = [];
    let isFillable = false;
    try {
      const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
      const form = pdf.getForm();
      const formFields = form.getFields();
      isFillable = formFields.length > 0;
      for (const f of formFields) {
        const name = f.getName();
        if (name && !fields.includes(name)) fields.push(name);
      }
    } catch (err) {
      console.warn("pdf-lib could not read form", err);
    }

    fields.sort();

    let savedMappings = 0;
    let aiMappings: Array<{ pdf_field: string; our_field: string | null; confidence: number }> = [];

    if (autoMap && fields.length > 0) {
      aiMappings = await aiMapFields(fields, {
        jurisdiction: template?.jurisdiction_name ?? undefined,
        form_name: template?.form_name ?? undefined,
        form_type: template?.form_type ?? undefined,
      });

      const rows = aiMappings
        .filter((m) => m.our_field) // only persist confident matches
        .map((m) => ({
          template_id: templateId,
          pdf_field: m.pdf_field,
          our_field: m.our_field as string,
          field_type: "text",
          is_required: false,
          notes: `AI-mapped (confidence ${m.confidence.toFixed(2)})`,
        }));

      if (rows.length > 0) {
        const { error: upErr } = await supabase
          .from("permit_field_mappings")
          .upsert(rows, { onConflict: "template_id,pdf_field" });
        if (upErr) console.error("Mapping upsert failed", upErr);
        else savedMappings = rows.length;
      }
    }

    await supabase
      .from("permit_form_templates")
      .update({
        is_fillable: isFillable,
        field_count: fields.length,
        last_analyzed_at: new Date().toISOString(),
        analysis_status: "complete",
        field_mapping: {
          extracted_count: fields.length,
          ai_mapped_count: savedMappings,
          extracted_at: new Date().toISOString(),
        },
      })
      .eq("id", templateId);

    return new Response(
      JSON.stringify({
        success: true,
        fields,
        count: fields.length,
        is_fillable: isFillable,
        ai_mappings: aiMappings,
        saved_mappings: savedMappings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("extractor error", err);
    return new Response(JSON.stringify({ error: "Internal error", details: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
