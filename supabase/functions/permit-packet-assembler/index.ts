import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  status: 'included' | 'generated' | 'missing' | 'needs_signature' | 'auto_sourced' | 'city_specific' | 'conditional';
  source?: 'auto_fill' | 'auto_source' | 'user_upload' | 'generated' | 'city_specific' | 'conditional';
  requiresNotary?: boolean;
  requiresRecording?: boolean;
  condition?: string;
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
                      doc.status === 'needs_signature' ? '[S]' : '[ ]';
    const statusColor = doc.status === 'included' || doc.status === 'generated' || doc.status === 'auto_sourced' ? rgb(0.2, 0.6, 0.2) :
                        doc.status === 'needs_signature' ? rgb(0.8, 0.5, 0.1) : rgb(0.5, 0.5, 0.5);
    
    page.drawText(checkmark, { x: leftMargin, y, size: 10, font: helvetica, color: statusColor });
    page.drawText(doc.name, { x: leftMargin + 30, y, size: 10, font: helvetica });
    
    if (doc.status === 'needs_signature') {
      page.drawText('(signature required)', { x: 400, y, size: 8, font: helvetica, color: rgb(0.8, 0.5, 0.1) });
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
  
  page.drawText('Permit Queens - Florida Building Permit Expediting', {
    x: leftMargin,
    y: 25,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return await pdfDoc.save();
}

async function mergePdfDocuments(
  coverSheetBytes: Uint8Array,
  documentUrls: string[],
  supabase: any
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  // Add cover sheet
  try {
    const coverPdf = await PDFDocument.load(coverSheetBytes);
    const coverPages = await mergedPdf.copyPages(coverPdf, coverPdf.getPageIndices());
    coverPages.forEach(page => mergedPdf.addPage(page));
  } catch (e) {
    console.warn('Could not add cover sheet:', e);
  }
  
  // Add uploaded documents
  for (const url of documentUrls) {
    if (!url) continue;
    
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('pdf')) {
        console.log(`Skipping non-PDF: ${url}`);
        continue;
      }
      
      const pdfBytes = await response.arrayBuffer();
      const srcPdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    } catch (e) {
      console.warn(`Could not add document from ${url}:`, e);
    }
  }
  
  // Add page numbers
  const pages = mergedPdf.getPages();
  const helvetica = await mergedPdf.embedFont(StandardFonts.Helvetica);
  
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    page.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: width - 100,
      y: 15,
      size: 9,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
  });
  
  return await mergedPdf.save();
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
      const { data } = await supabase
        .from('product_approvals')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true);
      productApprovals = data || [];
    }
    
    // Detect jurisdiction info for packet structure lookup
    const county = permit.county || permit.jurisdiction_county || '';
    const city = permit.city || '';
    const tradeType = permit.permit_type || permit.service_type || 'roofing';
    const materialType = permit.material_type || permit.new_roof_type || '';
    const isHVHZ = permit.is_hvhz || false;
    
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
    const pdfUrls: string[] = [];
    
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
        // Forms that will be auto-filled
        documentIndex.push({
          type: item.type,
          name: docName,
          pages: item.pages || 2,
          status: item.needs_signature ? 'needs_signature' : 'generated',
          source: 'auto_fill',
          requiresNotary: item.needs_notary,
          requiresRecording: item.requires_recording,
        });
        totalPages += item.pages || 2;
      } else if (item.source === 'user_upload') {
        // Check DB documents first
        const dbDoc = dbDocuments?.find(d => d.document_type === item.type);
        // Then check passed uploadedDocuments
        const passedDoc = uploadedDocuments.find(d => d.type === item.type);
        
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
          if (url) pdfUrls.push(url);
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
          // Check if this product was already added to avoid duplicates
          const alreadyAdded = documentIndex.some(d => 
            d.type === 'product_approval' && 
            d.name.includes(sp.product_name) &&
            d.name.includes(sp.manufacturer)
          );
          if (alreadyAdded) continue;
          
          const approval = productApprovals.find(a => a.id === sp.id);
          const fileUrl = approval?.file_url || approval?.noa_pdf_url || approval?.fl_approval_pdf_url || sp.file_url;
          
          if (fileUrl) {
            documentIndex.push({
              type: 'product_approval',
              name: `${sp.manufacturer} ${sp.product_name}${sp.noa_number ? ` - NOA ${sp.noa_number}` : ''}`,
              pages: 2,
              url: fileUrl,
              status: 'auto_sourced',
              source: 'auto_source',
            });
            totalPages += 2;
            pdfUrls.push(fileUrl);
          } else if (sp.noa_number) {
            documentIndex.push({
              type: 'product_approval',
              name: `${sp.manufacturer} ${sp.product_name} - NOA ${sp.noa_number}`,
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
        // Conditional documents - check if condition is met
        const conditionMet = evaluateCondition(item.condition, permit);
        documentIndex.push({
          type: item.type,
          name: docName,
          pages: conditionMet ? (item.pages || 1) : 0,
          status: conditionMet ? 'conditional' : 'missing',
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
      const systemPrompt = `You are an expert permit packet preparer for Florida building permits. Generate professional content for permit submissions.

Given the permit details, generate:
1. A professional HTML cover sheet with property info, owner info, contractor info, scope summary, and document checklist
2. Submission notes for the permit expediter
3. Any warnings or issues detected

Use clean, professional formatting. Include all required information.`;

      const userPrompt = `Generate a cover sheet and submission notes for this permit packet:

PERMIT DETAILS:
- Property: ${permit.property_address}, ${permit.city || ''}, FL ${permit.zip_code || ''}
- Permit Type: ${permit.permit_type || permit.service_type}
- Owner: ${permit.owner_name || permit.customer_name}
- Scope: ${permit.scope_of_work || permit.scope_description || 'Not specified'}
- Valuation: $${permit.estimated_value || permit.valuation || 'TBD'}
- County: ${permit.county || permit.jurisdiction_county}

DOCUMENTS INCLUDED:
${documentIndex.map(d => `- ${d.name}: ${d.status}`).join('\n')}

Respond with JSON:
{
  "coverSheetHtml": "<html cover sheet content>",
  "submissionNotes": ["note1", "note2"],
  "warnings": ["warning if any"],
  "summary": "Brief summary of packet"
}`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        });

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
      const mergedPdfBytes = await mergePdfDocuments(coverSheetBytes, pdfUrls, supabase);
      
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
    
    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
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
