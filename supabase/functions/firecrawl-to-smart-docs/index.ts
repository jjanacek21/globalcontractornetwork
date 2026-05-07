import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEPARTMENT_TO_COUNTY: Record<string, string> = {
  'Miami-Dade County': 'Miami-Dade',
  'City of Miami': 'Miami-Dade',
  'Broward County': 'Broward',
  'Hollywood': 'Broward',
  'Fort Lauderdale': 'Broward',
  'Coral Springs': 'Broward',
  'Pompano Beach': 'Broward',
  'Boca Raton': 'Palm Beach',
  'West Palm Beach': 'Palm Beach',
  'Palm Beach County': 'Palm Beach',
};

function inferTradeTypes(title: string, content: string): string[] {
  const combined = `${title} ${content}`.toLowerCase();
  const trades: string[] = [];
  if (combined.includes('roof')) trades.push('roofing');
  if (combined.includes('window') || combined.includes('door') || combined.includes('glazing')) trades.push('windows_doors');
  if (combined.includes('electric')) trades.push('electrical');
  if (combined.includes('plumb')) trades.push('plumbing');
  if (combined.includes('hvac') || combined.includes('mechanical') || combined.includes('air condition')) trades.push('mechanical');
  if (combined.includes('structur') || combined.includes('engineer')) trades.push('engineering');
  if (combined.includes('general') || combined.includes('building')) trades.push('general');
  if (trades.length === 0) trades.push('general');
  return trades;
}

function inferHvhz(title: string, content: string, county: string): boolean {
  const combined = `${title} ${content}`.toLowerCase();
  if (combined.includes('hvhz') || combined.includes('high velocity')) return true;
  if (county === 'Miami-Dade') return true;
  return false;
}

function classifyDocument(title: string, content: string): string {
  const combined = `${title} ${content}`.toLowerCase();
  if (combined.includes('application') || combined.includes('permit app')) return 'permit_application';
  if (combined.includes('checklist') || combined.includes('check list') || combined.includes('requirements list')) return 'checklist';
  if (combined.includes('affidavit') || combined.includes('sworn') || combined.includes('notarized')) return 'affidavit';
  if (combined.includes('noa') || combined.includes('notice of acceptance') || combined.includes('product approval')) return 'noa_form';
  if (combined.includes('inspection') || combined.includes('progress inspect')) return 'inspection_form';
  if (combined.includes('code') || combined.includes('compliance') || combined.includes('section ')) return 'code_form';
  return 'permit_application';
}

