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

interface ExtractedDocument {
  noaNumber: string | null;
  pdfUrl: string;
  title?: string;
}

// Known dynamic sites that require scraping instead of mapping
const DYNAMIC_SITE_PATTERNS = [
  'miamidade.gov/building',
  'miamidade.gov/product',
  'floridabuilding.org/pr',
  'bcap.floridabuilding.org',
  'productapproval.state.fl.us',
];

function isDynamicSite(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return DYNAMIC_SITE_PATTERNS.some(pattern => lowerUrl.includes(pattern));
}

function extractNoaFromUrl(url: string): string | null {
  // Try various NOA number patterns
  const patterns = [
    /NOA[\s\-_]?(\d{2}[\s\-_]?\d{4}\.\d{2})/i,
    /(\d{2}[\s\-_]?\d{4}\.\d{2})/,
    /FL[\s\-_]?(\d+[\-_]?\d*)/i,
    /PA[\s\-_]?(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].replace(/[\s_]/g, '-');
    }
  }
  return null;
}

function extractNoaFromText(text: string): string | null {
  const patterns = [
    /NOA[\s\-_:#]*(\d{2}[\s\-_]?\d{4}\.\d{2})/gi,
    /Notice of Acceptance[\s\-_:#]*(\d{2}[\s\-_]?\d{4}\.\d{2})/gi,
    /FL[\s\-_]?(\d+[\-_]?\d*)/gi,
  ];
  
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      return match[1].replace(/[\s_]/g, '-');
    }
  }
  return null;
}

