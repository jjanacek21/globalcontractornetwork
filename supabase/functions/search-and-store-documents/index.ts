import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchRequest {
  documentType: 'NOA' | 'Engineering Report' | 'County Requirements' | 'Product Approval';
  searchQuery?: string;
  manufacturer?: string;
  productName?: string;
  county?: string;
  autoStore?: boolean;
  targetTable?: 'product_approvals' | 'permit_document_library';
}

interface SearchResult {
  title: string;
  url: string;
  summary: string;
  approvalNumber?: string;
  expirationDate?: string;
  manufacturer?: string;
}

interface StoredDocument {
  id: string;
  documentType: string;
  approvalNumber?: string;
  fileUrl: string;
  storagePath: string;
  source: string;
}

interface FailedDownload {
  url: string;
  error: string;
}

// Build search query based on document type and parameters
function buildSearchQuery(params: SearchRequest): string {
  const parts: string[] = [];
  
  switch (params.documentType) {
    case 'NOA':
      parts.push('Miami-Dade NOA Notice of Acceptance');
      if (params.manufacturer) parts.push(params.manufacturer);
      if (params.productName) parts.push(params.productName);
      parts.push('site:miamidade.gov OR site:floridabuilding.org');
      break;
    case 'Engineering Report':
      parts.push('Florida Product Approval FL# engineering report');
      if (params.manufacturer) parts.push(params.manufacturer);
      if (params.productName) parts.push(params.productName);
      parts.push('site:floridabuilding.org');
      break;
    case 'County Requirements':
      if (params.county) parts.push(`${params.county} County Florida`);
      parts.push('permit requirements building department');
      parts.push('filetype:pdf');
      break;
    case 'Product Approval':
      parts.push('Florida Product Approval');
      if (params.manufacturer) parts.push(params.manufacturer);
      if (params.productName) parts.push(params.productName);
      parts.push('site:floridabuilding.org');
      break;
  }
  
  if (params.searchQuery) {
    parts.push(params.searchQuery);
  }
  
  return parts.join(' ');
}

