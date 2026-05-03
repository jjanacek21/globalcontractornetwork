import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bulletproof fetch: never hang forever. Defaults to 15s timeout.
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface PacketRequest {
  permitRequestId: string;
  includeDocuments?: string[];
  generateCoverSheet?: boolean;
  generateNOC?: boolean;
  selectedProducts?: Array<{
    id: string;
    manufacturer: string;
    product_name: string;
    noa_number?: string;
    file_url?: string;
    category?: string;  // Product category for filtering (underlayment, shingle, etc.)
  }>;
  uploadedDocuments?: Array<{
    type: string;
    name: string;
    url: string;
  }>;
  usePacketStructure?: boolean; // Use the new packet structures system
}

interface DocumentInfo {
  type: string;
  name: string;
  pages: number;
  url?: string;
  status: 'included' | 'generated' | 'missing' | 'needs_signature' | 'auto_sourced' | 'city_specific' | 'conditional' | 'not_required' | 'needs_sourcing' | 'failed_fetch';
  source?: 'auto_fill' | 'auto_source' | 'user_upload' | 'generated' | 'city_specific' | 'conditional';
  requiresNotary?: boolean;
  requiresRecording?: boolean;
  condition?: string;
  noaNumber?: string; // Include for manual lookup
  manufacturer?: string;
  productName?: string;
  // Per-document merge telemetry (populated by mergePdfDocuments)
  fetchError?: string;
  fetchSource?: 'primary' | 'fallback';
  merged?: boolean;
  mergedPages?: number;
}

interface PdfMergeItem {
  url: string;
  doc: DocumentInfo;
}

interface PacketStructureDocument {
  order: number;
  type: string;
  source: string;
  pages?: number;
  needs_notary?: boolean;
  needs_signature?: boolean;
  requires_recording?: boolean;
  city_specific?: boolean;
  condition?: string;
  sections?: string[];
  product_category?: string;
  include_full_report?: boolean;
  include_pe_seal?: boolean;
  test_type?: string;
}

