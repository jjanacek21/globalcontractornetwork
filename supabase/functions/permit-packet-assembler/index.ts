import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PacketRequest {
  permitRequestId: string;
  includeDocuments?: string[]; // Document types to include
  generateCoverSheet?: boolean;
  generateNOC?: boolean;
}

interface DocumentInfo {
  type: string;
  name: string;
  pages: number;
  url?: string;
  status: 'included' | 'generated' | 'missing' | 'needs_signature';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { permitRequestId, includeDocuments, generateCoverSheet = true, generateNOC = true } = await req.json() as PacketRequest;
    
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
    
    // Fetch uploaded documents
    const { data: documents, error: docsError } = await supabase
      .from('permit_documents')
      .select('*')
      .eq('permit_project_id', permitRequestId);
    
    if (docsError) {
      console.error('Error fetching documents:', docsError);
    }
    
    // Fetch jurisdiction rules if available
    const { data: jurisdictionRules } = await supabase
      .from('jurisdiction_rules')
      .select('*')
      .eq('county', permit.county)
      .eq('permit_type', permit.permit_type)
      .eq('is_active', true)
      .maybeSingle();
    
    // Fetch product approvals for materials mentioned
    const { data: productApprovals } = await supabase
      .from('product_approvals')
      .select('*')
      .eq('is_active', true)
      .limit(20);
    
    // Define packet structure
    const PACKET_STRUCTURE = [
      { type: 'cover_sheet', name: 'Cover Sheet', generated: true, pages: 1 },
      { type: 'permit_application', name: 'Permit Application', generated: true, pages: 2 },
      { type: 'noc', name: 'Notice of Commencement', generated: true, needs_signature: true, pages: 1 },
      { type: 'owner_authorization', name: 'Owner Authorization Letter', needs_signature: true },
      { type: 'signed_contract', name: 'Signed Contract', uploaded: true },
      { type: 'coi', name: 'Certificate of Insurance', uploaded: true },
      { type: 'contractor_license', name: 'Contractor License', uploaded: true },
      { type: 'product_approvals', name: 'Product Approvals (NOAs)', lookup: true },
      { type: 'roof_layout', name: 'Roof Layout/Diagram', uploaded: true },
      { type: 'site_photos', name: 'Property Photos', uploaded: true },
    ];
    
    // Map uploaded documents to packet structure
    const documentIndex: DocumentInfo[] = [];
    let totalPages = 0;
    
    for (const item of PACKET_STRUCTURE) {
      if (item.generated) {
        documentIndex.push({
          type: item.type,
          name: item.name,
          pages: item.pages || 1,
          status: item.needs_signature ? 'needs_signature' : 'generated'
        });
        totalPages += item.pages || 1;
      } else if (item.uploaded) {
        const uploadedDoc = documents?.find(d => d.document_type === item.type);
        if (uploadedDoc) {
          documentIndex.push({
            type: item.type,
            name: item.name,
            pages: 1, // Default, could be extracted from PDF
            url: uploadedDoc.file_path,
            status: 'included'
          });
          totalPages += 1;
        } else {
          documentIndex.push({
            type: item.type,
            name: item.name,
            pages: 0,
            status: 'missing'
          });
        }
      } else if (item.lookup && productApprovals?.length) {
        // Add product approval documents
        for (const approval of productApprovals.slice(0, 3)) {
          if (approval.file_path || approval.file_url) {
            documentIndex.push({
              type: 'product_approval',
              name: `${approval.manufacturer} ${approval.product_name} - NOA ${approval.noa_number}`,
              pages: 2, // Typical NOA length
              url: approval.file_path || approval.file_url,
              status: 'included'
            });
            totalPages += 2;
          }
        }
      }
    }
    
    // Use AI to generate cover sheet content and submission notes
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
- Property: ${permit.property_address}, ${permit.city}, FL ${permit.zip}
- Permit Type: ${permit.permit_type}
- Owner: ${permit.owner_name}
- Scope: ${permit.scope_of_work || 'Not specified'}
- Valuation: $${permit.estimated_value || 'TBD'}
- County: ${permit.county}

DOCUMENTS INCLUDED:
${documentIndex.map(d => `- ${d.name}: ${d.status}`).join('\n')}

JURISDICTION REQUIREMENTS:
${jurisdictionRules ? JSON.stringify(jurisdictionRules, null, 2) : 'Standard Florida Building Code requirements apply'}

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
        } else if (response.status === 429) {
          console.warn('Rate limited, using fallback');
        } else if (response.status === 402) {
          console.warn('AI credits exhausted, using fallback');
        }
      } catch (aiError) {
        console.warn('AI generation failed:', aiError);
      }
    }
    
    // Fallback cover sheet if AI failed
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
            <span class="label">City:</span> ${permit.city}, FL ${permit.zip}<br>
            <span class="label">County:</span> ${permit.county}<br>
          </div>
          
          <h2>Owner Information</h2>
          <div class="info-section">
            <span class="label">Owner:</span> ${permit.owner_name}<br>
            <span class="label">Phone:</span> ${permit.owner_phone || 'N/A'}<br>
            <span class="label">Email:</span> ${permit.owner_email || 'N/A'}<br>
          </div>
          
          <h2>Scope of Work</h2>
          <div class="info-section">
            <span class="label">Permit Type:</span> ${permit.permit_type}<br>
            <span class="label">Description:</span> ${permit.scope_of_work || 'See attached documents'}<br>
            <span class="label">Valuation:</span> $${(permit.estimated_value || 0).toLocaleString()}<br>
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
    
    // Calculate completion percentage
    const requiredDocs = documentIndex.filter(d => d.status !== 'generated');
    const includedDocs = requiredDocs.filter(d => d.status === 'included' || d.status === 'needs_signature');
    const completionPercentage = requiredDocs.length > 0 
      ? Math.round((includedDocs.length / requiredDocs.length) * 100) 
      : 100;
    
    // Save packet to database
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }
    
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
        status: completionPercentage === 100 ? 'ready' : 'draft'
      })
      .select()
      .single();
    
    if (packetError) {
      console.error('Error saving packet:', packetError);
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
        status: completionPercentage === 100 ? 'ready' : 'incomplete'
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