// Use Claude to search and analyze document sources
async function searchWithAI(
  anthropicKey: string,
  params: SearchRequest
): Promise<{ results: SearchResult[]; summary: string; searchTips: string[] }> {
  const searchQuery = buildSearchQuery(params);
  
  const systemPrompt = `You are an expert at finding Florida construction and permit documents. 
Your task is to find specific document URLs based on the search request.

For NOA documents:
- Primary source: Miami-Dade County Building Code Compliance Office
- URL pattern: https://www.miamidade.gov/apps/pa/noa/
- NOA numbers format: XX-XXXX.XX (e.g., 24-0312.05)

For Florida Product Approvals:
- Primary source: Florida Building Commission Product Approval System
- URL: https://floridabuilding.org/pr/pr_app_srch.aspx
- FL numbers format: FL#XXXXX (e.g., FL12345)

For County Requirements:
- Check county building department websites
- Look for permit application PDFs and checklists

Always provide direct URLs when possible, especially PDF links.
Extract approval numbers, expiration dates, and manufacturer info when visible.`;

  const userPrompt = `Search for: ${searchQuery}

Document Type: ${params.documentType}
${params.manufacturer ? `Manufacturer: ${params.manufacturer}` : ''}
${params.productName ? `Product: ${params.productName}` : ''}
${params.county ? `County: ${params.county}` : ''}

Find relevant documents and return structured results with URLs. Focus on official government and manufacturer sources.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        tools: [
          {
            name: 'web_search',
            type: 'web_search_20250305',
          },
          {
            name: 'report_search_results',
            description: 'Report the structured search results found',
            input_schema: {
              type: 'object',
              properties: {
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Document title' },
                      url: { type: 'string', description: 'Direct URL to document or PDF' },
                      summary: { type: 'string', description: 'Brief description of the document' },
                      approvalNumber: { type: 'string', description: 'NOA or FL approval number if found' },
                      expirationDate: { type: 'string', description: 'Expiration date if found' },
                      manufacturer: { type: 'string', description: 'Manufacturer name if found' },
                    },
                    required: ['title', 'url', 'summary'],
                  },
                },
                summary: { type: 'string', description: 'Overall summary of search findings' },
                searchTips: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tips for finding similar documents',
                },
              },
              required: ['results', 'summary', 'searchTips'],
            },
          },
        ],
        tool_choice: { type: 'auto' },
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI search response received');

    // Extract tool use results
    let results: SearchResult[] = [];
    let summary = 'No documents found matching your search criteria.';
    let searchTips: string[] = [];

    for (const block of data.content || []) {
      if (block.type === 'tool_use' && block.name === 'report_search_results') {
        const input = block.input;
        results = input.results || [];
        summary = input.summary || summary;
        searchTips = input.searchTips || [];
        break;
      }
    }

    // If no structured results, parse text content for URLs
    if (results.length === 0) {
      for (const block of data.content || []) {
        if (block.type === 'text') {
          const urlMatches = block.text.match(/https?:\/\/[^\s\)]+\.pdf/gi) || [];
          for (const url of urlMatches) {
            results.push({
              title: 'Found PDF Document',
              url: url,
              summary: 'PDF document discovered during search',
            });
          }
        }
      }
    }

    return { results, summary, searchTips };
  } catch (error) {
    console.error('AI search error:', error);
    return {
      results: [],
      summary: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      searchTips: ['Try searching directly on miamidade.gov or floridabuilding.org'],
    };
  }
}

// Use Firecrawl to crawl a page and extract PDF links
async function crawlForPDFs(
  firecrawlKey: string,
  url: string
): Promise<string[]> {
  try {
    console.log(`Crawling for PDFs: ${url}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['links', 'markdown'],
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl error for ${url}:`, response.status);
      return [];
    }

    const data = await response.json();
    const links = data.data?.links || [];
    
    // Filter for PDF links
    const pdfLinks = links.filter((link: string) => 
      link.toLowerCase().includes('.pdf') ||
      link.toLowerCase().includes('download') ||
      link.toLowerCase().includes('document')
    );

    console.log(`Found ${pdfLinks.length} potential PDF links from ${url}`);
    return pdfLinks;
  } catch (error) {
    console.error(`Crawl error for ${url}:`, error);
    return [];
  }
}

// Download PDF and store in Supabase
async function downloadAndStorePDF(
  supabase: any,
  url: string,
  documentType: string,
  metadata: { manufacturer?: string; approvalNumber?: string }
): Promise<{ success: boolean; storagePath?: string; publicUrl?: string; error?: string }> {
  try {
    console.log(`Downloading PDF: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PermitQueens/1.0)',
      },
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      return { success: false, error: `Invalid content type: ${contentType}` };
    }

    const buffer = await response.arrayBuffer();
    
    // Validate size (1KB - 50MB)
    if (buffer.byteLength < 1000) {
      return { success: false, error: 'File too small (likely error page)' };
    }
    if (buffer.byteLength > 50 * 1024 * 1024) {
      return { success: false, error: 'File too large (>50MB)' };
    }

    // Generate storage path
    const sanitizedManufacturer = (metadata.manufacturer || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);
    const sanitizedApproval = (metadata.approvalNumber || 'doc')
      .replace(/[^a-zA-Z0-9.-]/g, '-');
    const timestamp = Date.now();
    const storagePath = `${documentType.toLowerCase().replace(/\s+/g, '-')}/${sanitizedManufacturer}/${sanitizedApproval}-${timestamp}.pdf`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('product-approvals')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-approvals')
      .getPublicUrl(storagePath);

    console.log(`✅ Stored PDF: ${storagePath}`);
    return { success: true, storagePath, publicUrl };
  } catch (error) {
    console.error('Download/store error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Save document metadata to database
async function saveToDatabase(
  supabase: any,
  targetTable: string,
  document: {
    documentType: string;
    approvalNumber?: string;
    fileUrl: string;
    storagePath: string;
    source: string;
    manufacturer?: string;
    productName?: string;
    expirationDate?: string;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (targetTable === 'product_approvals') {
      const { data, error } = await supabase
        .from('product_approvals')
        .upsert({
          noa_number: document.approvalNumber,
          file_url: document.fileUrl,
          manufacturer: document.manufacturer || 'Unknown',
          product_name: document.productName || document.documentType,
          source_status: 'found',
          source_website: document.source,
          is_active: true,
        }, {
          onConflict: 'noa_number',
          ignoreDuplicates: false,
        })
        .select('id')
        .single();

      if (error) {
        // Try insert if upsert fails
        const { data: insertData, error: insertError } = await supabase
          .from('product_approvals')
          .insert({
            noa_number: document.approvalNumber,
            file_url: document.fileUrl,
            manufacturer: document.manufacturer || 'Unknown',
            product_name: document.productName || document.documentType,
            source_status: 'found',
            source_website: document.source,
            is_active: true,
          })
          .select('id')
          .single();

        if (insertError) {
          return { success: false, error: insertError.message };
        }
        return { success: true, id: insertData?.id };
      }
      return { success: true, id: data?.id };
    }

    // For other tables, just log for now
    console.log(`Would save to ${targetTable}:`, document);
    return { success: true, id: 'logged' };
  } catch (error) {
    console.error('Database save error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Extract source domain from URL
function extractSource(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const params: SearchRequest = await req.json();
    
    if (!params.documentType) {
      return new Response(
        JSON.stringify({ success: false, error: 'documentType is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const autoStore = params.autoStore !== false;
    const targetTable = params.targetTable || 'product_approvals';

    console.log('=== Search and Store Documents ===');
    console.log(`Type: ${params.documentType}, AutoStore: ${autoStore}`);

    // Step 1: AI-powered search
    console.log('Step 1: Searching with AI...');
    const searchResults = await searchWithAI(ANTHROPIC_API_KEY, params);
    console.log(`Found ${searchResults.results.length} results`);

    const storedDocuments: StoredDocument[] = [];
    const failedDownloads: FailedDownload[] = [];

    if (autoStore && searchResults.results.length > 0) {
      // Step 2: Process each result
      for (const result of searchResults.results) {
        let pdfUrls: string[] = [];

        // Check if result URL is already a PDF
        if (result.url.toLowerCase().includes('.pdf')) {
          pdfUrls = [result.url];
        } else {
          // Step 2a: Crawl page for PDF links
          console.log(`Step 2: Crawling ${result.url} for PDFs...`);
          pdfUrls = await crawlForPDFs(FIRECRAWL_API_KEY, result.url);
          
          // Rate limit
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Step 3: Download and store each PDF
        for (const pdfUrl of pdfUrls.slice(0, 5)) { // Limit to 5 PDFs per result
          console.log(`Step 3: Downloading ${pdfUrl}...`);
          
          const storeResult = await downloadAndStorePDF(supabase, pdfUrl, params.documentType, {
            manufacturer: result.manufacturer || params.manufacturer,
            approvalNumber: result.approvalNumber,
          });

          if (storeResult.success && storeResult.publicUrl) {
            // Step 4: Save to database
            const dbResult = await saveToDatabase(supabase, targetTable, {
              documentType: params.documentType,
              approvalNumber: result.approvalNumber,
              fileUrl: storeResult.publicUrl,
              storagePath: storeResult.storagePath!,
              source: extractSource(pdfUrl),
              manufacturer: result.manufacturer || params.manufacturer,
              productName: result.title || params.productName,
              expirationDate: result.expirationDate,
            });

            storedDocuments.push({
              id: dbResult.id || 'stored',
              documentType: params.documentType,
              approvalNumber: result.approvalNumber,
              fileUrl: storeResult.publicUrl,
              storagePath: storeResult.storagePath!,
              source: extractSource(pdfUrl),
            });
          } else {
            failedDownloads.push({
              url: pdfUrl,
              error: storeResult.error || 'Unknown error',
            });
          }

          // Rate limit between downloads
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }

    console.log(`=== Complete: ${storedDocuments.length} stored, ${failedDownloads.length} failed ===`);

    return new Response(
      JSON.stringify({
        success: true,
        searchResults: {
          results: searchResults.results,
          summary: searchResults.summary,
          searchTips: searchResults.searchTips,
        },
        storedDocuments,
        failedDownloads,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