async function generateCoverSheetPdf(permit: any, documentIndex: DocumentInfo[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let y = 750;
  const leftMargin = 50;
  const lineHeight = 15;
  
  // Title
  page.drawText('PERMIT APPLICATION PACKET', {
    x: leftMargin,
    y,
    size: 20,
    font: helveticaBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 35;
  
  // Horizontal line
  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: 562, y },
    thickness: 2,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 30;
  
  // Property Information Section
  page.drawText('PROPERTY INFORMATION', {
    x: leftMargin,
    y,
    size: 12,
    font: helveticaBold,
  });
  y -= 20;
  
  const propertyInfo = [
    ['Address:', permit.property_address || 'N/A'],
    ['City/County:', `${permit.city || ''}, ${permit.county || permit.jurisdiction_county || 'N/A'}`],
    ['Permit Type:', (permit.permit_type || permit.service_type || 'N/A').replace(/_/g, ' ').toUpperCase()],
  ];
  
  for (const [label, value] of propertyInfo) {
    page.drawText(label, { x: leftMargin, y, size: 10, font: helveticaBold });
    page.drawText(String(value), { x: leftMargin + 100, y, size: 10, font: helvetica });
    y -= lineHeight;
  }
  y -= 15;
  
  // Owner Information Section
  page.drawText('OWNER INFORMATION', {
    x: leftMargin,
    y,
    size: 12,
    font: helveticaBold,
  });
  y -= 20;
  
  const ownerInfo = [
    ['Owner:', permit.owner_name || permit.customer_name || 'N/A'],
    ['Phone:', permit.owner_phone || permit.customer_phone || 'N/A'],
    ['Email:', permit.owner_email || permit.customer_email || 'N/A'],
  ];
  
  for (const [label, value] of ownerInfo) {
    page.drawText(label, { x: leftMargin, y, size: 10, font: helveticaBold });
    page.drawText(String(value), { x: leftMargin + 100, y, size: 10, font: helvetica });
    y -= lineHeight;
  }
  y -= 15;
  
  // Scope of Work Section
  page.drawText('SCOPE OF WORK', {
    x: leftMargin,
    y,
    size: 12,
    font: helveticaBold,
  });
  y -= 20;
  
  const scope = permit.scope_of_work || permit.scope_description || 'See attached documents';
  const scopeText = typeof scope === 'string' ? scope.slice(0, 200) : 'See attached documents';
  page.drawText(scopeText, { x: leftMargin, y, size: 10, font: helvetica, maxWidth: 500 });
  y -= 30;
  
  // Valuation
  const valuation = permit.estimated_value || permit.valuation || 0;
  page.drawText('Estimated Value:', { x: leftMargin, y, size: 10, font: helveticaBold });
  page.drawText(`$${valuation.toLocaleString()}`, { x: leftMargin + 100, y, size: 10, font: helvetica });
  y -= 30;
  
  // Document Checklist Section
  page.drawText('DOCUMENT CHECKLIST', {
    x: leftMargin,
    y,
    size: 12,
    font: helveticaBold,
  });
  y -= 20;
  
  for (const doc of documentIndex) {
    // Use ASCII-compatible symbols for WinAnsi encoding
    const checkmark = doc.status === 'included' || doc.status === 'generated' || doc.status === 'auto_sourced' ? '[X]' : 
                      doc.status === 'needs_signature' ? '[S]' : 
                      doc.status === 'needs_sourcing' ? '[?]' : '[ ]';
    const statusColor = doc.status === 'included' || doc.status === 'generated' || doc.status === 'auto_sourced' ? rgb(0.2, 0.6, 0.2) :
                        doc.status === 'needs_signature' ? rgb(0.8, 0.5, 0.1) : 
                        doc.status === 'needs_sourcing' ? rgb(0.2, 0.4, 0.8) : rgb(0.5, 0.5, 0.5);
    
    page.drawText(checkmark, { x: leftMargin, y, size: 10, font: helvetica, color: statusColor });
    page.drawText(doc.name, { x: leftMargin + 30, y, size: 10, font: helvetica });
    
    if (doc.status === 'needs_signature') {
      page.drawText('(signature required)', { x: 400, y, size: 8, font: helvetica, color: rgb(0.8, 0.5, 0.1) });
    } else if (doc.status === 'needs_sourcing' && doc.noaNumber) {
      page.drawText(`(lookup: ${doc.noaNumber})`, { x: 400, y, size: 8, font: helvetica, color: rgb(0.2, 0.4, 0.8) });
    }
    y -= lineHeight;
    
    if (y < 80) break; // Don't go below footer
  }
  
  // Footer
  page.drawText(`Generated: ${new Date().toLocaleDateString()} | Total Documents: ${documentIndex.length}`, {
    x: leftMargin,
    y: 40,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page.drawText('Permit Expediting Service - Florida Building Permit Support', {
    x: leftMargin,
    y: 25,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return await pdfDoc.save();
}

// Resolve a working NOA PDF URL by NOA number when the primary URL fails or
// returns non-PDF content. Tries the DB first, then known Miami-Dade pattern,
// then falls back to the search-and-store edge function.
async function resolveNoaPdfByNumber(
  supabase: any,
  noaNumber: string,
  excludeUrl?: string,
): Promise<{ url: string; via: 'db' | 'pattern' | 'search' } | null> {
  if (!noaNumber) return null;
  try {
    // 1. DB lookup — find any product_approval row carrying this NOA number
    //    with a stored file_url that differs from the failing one.
    const { data: rows } = await supabase
      .from('product_approvals')
      .select('file_url, noa_pdf_url, fl_approval_pdf_url, source_status, updated_at')
      .eq('noa_number', noaNumber)
      .order('updated_at', { ascending: false })
      .limit(5);
    for (const r of rows || []) {
      const candidates = [r.file_url, r.noa_pdf_url, r.fl_approval_pdf_url].filter(Boolean) as string[];
      for (const c of candidates) {
        if (c && c !== excludeUrl) return { url: c, via: 'db' };
      }
    }

    // 2. Miami-Dade canonical PDF location
    const cleaned = noaNumber.replace(/^NOA\s*/i, '').replace(/\./g, '').trim();
    if (cleaned) {
      const tryUrl = `https://www.miamidade.gov/building/library/noa/${cleaned}.pdf`;
      if (tryUrl !== excludeUrl) {
        try {
          const head = await fetchWithTimeout(tryUrl, { method: 'HEAD' }, 6000);
          if (head.ok) return { url: tryUrl, via: 'pattern' };
        } catch (_) { /* ignore */ }
      }
    }

    // 3. Search-and-store fallback
    try {
      const { data: searchData } = await supabase.functions.invoke('search-and-store', {
        body: { query: `NOA ${noaNumber} product approval PDF`, documentType: 'product_approval' },
      });
      const found = searchData?.results?.[0]?.pdf_url || searchData?.url;
      if (found && found !== excludeUrl) return { url: found, via: 'search' };
    } catch (_) { /* ignore */ }
  } catch (e) {
    console.warn('[resolveNoaPdfByNumber] error:', e instanceof Error ? e.message : e);
  }
  return null;
}

// Fetch + validate a PDF URL. Returns parsed PDFDocument bytes or a failure reason.
async function fetchPdfBytes(
  url: string,
  supabase: any,
): Promise<{ ok: true; bytes: ArrayBuffer } | { ok: false; reason: string }> {
  if (!url) return { ok: false, reason: 'empty_url' };
  let fetchUrl = url;
  if (!url.startsWith('http')) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from('permit-documents')
      .createSignedUrl(url, 3600);
    if (signedError || !signedData?.signedUrl) {
      return { ok: false, reason: `signed_url_failed: ${signedError?.message || 'unknown'}` };
    }
    fetchUrl = signedData.signedUrl;
  }
  const isGovSite = fetchUrl.includes('miamidade.gov') || fetchUrl.includes('floridabuilding.org');
  let response: Response;
  try {
    response = await fetchWithTimeout(fetchUrl, {
      headers: isGovSite ? {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf,*/*',
      } : {},
    }, isGovSite ? 12000 : 20000);
  } catch (e) {
    return { ok: false, reason: `fetch_threw: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!response.ok) {
    return { ok: false, reason: `http_${response.status}` };
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('pdf') && !contentType.includes('octet-stream') && !isGovSite) {
    return { ok: false, reason: `non_pdf_content_type:${contentType.slice(0, 40)}` };
  }
  const bytes = await response.arrayBuffer();
  const header = new Uint8Array(bytes.slice(0, 5));
  if (!String.fromCharCode(...header).startsWith('%PDF')) {
    return { ok: false, reason: 'magic_bytes_mismatch' };
  }
  return { ok: true, bytes };
}

async function mergePdfDocuments(
  coverSheetBytes: Uint8Array,
  items: PdfMergeItem[],
  supabase: any,
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  let successfulMerges = 0;
  let failedMerges = 0;

  // Add cover sheet
  try {
    const coverPdf = await PDFDocument.load(coverSheetBytes);
    const coverPages = await mergedPdf.copyPages(coverPdf, coverPdf.getPageIndices());
    coverPages.forEach(page => mergedPdf.addPage(page));
    console.log('Cover sheet added successfully');
  } catch (e) {
    console.warn('Could not add cover sheet:', e);
  }

  for (const item of items) {
    if (!item.url) continue;
    const doc = item.doc;
    let used: 'primary' | 'fallback' = 'primary';

    let result = await fetchPdfBytes(item.url, supabase);

    // NOA fallback — re-resolve via DB / pattern / search if the primary URL failed.
    if (!result.ok && doc?.noaNumber) {
      console.log(`[merge-fallback] primary failed (${result.reason}) for NOA ${doc.noaNumber}, attempting fallback lookup`);
      const fallback = await resolveNoaPdfByNumber(supabase, doc.noaNumber, item.url);
      if (fallback) {
        const retry = await fetchPdfBytes(fallback.url, supabase);
        if (retry.ok) {
          result = retry;
          used = 'fallback';
          item.url = fallback.url;
          if (doc) {
            doc.url = fallback.url;
            doc.fetchSource = 'fallback';
          }
          console.log(`[merge-fallback] recovered NOA ${doc.noaNumber} via ${fallback.via}`);
        } else {
          console.log(`[merge-fallback] fallback URL also failed: ${retry.reason}`);
        }
      }
    }

    if (!result.ok) {
      failedMerges++;
      if (doc) {
        doc.merged = false;
        doc.status = 'failed_fetch';
        doc.fetchError = result.reason;
      }
      console.warn(`Failed to merge ${doc?.name || item.url}: ${result.reason}`);
      continue;
    }

    try {
      const srcPdf = await PDFDocument.load(result.bytes, { ignoreEncryption: true });
      const pageCount = srcPdf.getPageCount();
      if (pageCount === 0) throw new Error('no_pages');
      const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
      successfulMerges++;
      if (doc) {
        doc.merged = true;
        doc.mergedPages = pageCount;
        if (!doc.fetchSource) doc.fetchSource = used;
      }
    } catch (e) {
      failedMerges++;
      if (doc) {
        doc.merged = false;
        doc.status = 'failed_fetch';
        doc.fetchError = `parse_failed: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
  }

  console.log(`PDF merge complete: ${successfulMerges} successful, ${failedMerges} failed`);

  // Add page numbers
  const pages = mergedPdf.getPages();
  const helvetica = await mergedPdf.embedFont(StandardFonts.Helvetica);
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    page.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: width - 100, y: 15, size: 9, font: helvetica, color: rgb(0.4, 0.4, 0.4),
    });
  });

  return await mergedPdf.save();
}

// =====================================================================
// AUTO-FILL: load a template PDF, fill its AcroForm using mappings,
// fall back to top-of-page text overlay if no fillable fields exist.
// Returns filled PDF bytes (or null if template can't be loaded).
// =====================================================================
function transformValue(value: any, transform?: string | null): string {
  if (value === null || value === undefined || value === '') return '';
  switch (transform) {
    case 'uppercase': return String(value).toUpperCase();
    case 'lowercase': return String(value).toLowerCase();
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0);
    case 'date':
      try { return new Date(value).toLocaleDateString('en-US'); } catch { return String(value); }
    case 'phone': {
      const d = String(value).replace(/\D/g, '');
      return d.length === 10 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : String(value);
    }
    default: return String(value);
  }
}

async function ensureTemplateMappings(
  supabase: any,
  template: any,
  LOVABLE_API_KEY: string | undefined,
): Promise<Array<{ our_field: string; pdf_field: string; field_type?: string; transform_function?: string | null; default_value?: string | null }>> {
  // 1. Try existing linked mappings
  const { data: existing } = await supabase
    .from('permit_field_mappings')
    .select('our_field,pdf_field,field_type,transform_function,default_value')
    .eq('template_id', template.id);

  if (existing && existing.length > 0) return existing;

  // 2. Self-heal: download the PDF, extract field names, AI-map them
  if (!template.file_path) return [];

  try {
    const { data: fileData, error: dlErr } = await supabase.storage
      .from('permit-form-templates')
      .download(template.file_path);
    if (dlErr || !fileData) return [];

    const buf = new Uint8Array(await fileData.arrayBuffer());

    // Parse via pdf-lib to get real AcroForm field names
    let pdfFieldNames: string[] = [];
    try {
      const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const form = pdfDoc.getForm();
      pdfFieldNames = form.getFields().map((f: any) => f.getName()).filter(Boolean);
    } catch (e) {
      console.warn(`Could not parse AcroForm for template ${template.id}:`, e);
    }

    if (pdfFieldNames.length === 0) return [];

    // 3. AI-map PDF field names -> our_field keys
    if (!LOVABLE_API_KEY) return [];

    const ourFieldVocabulary = [
      'property_address','city','state','zip_code','county','folio_number','legal_description',
      'owner_name','owner_phone','owner_email','owner_address',
      'contractor_name','contractor_license','contractor_phone','contractor_email','contractor_address',
      'qualifier_name','qualifier_license',
      'permit_type','scope_of_work','valuation','square_footage',
      'insurance_company','insurance_policy',
      'date_today','signature','notary_signature',
    ];

    const aiResp = await fetchWithTimeout('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You map PDF AcroForm field names to canonical permit data keys. Reply with a JSON object only.' },
          { role: 'user', content: `PDF fields:\n${JSON.stringify(pdfFieldNames)}\n\nCanonical keys:\n${JSON.stringify(ourFieldVocabulary)}\n\nReturn JSON: { "mappings": [{ "pdf_field": "...", "our_field": "...", "field_type": "text|date|signature|checkbox" }] }. Skip fields that don't match.` },
        ],
        temperature: 0.1,
        max_tokens: 2500,
      }),
    }, 25000);

    if (!aiResp.ok) return [];
    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/) || [null, content];
    let parsed: any;
    try { parsed = JSON.parse(jsonMatch[1] || content); } catch { return []; }

    const mappings = (parsed?.mappings || []).filter((m: any) => m?.pdf_field && m?.our_field);
    if (mappings.length === 0) return [];

    // Cache for next time
    const rows = mappings.map((m: any) => ({
      template_id: template.id,
      pdf_field: m.pdf_field,
      our_field: m.our_field,
      field_type: m.field_type || 'text',
    }));
    await supabase.from('permit_field_mappings').upsert(rows, { onConflict: 'template_id,pdf_field' });
    console.log(`Self-healed ${rows.length} mappings for template ${template.form_name}`);
    return rows;
  } catch (e) {
    console.warn(`Self-heal failed for template ${template.id}:`, e);
    return [];
  }
}

async function fillTemplatePdf(
  supabase: any,
  template: any,
  projectData: Record<string, any>,
  LOVABLE_API_KEY: string | undefined,
): Promise<Uint8Array | null> {
  if (!template?.file_path) return null;

  try {
    const { data: fileData, error: dlErr } = await supabase.storage
      .from('permit-form-templates')
      .download(template.file_path);
    if (dlErr || !fileData) {
      console.warn(`Could not download template ${template.id}:`, dlErr);
      return null;
    }

    const pdfBytes = new Uint8Array(await fileData.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const mappings = await ensureTemplateMappings(supabase, template, LOVABLE_API_KEY);

    // Build pdf_field -> value lookup
    const filledData: Record<string, string> = {
      date_today: new Date().toLocaleDateString('en-US'),
    };
    for (const m of mappings) {
      const v = projectData[m.our_field];
      if (v !== undefined && v !== null && v !== '') {
        filledData[m.pdf_field] = transformValue(v, m.transform_function);
      } else if (m.default_value) {
        filledData[m.pdf_field] = m.default_value;
      }
    }

    // Try AcroForm fill
    let filledCount = 0;
    let hasForm = false;
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      hasForm = fields.length > 0;
      for (const field of fields) {
        const name = field.getName();
        const value = filledData[name];
        if (value === undefined) continue;
        try {
          const ctor = (field.constructor as any).name;
          if (ctor === 'PDFTextField') {
            (field as any).setText(String(value));
            filledCount++;
          } else if (ctor === 'PDFCheckBox') {
            const truthy = ['true','yes','y','1','x','checked'].includes(String(value).toLowerCase());
            if (truthy) (field as any).check();
            filledCount++;
          } else if (ctor === 'PDFDropdown' || ctor === 'PDFOptionList') {
            try { (field as any).select(String(value)); filledCount++; } catch {}
          }
        } catch (fe) {
          // skip unfillable individual field
        }
      }
      // Flatten so values render in all viewers
      try { form.flatten(); } catch (flatErr) { console.warn('Form flatten failed (non-fatal):', flatErr); }
    } catch (formErr) {
      console.warn(`No AcroForm on template ${template.id}:`, formErr);
    }

    // Fallback overlay: if no form fields were filled, stamp key info on page 1
    if (filledCount === 0 && !hasForm) {
      try {
        const page = pdfDoc.getPage(0);
        const { height } = page.getSize();
        const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const lines = [
          `Property: ${projectData.property_address || ''}`,
          `Owner: ${projectData.owner_name || ''}`,
          `Contractor: ${projectData.contractor_name || ''}  Lic: ${projectData.contractor_license || ''}`,
          `Scope: ${(projectData.scope_of_work || '').slice(0, 90)}`,
          `Valuation: $${projectData.valuation || projectData.estimated_value || 'TBD'}`,
        ];
        let y = height - 40;
        for (const line of lines) {
          page.drawText(line, { x: 40, y, size: 9, font: helv, color: rgb(0.1, 0.1, 0.1) });
          y -= 12;
        }
      } catch (overlayErr) {
        console.warn('Overlay fallback failed:', overlayErr);
      }
    }

    console.log(`Filled ${filledCount}/${mappings.length} fields on ${template.form_name}`);
    return await pdfDoc.save();
  } catch (e) {
    console.warn(`fillTemplatePdf error for template ${template?.id}:`, e);
    return null;
  }
}

async function uploadFilledTemplate(
  supabase: any,
  bytes: Uint8Array,
  permitRequestId: string,
  templateId: string,
): Promise<string | null> {
  try {
    const path = `packets/${permitRequestId}/filled/${templateId}-${Date.now()}.pdf`;
    const { error } = await supabase.storage
      .from('permit-documents')
      .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
    if (error) {
      console.warn('Failed to upload filled template:', error);
      return null;
    }
    return path; // mergePdfDocuments handles signed-URL conversion for storage paths
  } catch (e) {
    console.warn('uploadFilledTemplate threw:', e instanceof Error ? e.message : e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      permitRequestId, 
      includeDocuments, 
      generateCoverSheet = true, 
      generateNOC = true,
      selectedProducts = [],
      uploadedDocuments = [],
      usePacketStructure = true, // Default to using new packet structures
    } = await req.json() as PacketRequest;
    
    if (!permitRequestId) {
      throw new Error('permitRequestId is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Fetch permit request details
    const { data: permit, error: permitError } = await supabase
      .from('permit_projects')
      .select('*')
      .eq('id', permitRequestId)
      .single();
    
    if (permitError || !permit) {
      throw new Error('Permit request not found');
    }
    
    // Fetch uploaded documents from DB
    const { data: dbDocuments, error: docsError } = await supabase
      .from('permit_project_documents')
      .select('*')
      .eq('project_id', permitRequestId);
    
    if (docsError) {
      console.error('Error fetching documents:', docsError);
    }
    
    // Fetch product approvals for selected products
    const productIds = selectedProducts.map(p => p.id).filter(Boolean);
    let productApprovals: any[] = [];
    
    if (productIds.length > 0) {
      // NOTE: Do NOT filter by is_active — fasteners and some category products
      // may be marked inactive but still need their NOAs sourced into the packet.
      const { data } = await supabase
        .from('product_approvals')
        .select('*')
        .in('id', productIds);
      productApprovals = data || [];
    }
    
    // Detect jurisdiction info for packet structure lookup
    const county = permit.county || permit.jurisdiction_county || '';
    const city = permit.city || '';
    const tradeType = permit.permit_type || permit.service_type || 'roofing';
    const materialType = permit.material_type || permit.new_roof_type || '';
    const isHVHZ = permit.is_hvhz || false;
    
    // PART 5: Query learned data from AI training
    // Fetch fastener patterns for this jurisdiction/material
    let learnedFastenerPatterns: any[] = [];
    let learnedJurisdictionRules: any[] = [];
    let learnedAIKnowledge: any[] = [];
    let learnedRejectionPatterns: any[] = [];
    
    try {
      // Query fastener patterns for this jurisdiction
      const { data: fastenerData } = await supabase
        .from('fastener_patterns')
        .select('*')
        .or(`county.ilike.%${county}%,training_session_id.not.is.null`)
        .limit(20);
      
      if (fastenerData && fastenerData.length > 0) {
        learnedFastenerPatterns = fastenerData;
        console.log(`Found ${fastenerData.length} learned fastener patterns`);
      }
      
      // Query jurisdiction rules (gotchas) for this jurisdiction
      const { data: rulesData } = await supabase
        .from('building_department_rules')
        .select('*')
        .ilike('county', `%${county}%`)
        .eq('is_active', true);
      
      if (rulesData && rulesData.length > 0) {
        learnedJurisdictionRules = rulesData;
        console.log(`Found ${rulesData.length} jurisdiction rules`);
      }
      
      // CRITICAL: Query AI knowledge learned from training books and permit packets
      const { data: aiKnowledgeData } = await supabase
        .from('permit_ai_knowledge')
        .select('*')
        .or(`jurisdiction_county.ilike.%${county}%,jurisdiction_county.is.null`)
        .order('confidence', { ascending: false })
        .limit(50);
      
      if (aiKnowledgeData && aiKnowledgeData.length > 0) {
        learnedAIKnowledge = aiKnowledgeData;
        console.log(`Found ${aiKnowledgeData.length} AI knowledge items from training`);
      }
      
      // PHASE 1: CLOSED LEARNING LOOP - Query rejection patterns for this jurisdiction/trade
      const { data: rejectionData } = await supabase
        .from('permit_rejections')
        .select('rejection_reason, rejection_category, extracted_pattern')
        .ilike('jurisdiction_county', `%${county}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (rejectionData && rejectionData.length > 0) {
        // Aggregate rejection patterns by frequency
        const patternMap = new Map<string, { reason: string; category: string; count: number }>();
        for (const rej of rejectionData) {
          const key = rej.rejection_reason || rej.extracted_pattern || 'Unknown';
          const existing = patternMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            patternMap.set(key, {
              reason: key,
              category: rej.rejection_category || 'general',
              count: 1,
            });
          }
        }
        learnedRejectionPatterns = Array.from(patternMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        console.log(`Found ${learnedRejectionPatterns.length} rejection patterns for ${county}`);
      }
    } catch (e) {
      console.warn('Error fetching learned data:', e);
    }
    
    // Try to fetch packet structure from database
    let packetStructure: PacketStructureDocument[] | null = null;
    
    if (usePacketStructure) {
      // First try city-specific structure
      let { data: structure } = await supabase
        .from('permit_packet_structures')
        .select('document_structure')
        .eq('county', county)
        .eq('city', city)
        .eq('trade_type', tradeType)
        .eq('is_active', true)
        .single();
      
      // If no city-specific, try county default
      if (!structure) {
        const { data: countyStructure } = await supabase
          .from('permit_packet_structures')
          .select('document_structure')
          .eq('county', county)
          .is('city', null)
          .eq('trade_type', tradeType)
          .eq('is_active', true)
          .single();
        structure = countyStructure;
      }
      
      if (structure?.document_structure) {
        packetStructure = structure.document_structure as PacketStructureDocument[];
        console.log(`Using packet structure for ${county}/${city}/${tradeType}`);
      }
    }
    
    // Define packet structure (use DB structure or fallback)
    const PACKET_STRUCTURE = packetStructure || [
      { order: 1, type: 'cover_sheet', source: 'generated', pages: 1 },
      { order: 2, type: 'permit_application', source: 'auto_fill', needs_signature: true, pages: 2 },
      { order: 3, type: 'noc', source: 'auto_fill', needs_notary: true, pages: 1 },
      { order: 4, type: 'owner_authorization', source: 'user_upload', needs_signature: true },
      { order: 5, type: 'signed_contract', source: 'user_upload' },
      { order: 6, type: 'coi', source: 'user_upload' },
      { order: 7, type: 'contractor_license', source: 'user_upload' },
      { order: 8, type: 'product_approvals', source: 'auto_source', product_category: 'roofing' },
      { order: 9, type: 'roof_layout', source: 'user_upload' },
      { order: 10, type: 'site_photos', source: 'user_upload' },
    ];
    
    // Document type name mapping
    const DOC_TYPE_NAMES: Record<string, string> = {
      'cover_sheet': 'Cover Sheet',
      'permit_application': 'Permit Application',
      'noc': 'Notice of Commencement',
      'owner_authorization': 'Owner Authorization Letter',
      'signed_contract': 'Signed Contract',
      'coi': 'Certificate of Insurance',
      'contractor_license': 'Contractor License',
      'product_approvals': 'Product Approvals (NOAs)',
      'roof_layout': 'Roof Layout/Diagram',
      'site_photos': 'Property Photos',
      'hvhz_section_d': 'HVHZ Section D - Steep Slope',
      'section_1524': 'Section 1524 Owner Notification',
      'roof_to_wall_affidavit': 'Roof-to-Wall Connection Affidavit',
      'hoa_affidavit': 'HOA Awareness Affidavit',
      'city_supplement': 'City Supplemental Form',
      'underlayment_fpa': 'Underlayment Florida Product Approval',
      'underlayment_pe_evaluation': 'Underlayment P.E. Evaluation',
      'compliance_statement': 'Roofing Compliance Statement',
      'roofing_material_fpa': 'Roofing Material Product Approval',
      'fastening_patterns': 'Fastening Pattern Documentation',
      'impact_test_report': 'Impact Test Report (UL 2218)',
      'owner_notification': 'Owner Notification for Roofing',
      'roof_to_wall_mitigation': 'Roof-to-Wall Mitigation (Section 706.8)',
    };
    
    // Map uploaded documents to packet structure
    const documentIndex: DocumentInfo[] = [];
    let totalPages = 0;
    const pdfDocs: PdfMergeItem[] = [];
    const queueMerge = (url: string | undefined) => {
      if (!url) return;
      const last = documentIndex[documentIndex.length - 1];
      pdfDocs.push({ url, doc: last });
    };

    // ---- Build unified projectData used to fill all auto_fill templates ----
    let contractorData: any = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) {
          const { data: cd } = await supabase
            .from('contractor_form_data')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          contractorData = cd;
        }
      } catch (e) { console.warn('Could not load contractor_form_data:', e); }
    }

    const projectData: Record<string, any> = {
      // Property
      property_address: permit.property_address,
      city: permit.city,
      state: permit.state || 'FL',
      zip_code: permit.zip_code,
      county: permit.county || permit.jurisdiction_county,
      folio_number: permit.folio_number || permit.parcel_id,
      legal_description: permit.legal_description,
      // Owner
      owner_name: permit.owner_name || permit.customer_name,
      owner_phone: permit.owner_phone || permit.customer_phone,
      owner_email: permit.owner_email || permit.customer_email,
      owner_address: permit.owner_address || permit.property_address,
      // Scope
      permit_type: permit.permit_type || permit.service_type,
      scope_of_work: permit.scope_of_work || permit.scope_description,
      valuation: permit.estimated_value || permit.valuation,
      square_footage: permit.square_footage || permit.total_sqft,
      // Contractor (from contractor_form_data overrides permit fields)
      contractor_name: contractorData?.company_name || permit.contractor_name,
      contractor_license: contractorData?.license_number || permit.contractor_license,
      contractor_phone: contractorData?.phone || permit.contractor_phone,
      contractor_email: contractorData?.email || permit.contractor_email,
      contractor_address: contractorData
        ? [contractorData.address, contractorData.city, contractorData.state, contractorData.zip].filter(Boolean).join(', ')
        : permit.contractor_address,
      qualifier_name: contractorData?.qualifier_name || permit.qualifier_name,
      qualifier_license: contractorData?.qualifier_license || permit.qualifier_license,
      insurance_company: contractorData?.insurance_company,
      insurance_policy: contractorData?.insurance_policy_number,
    };

    for (const item of PACKET_STRUCTURE) {
      const docName = DOC_TYPE_NAMES[item.type] || item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Handle source types
      if (item.source === 'generated') {
        documentIndex.push({
          type: item.type,
          name: docName,
          pages: item.pages || 1,
          status: item.needs_signature ? 'needs_signature' : 'generated',
          source: 'generated',
          requiresNotary: item.needs_notary,
          requiresRecording: item.requires_recording,
        });
        totalPages += item.pages || 1;
      } else if (item.source === 'auto_fill') {
        // Prefer a user-uploaded signed permit application over auto-generation.
        // Match any document_type containing 'signed' AND ('permit' or 'application').
        if (item.type === 'permit_application') {
          const matchesSignedApp = (t: string) => {
            const s = (t || '').toLowerCase();
            return s === 'signed_permit_application'
              || s === 'permit_application_signed'
              || (s.includes('signed') && (s.includes('permit') || s.includes('application')))
              || s === 'permit_application'; // also accept user-uploaded plain permit_application
          };
          const uploadedApp = (dbDocuments || []).find((d: any) => matchesSignedApp(d.document_type))
            || uploadedDocuments.find((d: any) => matchesSignedApp(d.type));
          if (uploadedApp) {
            const url = (uploadedApp as any).file_path || (uploadedApp as any).file_url || (uploadedApp as any).url;
            documentIndex.push({
              type: 'permit_application',
              name: docName,
              pages: 2,
              url,
              status: 'included',
              source: 'user_upload',
            });
            totalPages += 2;
            queueMerge(url);
            continue;
          }
        }

        // Prefer a user-uploaded signed NOC over auto-generation
        if (item.type === 'noc') {
          const uploadedNoc = (dbDocuments || []).find((d: any) =>
            ['noc', 'signed_noc', 'notice_of_commencement'].includes((d.document_type || '').toLowerCase())
          ) || uploadedDocuments.find((d: any) =>
            ['noc', 'signed_noc', 'notice_of_commencement'].includes((d.type || '').toLowerCase())
          );
          if (uploadedNoc) {
            const url = (uploadedNoc as any).file_path || (uploadedNoc as any).file_url || (uploadedNoc as any).url;
            documentIndex.push({
              type: 'noc',
              name: docName,
              pages: 1,
              url,
              status: 'included',
              source: 'user_upload',
              requiresNotary: false, // already signed/notarized
              requiresRecording: item.requires_recording,
            });
            totalPages += 1;
            queueMerge(url);
            continue;
          }
        }

        let filledStatus: DocumentInfo['status'] = item.needs_signature ? 'needs_signature' : 'generated';
        let filledUrl: string | undefined;

        // CRITICAL: Wrap template lookup + fill + upload in try/catch.
        // If anything fails, log and continue — cover sheet, NOC, and merge MUST complete.
        try {
          const formTypeCandidates = [item.type, item.type.replace(/_/g, ''), item.type.split('_')[0]];
          const { data: templates, error: tplErr } = await supabase
            .from('permit_form_templates')
            .select('*')
            .or(`jurisdiction_name.ilike.%${county}%,jurisdiction_name.eq.Florida,county.ilike.%${county}%`)
            .in('form_type', formTypeCandidates)
            .limit(5);

          if (tplErr) {
            console.warn(`[auto_fill] template query error for ${item.type}:`, tplErr.message);
          }

          const template = (templates || []).sort((a: any, b: any) => {
            const aMatch = (a.county || '').toLowerCase().includes((county || '').toLowerCase()) ? 0 : 1;
            const bMatch = (b.county || '').toLowerCase().includes((county || '').toLowerCase()) ? 0 : 1;
            return aMatch - bMatch;
          })[0];

          if (template) {
            try {
              const filledBytes = await fillTemplatePdf(supabase, template, projectData, LOVABLE_API_KEY);
              if (filledBytes) {
                try {
                  const uploadedPath = await uploadFilledTemplate(supabase, filledBytes, permitRequestId, template.id);
                  if (uploadedPath) {
                    filledUrl = uploadedPath;
                    queueMerge(uploadedPath);
                  } else {
                    console.warn(`[auto_fill] upload returned no path for template ${template.id}`);
                  }
                } catch (upErr) {
                  console.warn(`[auto_fill] uploadFilledTemplate failed for template ${template.id}:`, upErr instanceof Error ? upErr.message : upErr);
                }
              } else {
                console.warn(`[auto_fill] fillTemplatePdf returned null for template ${template.id}`);
              }
            } catch (fillErr) {
              console.warn(`[auto_fill] fillTemplatePdf threw for template ${template.id}:`, fillErr instanceof Error ? fillErr.message : fillErr);
            }
          } else {
            console.warn(`No template found for auto_fill type=${item.type} county=${county}`);
            filledStatus = 'missing';
          }
        } catch (outerErr) {
          // Last-resort safety net — never let template-fill crash the assembler
          console.error(`[auto_fill] unexpected error for type=${item.type}:`, outerErr instanceof Error ? outerErr.message : outerErr);
          filledStatus = 'missing';
        }

        documentIndex.push({
          type: item.type,
          name: docName,
          pages: item.pages || 2,
          url: filledUrl,
          status: filledStatus,
          source: 'auto_fill',
          requiresNotary: item.needs_notary,
          requiresRecording: item.requires_recording,
        });
        totalPages += item.pages || 2;
        // Queue AFTER push so the merge item references the right document.
        if (filledUrl) queueMerge(filledUrl);
      } else if (item.source === 'user_upload') {
        // Map packet types to common upload aliases used by the upload UI / DB.
        const aliases = (UPLOAD_TYPE_ALIASES[item.type] || [item.type]);
        const matchType = (t: any) => aliases.includes(String(t || '').toLowerCase());
        const dbDoc = dbDocuments?.find(d => matchType(d.document_type));
        const passedDoc = uploadedDocuments.find(d => matchType(d.type));
        
        if (dbDoc || passedDoc) {
          const url = dbDoc?.file_path || dbDoc?.file_url || passedDoc?.url;
          documentIndex.push({
            type: item.type,
            name: docName,
            pages: 1,
            url: url,
            status: 'included',
            source: 'user_upload',
          });
          totalPages += 1;
          queueMerge(url);
        } else {
          documentIndex.push({
            type: item.type,
            name: docName,
            pages: 0,
            status: 'missing',
            source: 'user_upload',
          });
        }
      } else if (item.source === 'auto_source') {
        // Auto-source from product_approvals - only add products ONCE
        // Skip if this is a document type other than 'product_approvals' (to avoid duplicates)
        if (item.type !== 'product_approvals') {
          // For non-product doc types (fastening_patterns, impact_test_report, etc.)
          // Add as a single placeholder document
          documentIndex.push({
            type: item.type,
            name: docName,
            pages: item.pages || 1,
            status: 'missing',
            source: 'auto_source',
          });
          continue;
        }
        
        // Process each selected product for the 'product_approvals' type
        for (const sp of selectedProducts) {
          const approval = productApprovals.find(a => a.id === sp.id);
          // Enrich with DB values so fasteners / sparse client payloads don't render as blank/Unknown.
          const manufacturer = sp.manufacturer || approval?.manufacturer || 'Unknown Manufacturer';
          const productName = sp.product_name || approval?.product_name || approval?.product_description || 'Product';
          const noaNumber = sp.noa_number || approval?.noa_number || '';

          // Check if this product was already added to avoid duplicates
          const alreadyAdded = documentIndex.some(d =>
            d.type === 'product_approval' &&
            d.name.includes(productName) &&
            d.name.includes(manufacturer)
          );
          if (alreadyAdded) continue;

          let fileUrl = approval?.file_url || approval?.noa_pdf_url || approval?.fl_approval_pdf_url || sp.file_url;

          // If no file URL, attempt inline sourcing
          if (!fileUrl && noaNumber) {
            console.log(`Attempting inline sourcing for ${productName} (${noaNumber})`);
            const cleaned = noaNumber.replace(/^NOA\s*/i, '').replace(/\./g, '');
            const tryUrl = `https://www.miamidade.gov/building/library/noa/${cleaned}.pdf`;

            try {
              const testResponse = await fetchWithTimeout(tryUrl, { method: 'HEAD' }, 6000);
              if (testResponse.ok) {
                fileUrl = tryUrl;
                console.log(`Found PDF at ${tryUrl}`);
                // Update product approval record in background
                supabase
                  .from('product_approvals')
                  .update({
                    noa_pdf_url: tryUrl,
                    file_url: tryUrl,
                    source_status: 'found',
                    source_updated_at: new Date().toISOString(),
                  })
                  .eq('id', sp.id)
                  .then(({ error }) => {
                    if (error) console.warn('Failed to update product approval:', error);
                  });
              }
            } catch (e) {
              console.log(`Inline sourcing failed for ${productName}: ${e}`);
            }
          }

          if (fileUrl) {
            documentIndex.push({
              type: 'product_approval',
              name: `${manufacturer} ${productName}${noaNumber ? ` - NOA ${noaNumber}` : ''}`,
              pages: 2,
              url: fileUrl,
              status: 'auto_sourced',
              source: 'auto_source',
              noaNumber: noaNumber || undefined,
              manufacturer,
              productName,
            });
            totalPages += 2;
            queueMerge(fileUrl);
            console.log(`[auto_source] queued NOA for merge: ${manufacturer} ${productName} -> ${fileUrl.substring(0, 100)}`);
          } else if (noaNumber) {
            // Mark as needs_sourcing with the NOA number for manual lookup
            documentIndex.push({
              type: 'product_approval',
              name: `${manufacturer} ${productName} - NOA ${noaNumber}`,
              pages: 0,
              status: 'needs_sourcing',
              source: 'auto_source',
              noaNumber,
            });
          } else {
            // No NOA number - mark as missing
            documentIndex.push({
              type: 'product_approval',
              name: `${manufacturer} ${productName}`,
              pages: 0,
              status: 'missing',
              source: 'auto_source',
            });
          }
        }
      } else if (item.source === 'city_specific') {
        // City-specific forms
        documentIndex.push({
          type: item.type,
          name: docName,
          pages: item.pages || 4,
          status: 'city_specific',
          source: 'city_specific',
          requiresNotary: item.needs_notary,
          requiresRecording: item.requires_recording,
        });
        totalPages += item.pages || 4;
      } else if (item.source === 'conditional') {
        // Conditional documents - FIRST check if user already uploaded this document
        const dbDoc = dbDocuments?.find(d => d.document_type === item.type);
        const passedDoc = uploadedDocuments.find(d => d.type === item.type);
        
        if (dbDoc || passedDoc) {
          // User uploaded this document - mark as included regardless of condition
          const url = dbDoc?.file_path || dbDoc?.file_url || passedDoc?.url;
          documentIndex.push({
            type: item.type,
            name: docName,
            pages: item.pages || 1,
            url: url,
            status: 'included',
            source: 'user_upload',
            condition: item.condition,
            requiresNotary: item.needs_notary,
            requiresRecording: item.requires_recording,
          });
          totalPages += item.pages || 1;
          queueMerge(url);
        } else {
          // No upload - check if condition is met to determine if required
          const conditionMet = evaluateCondition(item.condition, permit);
          documentIndex.push({
            type: item.type,
            name: docName,
            pages: conditionMet ? (item.pages || 1) : 0,
            status: conditionMet ? 'missing' : 'not_required',
            source: 'conditional',
            condition: item.condition,
            requiresNotary: item.needs_notary,
            requiresRecording: item.requires_recording,
          });
          if (conditionMet) {
            totalPages += item.pages || 1;
          }
        }
      }
    }
    
    // Helper function to evaluate conditions
    function evaluateCondition(condition: string | undefined, permit: any): boolean {
      if (!condition) return true;
      
      switch (condition) {
        case 'if_hoa':
          return permit.is_hoa === true;
        case 'if_pre_1988':
          const yearBuilt = permit.year_built || new Date().getFullYear();
          return yearBuilt < 1988;
        case 'if_pre_1994':
          const yb = permit.year_built || new Date().getFullYear();
          return yb < 1994;
        case 'if_over_300k':
          const value = permit.estimated_value || permit.valuation || 0;
          return value >= 300000;
        case 'if_pre_1988_and_over_300k':
          const yr = permit.year_built || new Date().getFullYear();
          const val = permit.estimated_value || permit.valuation || 0;
          return yr < 1988 && val >= 300000;
        case 'if_pre_1994_or_over_300k':
          const year = permit.year_built || new Date().getFullYear();
          const v = permit.estimated_value || permit.valuation || 0;
          return year < 1994 || v >= 300000;
        default:
          return true;
      }
    }
    
    // Generate cover sheet content with AI or fallback
    let coverSheetHtml = '';
    let submissionNotes: string[] = [];
    let aiNotes = '';
    
    if (LOVABLE_API_KEY) {
      // Format rejection avoidance context (PHASE 1: CLOSED LEARNING LOOP)
      const rejectionAvoidanceContext = learnedRejectionPatterns.length > 0
        ? `\n\nCRITICAL - AVOID THESE COMMON REJECTION REASONS (learned from ${county} building dept):\n${learnedRejectionPatterns.map(r => `- [${r.category}] ${r.reason} (${r.count} occurrences)`).join('\n')}\n\nIMPORTANT: Address each of these potential issues in the cover sheet and submission notes to prevent rejection.`
        : '';
      
      const systemPrompt = `You are an expert permit packet preparer for Florida building permits. Generate professional content for permit submissions.

Given the permit details, generate:
1. A professional HTML cover sheet with property info, owner info, contractor info, scope summary, and document checklist
2. Submission notes for the permit expediter - CRITICAL: Include specific warnings based on learned rejection patterns
3. Any warnings or issues detected
4. A "Lessons Learned" section addressing common rejection reasons for this jurisdiction

Use clean, professional formatting. Include all required information.${rejectionAvoidanceContext}`;

      // Format AI knowledge for prompt
      const aiKnowledgeContext = learnedAIKnowledge.length > 0 
        ? `\n\nLEARNED JURISDICTION KNOWLEDGE (from training):\n${learnedAIKnowledge.slice(0, 20).map(k => `- [${k.knowledge_type}] ${k.pattern_description}`).join('\n')}`
        : '';
      
      const fastenerContext = learnedFastenerPatterns.length > 0
        ? `\n\nLEARNED FASTENER PATTERNS:\n${learnedFastenerPatterns.map(f => `- ${f.pattern_description || f.nails_per_unit + ' nails'} (${f.source || 'training'})`).join('\n')}`
        : '';

      const userPrompt = `Generate a cover sheet and submission notes for this permit packet:

PERMIT DETAILS:
- Property: ${permit.property_address}, ${permit.city || ''}, FL ${permit.zip_code || ''}
- Permit Type: ${permit.permit_type || permit.service_type}
- Owner: ${permit.owner_name || permit.customer_name}
- Scope: ${permit.scope_of_work || permit.scope_description || 'Not specified'}
- Valuation: $${permit.estimated_value || permit.valuation || 'TBD'}
- County: ${permit.county || permit.jurisdiction_county}
- Is HVHZ: ${isHVHZ ? 'Yes - High Velocity Hurricane Zone' : 'No'}
${aiKnowledgeContext}
${fastenerContext}

DOCUMENTS INCLUDED:
${documentIndex.map(d => `- ${d.name}: ${d.status}`).join('\n')}

${learnedFastenerPatterns.length > 0 ? `
LEARNED FASTENER PATTERNS (from AI training):
${learnedFastenerPatterns.slice(0, 5).map(f => `- ${f.zone_type}: ${f.nail_type || 'standard'} nails, ${f.spacing_inches || 'per code'}" spacing, ${f.nails_per_square || 'per manufacturer'} per square`).join('\n')}
` : ''}

${learnedJurisdictionRules.length > 0 ? `
JURISDICTION-SPECIFIC RULES (learned gotchas):
${learnedJurisdictionRules.slice(0, 5).map(r => `- ${r.rule_type}: ${r.rule_description}`).join('\n')}
` : ''}

${learnedRejectionPatterns.length > 0 ? `
COMMON REJECTION REASONS TO AVOID (from ${county} permit history):
${learnedRejectionPatterns.map(r => `- ${r.reason} (category: ${r.category}, frequency: ${r.count})`).join('\n')}

IMPORTANT: Generate submission notes that specifically address how to avoid each of these rejection reasons.
` : ''}

Respond with JSON:
{
  "coverSheetHtml": "<html cover sheet content>",
  "submissionNotes": ["note1", "note2"],
  "rejectionAvoidance": ["specific tips to avoid rejection based on learned patterns"],
  "warnings": ["warning if any"],
  "summary": "Brief summary of packet"
}`;

      try {
        const response = await fetchWithTimeout('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 3000,
          }),
        }, 25000);

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (content) {
            try {
              const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                                content.match(/```\s*([\s\S]*?)\s*```/) ||
                                [null, content];
              const result = JSON.parse(jsonMatch[1] || content);
              
              coverSheetHtml = result.coverSheetHtml || '';
              submissionNotes = result.submissionNotes || [];
              aiNotes = result.summary || '';
            } catch (e) {
              console.warn('Could not parse AI response:', e);
            }
          }
        }
      } catch (aiError) {
        console.warn('AI generation failed:', aiError);
      }
    }
    
    // Fallback cover sheet HTML
    if (!coverSheetHtml) {
      coverSheetHtml = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px; }
          h2 { color: #2d3748; margin-top: 20px; }
          .info-section { margin: 15px 0; }
          .label { font-weight: bold; display: inline-block; width: 150px; }
          .checklist { list-style: none; padding: 0; }
          .checklist li { padding: 5px 0; }
          .included { color: green; }
          .missing { color: red; }
          .signature { color: orange; }
        </style></head>
        <body>
          <h1>PERMIT APPLICATION PACKET</h1>
          
          <h2>Property Information</h2>
          <div class="info-section">
            <span class="label">Address:</span> ${permit.property_address}<br>
            <span class="label">City:</span> ${permit.city || 'N/A'}, FL ${permit.zip_code || ''}<br>
            <span class="label">County:</span> ${permit.county || permit.jurisdiction_county}<br>
          </div>
          
          <h2>Owner Information</h2>
          <div class="info-section">
            <span class="label">Owner:</span> ${permit.owner_name || permit.customer_name}<br>
            <span class="label">Phone:</span> ${permit.owner_phone || permit.customer_phone || 'N/A'}<br>
            <span class="label">Email:</span> ${permit.owner_email || permit.customer_email || 'N/A'}<br>
          </div>
          
          <h2>Scope of Work</h2>
          <div class="info-section">
            <span class="label">Permit Type:</span> ${permit.permit_type || permit.service_type}<br>
            <span class="label">Description:</span> ${permit.scope_of_work || permit.scope_description || 'See attached documents'}<br>
            <span class="label">Valuation:</span> $${(permit.estimated_value || permit.valuation || 0).toLocaleString()}<br>
          </div>
          
          <h2>Document Checklist</h2>
          <ul class="checklist">
            ${documentIndex.map(d => `
              <li class="${d.status === 'included' || d.status === 'generated' ? 'included' : d.status === 'needs_signature' ? 'signature' : 'missing'}">
                ${d.status === 'included' || d.status === 'generated' ? '✓' : d.status === 'needs_signature' ? '✎' : '✗'} 
                ${d.name} ${d.status === 'needs_signature' ? '(needs signature)' : ''}
              </li>
            `).join('')}
          </ul>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Generated: ${new Date().toLocaleDateString()} | 
            Total Pages: ${totalPages}
          </p>
        </body>
        </html>
      `;
    }
    
    // Calculate completion percentage (include auto_sourced as complete)
    const requiredDocs = documentIndex.filter(d => d.source !== 'generated');
    const completeDocs = requiredDocs.filter(d => 
      d.status === 'included' || d.status === 'auto_sourced' || d.status === 'needs_signature'
    );
    const completionPercentage = requiredDocs.length > 0 
      ? Math.round((completeDocs.length / requiredDocs.length) * 100) 
      : 100;
    
    // Generate PDF packet
    let packetPdfUrl: string | null = null;
    
    try {
      // Generate cover sheet PDF
      const coverSheetBytes = await generateCoverSheetPdf(permit, documentIndex);
      
      // Merge all documents
      const mergedPdfBytes = await mergePdfDocuments(coverSheetBytes, pdfDocs, supabase);
      
      // Upload to storage
      const packetPath = `packets/${permitRequestId}/${Date.now()}-permit-packet.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('permit-documents')
        .upload(packetPath, mergedPdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });
      
      if (!uploadError) {
        // Use signed URL for private bucket instead of public URL
        const { data: signedData } = await supabase.storage
          .from('permit-documents')
          .createSignedUrl(packetPath, 60 * 60 * 24 * 7); // 7 days expiry
        
        packetPdfUrl = signedData?.signedUrl || packetPath;
      } else {
        console.warn('Could not upload packet PDF:', uploadError);
      }
    } catch (pdfError) {
      console.warn('PDF generation failed:', pdfError);
    }
    
    // Get user ID from auth header (authHeader already declared above)
    let userId: string | null = null;
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id ?? null;
      } catch (e) {
        console.warn('Could not resolve user from auth header:', e);
      }
    }
    
    // Save packet to database
    const { data: packet, error: packetError } = await supabase
      .from('permit_packets')
      .insert({
        permit_request_id: permitRequestId,
        packet_type: 'submission',
        document_count: documentIndex.filter(d => d.status === 'included' || d.status === 'generated').length,
        total_pages: totalPages,
        documents_included: documentIndex,
        cover_sheet_html: coverSheetHtml,
        document_index: documentIndex.map((d, i) => ({ order: i + 1, ...d })),
        ai_notes: aiNotes,
        generated_by: userId,
        status: completionPercentage === 100 ? 'ready' : 'draft',
        file_path: packetPdfUrl,
      })
      .select()
      .single();
    
    if (packetError) {
      console.error('Error saving packet:', packetError);
    }
    
    // Update permit project with packet URL
    if (packetPdfUrl) {
      await supabase
        .from('permit_projects')
        .update({ 
          packet_url: packetPdfUrl,
          packet_status: completionPercentage === 100 ? 'ready' : 'draft',
        })
        .eq('id', permitRequestId);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        packetId: packet?.id,
        documentIndex,
        coverSheetHtml,
        submissionNotes,
        aiNotes,
        totalPages,
        documentCount: documentIndex.filter(d => d.status === 'included' || d.status === 'generated').length,
        completionPercentage,
        missingDocuments: documentIndex.filter(d => d.status === 'missing').map(d => d.name),
        needsSignature: documentIndex.filter(d => d.status === 'needs_signature').map(d => d.name),
        status: completionPercentage === 100 ? 'ready' : 'incomplete',
        packetPdfUrl,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Packet assembler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to assemble packet';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