async function copyFileBetweenBuckets(
  supabase: any,
  sourceBucket: string,
  sourcePath: string,
  destBucket: string,
  destPath: string
): Promise<boolean> {
  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(sourceBucket)
      .download(sourcePath);

    if (downloadError || !fileData) {
      console.warn(`Could not download from ${sourceBucket}/${sourcePath}:`, downloadError);
      return false;
    }

    const { error: uploadError } = await supabase.storage
      .from(destBucket)
      .upload(destPath, fileData, { contentType: 'application/pdf', upsert: true });

    if (uploadError) {
      console.warn(`Could not upload to ${destBucket}/${destPath}:`, uploadError);
      return false;
    }

    return true;
  } catch (e) {
    console.warn('File copy failed:', e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { documentIds } = await req.json();

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'documentIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Converting ${documentIds.length} discovered documents to smart docs`);

    const { data: docs, error: fetchError } = await supabase
      .from('firecrawl_discovered_documents')
      .select('*')
      .in('id', documentIds)
      .eq('is_converted_to_smart_doc', false);

    if (fetchError) throw fetchError;

    let converted = 0;

    for (const doc of docs || []) {
      try {
        const county = doc.county || DEPARTMENT_TO_COUNTY[doc.department || ''] || 'Unknown';
        const tradeTypes = inferTradeTypes(doc.title || '', doc.content_markdown || '');
        const hvhzOnly = inferHvhz(doc.title || '', doc.content_markdown || '', county);
        const classification = classifyDocument(doc.title || '', doc.content_markdown || '');

        // Use AI to analyze content and detect fillable fields
        let fieldMappings: any = {};
        let fieldCount = 0;

        if (doc.content_markdown && doc.content_markdown.length > 100) {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-3-flash-preview',
              messages: [
                {
                  role: 'system',
                  content: 'You are a permit document analyst. Identify fillable form fields, checkboxes, and data entry sections in permit application documents.',
                },
                {
                  role: 'user',
                  content: `Analyze this permit document and identify all fillable fields:\n\n${doc.content_markdown.substring(0, 8000)}`,
                },
              ],
              tools: [
                {
                  type: 'function',
                  function: {
                    name: 'extract_form_fields',
                    description: 'Extract fillable form fields from a permit document',
                    parameters: {
                      type: 'object',
                      properties: {
                        fields: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              field_name: { type: 'string' },
                              field_type: { type: 'string', enum: ['text', 'checkbox', 'date', 'number', 'signature', 'select'] },
                              section: { type: 'string' },
                              required: { type: 'boolean' },
                              description: { type: 'string' },
                            },
                            required: ['field_name', 'field_type'],
                            additionalProperties: false,
                          },
                        },
                        document_purpose: { type: 'string' },
                      },
                      required: ['fields'],
                      additionalProperties: false,
                    },
                  },
                },
              ],
              tool_choice: { type: 'function', function: { name: 'extract_form_fields' } },
            }),
          });

          if (aiResponse.ok) {
            const aiResult = await aiResponse.json();
            const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall?.function?.arguments) {
              try {
                const parsed = JSON.parse(toolCall.function.arguments);
                fieldMappings = {
                  fields: parsed.fields || [],
                  document_purpose: parsed.document_purpose || '',
                };
                fieldCount = parsed.fields?.length || 0;
              } catch (e) {
                console.warn('Failed to parse AI field extraction:', e);
              }
            }
          } else if (aiResponse.status === 429) {
            console.warn('Rate limited during field extraction, continuing without AI analysis');
          }
        }

        // Self-heal: if no storage_path but we have a PDF file_url, download it now
        let workingDoc = doc;
        if (!workingDoc.storage_path && workingDoc.file_url && workingDoc.file_url.toLowerCase().includes('.pdf')) {
          try {
            const resp = await fetch(workingDoc.file_url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/pdf,*/*',
              },
              redirect: 'follow',
            });
            if (resp.ok) {
              const buf = new Uint8Array(await resp.arrayBuffer());
              if (buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
                const fname = (workingDoc.file_url.split('/').pop() || `${workingDoc.id}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
                const path = `firecrawl/${county}/${(workingDoc.department || 'unknown').replace(/\s+/g, '-')}/${Date.now()}_${fname}`;
                const { error: upErr } = await supabase.storage
                  .from('permit-documents')
                  .upload(path, buf, { contentType: 'application/pdf', upsert: true });
                if (!upErr) {
                  workingDoc = { ...workingDoc, storage_path: path };
                  await supabase.from('firecrawl_discovered_documents').update({
                    storage_path: path, is_downloaded: true, file_size: buf.length,
                  }).eq('id', workingDoc.id);
                }
              }
            }
          } catch (e) {
            console.warn('self-heal download failed for', workingDoc.id, e);
          }
        }

        // Copy file from permit-documents to permit-form-templates bucket
        const sourcePath = workingDoc.storage_path || '';
        let finalFilePath = workingDoc.storage_path || workingDoc.file_url || '';

        if (sourcePath && (sourcePath.startsWith('firecrawl/') || sourcePath.startsWith('crawled/'))) {
          const destPath = `converted/${county}/${workingDoc.department || 'unknown'}/${Date.now()}_${sourcePath.split('/').pop()}`;
          const copied = await copyFileBetweenBuckets(
            supabase, 'permit-documents', sourcePath, 'permit-form-templates', destPath
          );
          if (copied) {
            finalFilePath = destPath;
            console.log(`📁 Copied ${sourcePath} -> permit-form-templates/${destPath}`);
          } else {
            console.warn(`⚠️ Could not copy file, keeping original path: ${sourcePath}`);
          }
        }

        // Create permit_form_templates entry
        const { data: template, error: templateError } = await supabase
          .from('permit_form_templates')
          .insert({
            form_name: doc.title || 'Untitled Permit Document',
            form_type: classification,
            jurisdiction_name: doc.department || 'Unknown',
            county,
            trade_types: tradeTypes,
            hvhz_only: hvhzOnly,
            file_path: finalFilePath,
            field_mapping: fieldMappings,
            field_count: fieldCount,
            analysis_status: fieldCount > 0 ? 'analyzed' : 'pending',
            last_analyzed_at: fieldCount > 0 ? new Date().toISOString() : null,
            source: 'firecrawl',
            firecrawl_doc_id: doc.id,
            document_classification: classification,
          })
          .select('id')
          .single();

        if (templateError) {
          console.error(`Failed to create template for ${doc.id}:`, templateError);
          continue;
        }

        // Link back
        await supabase.from('firecrawl_discovered_documents').update({
          is_converted_to_smart_doc: true,
          smart_doc_id: template.id,
        }).eq('id', doc.id);

        // Update crawl job counter
        if (doc.crawl_job_id) {
          try {
            const { error: rpcError } = await supabase.rpc('increment_documents_converted', { job_id: doc.crawl_job_id });
            if (rpcError) {
              await supabase.from('firecrawl_crawl_jobs')
                .update({ documents_converted: converted + 1 })
                .eq('id', doc.crawl_job_id);
            }
          } catch {
            await supabase.from('firecrawl_crawl_jobs')
              .update({ documents_converted: converted + 1 })
              .eq('id', doc.crawl_job_id);
          }
        }

        converted++;
        console.log(`✅ Converted ${doc.title} -> smart doc ${template.id} [${classification}]`);

        // Rate limit between AI calls
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (docError) {
        console.error(`Error converting doc ${doc.id}:`, docError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, converted, total: docs?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Smart docs conversion error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
