import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrawlRequest {
  sourceId: string;
  url: string;
  targetCategory: string;
  documentTypes: string[];
  crawlDepth: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { sourceId, url, targetCategory, documentTypes, crawlDepth }: CrawlRequest = await req.json();

    if (!url || !sourceId) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL and sourceId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!firecrawlApiKey) {
      // Update source with error
      await supabase
        .from('custom_source_websites')
        .update({ 
          crawl_status: 'error', 
          error_message: 'Firecrawl API key not configured' 
        })
        .eq('id', sourceId);

      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured. Please enable it in Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting crawl for source ${sourceId}: ${url}`);
    console.log(`Target category: ${targetCategory}, Document types: ${documentTypes.join(', ')}`);

    // Step 1: Use Firecrawl Map to discover all URLs
    console.log('Step 1: Mapping website...');
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        limit: 500, // Limit to 500 URLs per crawl
        includeSubdomains: false,
      }),
    });

    const mapData = await mapResponse.json();
    
    if (!mapResponse.ok || !mapData.success) {
      console.error('Map failed:', mapData);
      await supabase
        .from('custom_source_websites')
        .update({ 
          crawl_status: 'error', 
          error_message: mapData.error || 'Failed to map website' 
        })
        .eq('id', sourceId);

      return new Response(
        JSON.stringify({ success: false, error: mapData.error || 'Failed to map website' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allUrls: string[] = mapData.links || [];
    console.log(`Found ${allUrls.length} URLs on the site`);

    // Step 2: Filter for PDF links and product pages
    const pdfLinks = allUrls.filter(u => 
      u.toLowerCase().endsWith('.pdf') || 
      u.toLowerCase().includes('/pdf/') ||
      u.toLowerCase().includes('noa') ||
      u.toLowerCase().includes('approval') ||
      u.toLowerCase().includes('product')
    );

    console.log(`Filtered to ${pdfLinks.length} potential document URLs`);

    // Step 3: Process PDF links (limit to 50 per run to avoid timeout)
    const linksToProcess = pdfLinks.slice(0, 50);
    let documentsFound = 0;
    const processedDocs: string[] = [];

    for (const pdfUrl of linksToProcess) {
      try {
        // Check if this is a direct PDF link
        if (pdfUrl.toLowerCase().endsWith('.pdf')) {
          // Try to extract NOA number from URL
          const noaMatch = pdfUrl.match(/NOA[\s\-_]?(\d{2}[\s\-_]?\d{4}\.\d{2})/i) || 
                          pdfUrl.match(/(\d{2}[\s\-_]?\d{4}\.\d{2})/);
          
          const noaNumber = noaMatch ? noaMatch[1].replace(/[\s_]/g, '-') : null;
          
          // Store the document reference
          const { error: insertError } = await supabase
            .from('product_approvals')
            .upsert({
              approval_number: noaNumber || `CRAWL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              approval_type: documentTypes.includes('noa') ? 'noa' : 'fl_approval',
              pdf_url: pdfUrl,
              source_url: url,
              source_status: 'crawl_discovered',
              category: targetCategory !== 'all' ? targetCategory : null,
              is_active: true,
            }, {
              onConflict: 'approval_number',
              ignoreDuplicates: true,
            });

          if (!insertError) {
            documentsFound++;
            processedDocs.push(pdfUrl);
          }
        } else {
          // For non-PDF pages, scrape to find PDF links
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: pdfUrl,
              formats: ['links', 'markdown'],
              onlyMainContent: true,
            }),
          });

          const scrapeData = await scrapeResponse.json();
          
          if (scrapeData.success && scrapeData.data?.links) {
            const pagePdfLinks = scrapeData.data.links.filter((l: string) => 
              l.toLowerCase().endsWith('.pdf')
            );

            for (const pdf of pagePdfLinks.slice(0, 10)) { // Limit PDFs per page
              const noaMatch = pdf.match(/NOA[\s\-_]?(\d{2}[\s\-_]?\d{4}\.\d{2})/i) ||
                              pdf.match(/(\d{2}[\s\-_]?\d{4}\.\d{2})/);
              
              const { error: insertError } = await supabase
                .from('product_approvals')
                .upsert({
                  approval_number: noaMatch ? noaMatch[1].replace(/[\s_]/g, '-') : `CRAWL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  approval_type: documentTypes.includes('noa') ? 'noa' : 'fl_approval',
                  pdf_url: pdf,
                  source_url: pdfUrl,
                  source_status: 'crawl_discovered',
                  category: targetCategory !== 'all' ? targetCategory : null,
                  is_active: true,
                }, {
                  onConflict: 'approval_number',
                  ignoreDuplicates: true,
                });

              if (!insertError) {
                documentsFound++;
                processedDocs.push(pdf);
              }
            }
          }
        }

        // Rate limiting - 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.error(`Error processing ${pdfUrl}:`, err);
        continue;
      }
    }

    // Step 4: Update source status
    await supabase
      .from('custom_source_websites')
      .update({
        crawl_status: 'completed',
        last_crawl_at: new Date().toISOString(),
        documents_found: documentsFound,
        error_message: null,
      })
      .eq('id', sourceId);

    console.log(`Crawl complete. Found ${documentsFound} documents.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentsFound,
        urlsScanned: linksToProcess.length,
        totalUrlsFound: allUrls.length,
        processedDocs: processedDocs.slice(0, 10), // Return first 10 for UI
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Crawl error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