async function crawlDynamicSite(
  url: string,
  firecrawlApiKey: string,
  documentTypes: string[]
): Promise<ExtractedDocument[]> {
  console.log('Using scrape approach for dynamic site:', url);
  
  const documents: ExtractedDocument[] = [];
  
  try {
    // Scrape the page with JavaScript rendering
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links', 'html'],
        onlyMainContent: false, // Get full page for dynamic content
        waitFor: 5000, // Wait for JS to render
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Scrape failed:', scrapeData);
      throw new Error(scrapeData.error || 'Failed to scrape dynamic site');
    }

    console.log('Scrape successful, analyzing content...');
    
    // Extract links from the scraped content
    const links: string[] = scrapeData.data?.links || [];
    const markdown: string = scrapeData.data?.markdown || '';
    const html: string = scrapeData.data?.html || '';
    
    console.log(`Found ${links.length} links on the page`);
    
    // Filter for PDF links
    const pdfLinks = links.filter(link => 
      link.toLowerCase().endsWith('.pdf') ||
      link.toLowerCase().includes('/pdf/') ||
      link.toLowerCase().includes('getdocument') ||
      link.toLowerCase().includes('download')
    );
    
    console.log(`Found ${pdfLinks.length} potential PDF links`);
    
    // Process PDF links
    for (const pdfUrl of pdfLinks) {
      const noaNumber = extractNoaFromUrl(pdfUrl) || extractNoaFromText(markdown);
      documents.push({
        noaNumber,
        pdfUrl,
        title: noaNumber ? `NOA ${noaNumber}` : undefined,
      });
    }
    
    // Also look for NOA references in the HTML/markdown that might link to PDFs
    const noaPattern = /NOA[\s\-_:#]*(\d{2}[\s\-_]?\d{4}\.\d{2})/gi;
    let match;
    while ((match = noaPattern.exec(markdown)) !== null) {
      const noaNumber = match[1].replace(/[\s_]/g, '-');
      // Check if we already have this NOA
      if (!documents.some(d => d.noaNumber === noaNumber)) {
        // Try to construct a potential PDF URL for Miami-Dade
        if (url.includes('miamidade.gov')) {
          const potentialUrl = `https://www.miamidade.gov/building/library/noa/NOA${noaNumber}.pdf`;
          documents.push({
            noaNumber,
            pdfUrl: potentialUrl,
            title: `NOA ${noaNumber}`,
          });
        }
      }
    }
    
    // Look for product approval patterns in Florida Building Code site
    if (url.includes('floridabuilding.org') || url.includes('productapproval')) {
      const flPattern = /FL[\s\-_]?(\d+[\-_]?\d*)/gi;
      while ((match = flPattern.exec(markdown)) !== null) {
        const flNumber = match[1].replace(/[\s_]/g, '-');
        if (!documents.some(d => d.noaNumber === `FL-${flNumber}`)) {
          documents.push({
            noaNumber: `FL-${flNumber}`,
            pdfUrl: url, // Store the source URL, actual PDF would need to be found
            title: `FL ${flNumber}`,
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error in dynamic site crawl:', error);
    throw error;
  }
  
  return documents;
}

async function crawlStaticSite(
  url: string,
  firecrawlApiKey: string,
  documentTypes: string[]
): Promise<ExtractedDocument[]> {
  console.log('Using map approach for static site:', url);
  
  const documents: ExtractedDocument[] = [];
  
  // Use Firecrawl Map to discover all URLs
  const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      limit: 500,
      includeSubdomains: false,
    }),
  });

  const mapData = await mapResponse.json();
  
  if (!mapResponse.ok || !mapData.success) {
    console.error('Map failed:', mapData);
    
    // Fall back to scrape if map fails
    console.log('Falling back to scrape approach...');
    return await crawlDynamicSite(url, firecrawlApiKey, documentTypes);
  }

  const allUrls: string[] = mapData.links || [];
  console.log(`Map found ${allUrls.length} URLs`);

  // Filter for PDF links and relevant pages
  const relevantUrls = allUrls.filter(u => {
    const lower = u.toLowerCase();
    return (
      lower.endsWith('.pdf') || 
      lower.includes('/pdf/') ||
      lower.includes('noa') ||
      lower.includes('approval') ||
      lower.includes('product') ||
      lower.includes('document')
    );
  });

  console.log(`Filtered to ${relevantUrls.length} relevant URLs`);

  // Process each URL
  for (const pdfUrl of relevantUrls) {
    if (pdfUrl.toLowerCase().endsWith('.pdf')) {
      const noaNumber = extractNoaFromUrl(pdfUrl);
      documents.push({
        noaNumber,
        pdfUrl,
        title: noaNumber ? `NOA ${noaNumber}` : undefined,
      });
    }
  }
  
  // For non-PDF pages, optionally scrape them to find PDF links
  const nonPdfPages = relevantUrls.filter(u => !u.toLowerCase().endsWith('.pdf')).slice(0, 10);
  
  for (const pageUrl of nonPdfPages) {
    try {
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: pageUrl,
          formats: ['links'],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeResponse.json();
      
      if (scrapeData.success && scrapeData.data?.links) {
        const pagePdfLinks = scrapeData.data.links.filter((l: string) => 
          l.toLowerCase().endsWith('.pdf')
        );

        for (const pdfLink of pagePdfLinks.slice(0, 5)) {
          const noaNumber = extractNoaFromUrl(pdfLink);
          if (!documents.some(d => d.pdfUrl === pdfLink)) {
            documents.push({
              noaNumber,
              pdfUrl: pdfLink,
              title: noaNumber ? `NOA ${noaNumber}` : undefined,
            });
          }
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.error(`Error scraping ${pageUrl}:`, err);
    }
  }
  
  return documents;
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
      await supabase
        .from('custom_source_websites')
        .update({ 
          crawl_status: 'error', 
          error_message: 'Firecrawl API key not configured. Please enable the Firecrawl connector in Settings.' 
        })
        .eq('id', sourceId);

      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured. Please enable it in Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting crawl for source ${sourceId}: ${url}`);
    console.log(`Target category: ${targetCategory}, Document types: ${documentTypes.join(', ')}`);
    console.log(`Site type: ${isDynamicSite(url) ? 'DYNAMIC' : 'STATIC'}`);

    // Update status to crawling
    await supabase
      .from('custom_source_websites')
      .update({ crawl_status: 'crawling', error_message: null })
      .eq('id', sourceId);

    let documents: ExtractedDocument[];
    
    // Choose crawling strategy based on site type
    if (isDynamicSite(url)) {
      documents = await crawlDynamicSite(url, firecrawlApiKey, documentTypes);
    } else {
      documents = await crawlStaticSite(url, firecrawlApiKey, documentTypes);
    }

    console.log(`Crawl discovered ${documents.length} documents`);

    // Store discovered documents
    let documentsFound = 0;
    const processedDocs: string[] = [];

    for (const doc of documents.slice(0, 100)) { // Limit to 100 per crawl
      try {
        const approvalNumber = doc.noaNumber || `CRAWL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const { error: insertError } = await supabase
          .from('product_approvals')
          .upsert({
            approval_number: approvalNumber,
            approval_type: documentTypes.includes('noa') ? 'noa' : 'fl_approval',
            pdf_url: doc.pdfUrl,
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
          processedDocs.push(doc.pdfUrl);
        } else {
          console.log(`Skipped duplicate or error: ${approvalNumber}`);
        }
      } catch (err) {
        console.error(`Error storing document:`, err);
      }
    }

    // Update source status
    await supabase
      .from('custom_source_websites')
      .update({
        crawl_status: 'completed',
        last_crawl_at: new Date().toISOString(),
        documents_found: documentsFound,
        error_message: documentsFound === 0 ? 'No documents found. The site may require manual review or different search parameters.' : null,
      })
      .eq('id', sourceId);

    console.log(`Crawl complete. Found and stored ${documentsFound} documents.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentsFound,
        totalDiscovered: documents.length,
        siteType: isDynamicSite(url) ? 'dynamic' : 'static',
        processedDocs: processedDocs.slice(0, 10),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Crawl error:', error);
    
    // Try to update the source with the error
    try {
      const { sourceId } = await req.clone().json();
      if (sourceId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        await supabase
          .from('custom_source_websites')
          .update({ 
            crawl_status: 'error', 
            error_message: error instanceof Error ? error.message : 'Unknown crawl error' 
          })
          .eq('id', sourceId);
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
