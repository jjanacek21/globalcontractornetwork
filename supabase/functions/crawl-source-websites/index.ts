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
  manufacturer?: string;
  productName?: string;
  category?: string;
  subcategory?: string;
  material?: string;
  description?: string;
  impactRating?: string;
  designPressurePlus?: number;
  designPressureMinus?: number;
  classification?: string;
  expirationDate?: string;
  hvhzApproved?: boolean;
}

// Known dynamic sites that require scraping instead of mapping
const DYNAMIC_SITE_PATTERNS = [
  'miamidade.gov/building',
  'miamidade.gov/product',
  'floridabuilding.org/pr',
  'bcap.floridabuilding.org',
  'productapproval.state.fl.us',
];

// Miami-Dade search result pages that have HTML tables
const MIAMI_DADE_SEARCH_PATTERNS = [
  'pc-result_app.asp',
  'pc_result',
  'search_result',
];

// Validate Miami-Dade search URL has actual search criteria
function validateMiamiDadeSearchUrl(url: string): { valid: boolean; message?: string } {
  const lowerUrl = url.toLowerCase();
  
  // Check if this is a Miami-Dade URL
  if (!lowerUrl.includes('miamidade.gov')) {
    return { valid: true }; // Not a Miami-Dade URL, skip validation
  }
  
  // Check if the URL includes search parameters that indicate it's a results page
  const hasAdvancedSearch = lowerUrl.includes('advancedsearch=go');
  const hasNoaSearch = /fldnoa=[^&]+[a-z0-9]/i.test(url); // Has actual NOA value
  const hasClassification = /classification=\d+[^,0]/.test(url); // Has non-zero classification
  const hasApplicant = /applicant=[^&]+[a-z]/i.test(url); // Has applicant name
  
  // If it's a search page but appears to have no real search criteria
  if (lowerUrl.includes('pc-result_app.asp') || lowerUrl.includes('pc_result')) {
    if (!hasAdvancedSearch) {
      return {
        valid: false,
        message: 'This URL appears to be the search form, not search results. Please: (1) Go to the Miami-Dade NOA search page, (2) Enter search criteria (e.g., a manufacturer name or NOA number), (3) Click Search, (4) Copy the URL from your browser after results appear.'
      };
    }
    
    // Check if search has meaningful criteria
    if (!hasNoaSearch && !hasApplicant) {
      return { valid: true }; // Allow it but proceed with warning logged above
    }
  }
  
  return { valid: true };
}

function isDynamicSite(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return DYNAMIC_SITE_PATTERNS.some(pattern => lowerUrl.includes(pattern));
}

function isMiamiDadeSearchResults(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('miamidade.gov') && 
    MIAMI_DADE_SEARCH_PATTERNS.some(pattern => lowerUrl.includes(pattern));
}

function extractNoaFromUrl(url: string): string | null {
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

// Parse date from formats like "July 15 2026" or "March 1 2026"
function parseExpirationDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const months: { [key: string]: string } = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  
  // Try "Month Day Year" format
  const match = dateStr.trim().match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (match) {
    const month = months[match[1].toLowerCase()];
    if (month) {
      const day = match[2].padStart(2, '0');
      return `${match[3]}-${month}-${day}`;
    }
  }
  
  // Try other formats
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }
  
  return null;
}

// Parse HTML table from Miami-Dade search results
function parseMiamiDadeTable(html: string): ExtractedDocument[] {
  const documents: ExtractedDocument[] = [];
  
  console.log('Parsing Miami-Dade search results HTML table...');
  console.log(`HTML length: ${html.length} chars`);
  
  // Debug: Show sample of HTML
  const sampleStart = html.indexOf('<table');
  const sampleEnd = Math.min(sampleStart + 2000, html.length);
  if (sampleStart > -1) {
    console.log(`Found <table> at position ${sampleStart}`);
    console.log(`Table sample: ${html.substring(sampleStart, sampleEnd).replace(/\s+/g, ' ').substring(0, 500)}`);
  } else {
    console.log('No <table> tag found in HTML!');
    // Check what we do have
    console.log(`First 500 chars: ${html.substring(0, 500)}`);
  }
  
  // Count tables in the HTML
  const tableMatches = html.match(/<table[^>]*>/gi);
  console.log(`Found ${tableMatches?.length || 0} tables in HTML`);
  
  // Find all table rows
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const allRows: string[] = [];
  let rowMatch;
  
  while ((rowMatch = rowPattern.exec(html)) !== null) {
    allRows.push(rowMatch[1]);
  }
  console.log(`Found ${allRows.length} total <tr> rows`);
  
  // Debug: Log first few rows to understand structure
  if (allRows.length > 0) {
    console.log(`First row sample (stripped): ${allRows[0].replace(/<[^>]+>/g, ' | ').replace(/\s+/g, ' ').substring(0, 300)}`);
  }
  if (allRows.length > 1) {
    console.log(`Second row sample (stripped): ${allRows[1].replace(/<[^>]+>/g, ' | ').replace(/\s+/g, ' ').substring(0, 300)}`);
  }
  if (allRows.length > 2) {
    console.log(`Third row sample (stripped): ${allRows[2].replace(/<[^>]+>/g, ' | ').replace(/\s+/g, ' ').substring(0, 300)}`);
  }
  
  // NOA patterns - Miami-Dade uses formats like "24-0101.01", "23-0525.05", etc.
  // Also try without dashes: "240101.01" or with different separators
  const noaPatterns = [
    /(\d{2}-\d{4}\.\d{2})/,           // Standard: 24-0101.01
    /(\d{2}\s*-\s*\d{4}\s*\.\s*\d{2})/, // With spaces: 24 - 0101 . 01
    /(\d{6,8}\.\d{2})/,                // No dash: 240101.01
    /NOA[:\s#]*(\d{2}-?\d{4}\.?\d{2})/i, // With NOA prefix
    /(\d{2}-\d{4}-\d{2})/,             // Dash variant: 24-0101-01
  ];
  
  let rowCount = 0;
  let skippedNoPattern = 0;
  let skippedTooFewCells = 0;
  
  for (const rowContent of allRows) {
    // Skip header rows
    if (rowContent.includes('<th') || 
        rowContent.toUpperCase().includes('>APPLICANT<') || 
        rowContent.toUpperCase().includes('>NOA<') ||
        rowContent.toUpperCase().includes('>CATEGORY<')) {
      continue;
    }
    
    // Try all NOA patterns
    let noaNumber: string | null = null;
    for (const pattern of noaPatterns) {
      const match = rowContent.match(pattern);
      if (match) {
        noaNumber = match[1].replace(/\s+/g, ''); // Remove any spaces
        break;
      }
    }
    
    if (!noaNumber) {
      skippedNoPattern++;
      continue;
    }
    
    rowCount++;
    
    // Extract all cells using a fresh regex for each row
    const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
      let cellText = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#\d+;/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellText);
    }
    
    // Debug first matching row
    if (rowCount === 1) {
      console.log(`First data row has ${cells.length} cells: ${JSON.stringify(cells.slice(0, 5))}`);
    }
    
    if (cells.length < 5) {
      skippedTooFewCells++;
      continue;
    }
    
    // Parse cells - Miami-Dade table structure (from their search results):
    // [0] NOA | [1] APPLICANT | [2] CATEGORY | [3] SUBCATEGORY | [4] MATERIAL | 
    // [5] DESCRIPTION | [6] IMPACT | [7] MDP+ | [8] MDP- | [9] CLASS_DESC | [10] EXPIRES
    const manufacturer = cells[1] || '';
    const category = cells[2] || '';
    const subcategory = cells[3] || '';
    const material = cells[4] || '';
    const description = cells[5] || '';
    const impactRating = cells[6] || '';
    const mdpPlus = parseFloat(cells[7]) || 0;
    const mdpMinus = parseFloat(cells[8]) || 0;
    const classification = cells[9] || '';
    const expires = cells[10] || '';
    
    // Normalize NOA number format to XX-XXXX.XX
    let normalizedNoa = noaNumber;
    if (!noaNumber.includes('-') && noaNumber.length >= 8) {
      normalizedNoa = `${noaNumber.substring(0, 2)}-${noaNumber.substring(2)}`;
    }
    
    // Build the PDF URL - remove dots and dashes for the filename
    const noaForUrl = normalizedNoa.replace(/[-\.]/g, '');
    const pdfUrl = `https://www.miamidade.gov/building/library/noa/${noaForUrl}.pdf`;
    
    // Check if HVHZ approved based on classification
    const hvhzApproved = classification.toLowerCase().includes('high velocity') || 
                         classification.toLowerCase().includes('hvhz') ||
                         classification.toLowerCase().includes('hurricane');
    
    documents.push({
      noaNumber: normalizedNoa,
      pdfUrl,
      title: `NOA ${normalizedNoa}`,
      manufacturer: manufacturer.replace(/\s+/g, ' ').trim(),
      productName: description.substring(0, 200),
      category: mapCategory(category),
      subcategory,
      material,
      description,
      impactRating,
      designPressurePlus: mdpPlus,
      designPressureMinus: mdpMinus,
      classification,
      expirationDate: parseExpirationDate(expires) || undefined,
      hvhzApproved,
    });
  }
  
  console.log(`Parsing summary: ${allRows.length} rows, ${rowCount} with NOA pattern, ${skippedNoPattern} skipped (no pattern), ${skippedTooFewCells} skipped (too few cells)`);
  console.log(`Extracted ${documents.length} valid documents`);
  
  // Log sample documents
  if (documents.length > 0) {
    console.log(`Sample document: ${JSON.stringify(documents[0])}`);
  }
  
  return documents;
}

// Map Miami-Dade categories to our product categories
function mapCategory(mdCategory: string): string {
  const lower = mdCategory.toLowerCase();
  if (lower.includes('roof')) return 'roofing';
  if (lower.includes('window')) return 'windows_doors';
  if (lower.includes('door')) return 'windows_doors';
  if (lower.includes('glass') || lower.includes('glazing')) return 'windows_doors';
  if (lower.includes('shutter')) return 'shutters';
  if (lower.includes('panel')) return 'panels';
  if (lower.includes('fastener')) return 'fasteners';
  if (lower.includes('insulation')) return 'insulation';
  if (lower.includes('coating')) return 'coatings';
  if (lower.includes('underlayment')) return 'underlayment';
  return 'other';
}

async function crawlMiamiDadeSearchResults(
  url: string,
  firecrawlApiKey: string
): Promise<ExtractedDocument[]> {
  console.log('Crawling Miami-Dade search results page:', url);
  
  try {
    // First try: Scrape with rawHtml format and extended wait time
    console.log('Attempting Firecrawl scrape with extended wait...');
    let scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['rawHtml', 'html', 'markdown'],
        onlyMainContent: false,
        waitFor: 15000, // Wait 15 seconds for ASP.NET to fully render
        timeout: 60000, // Allow up to 60 seconds total
      }),
    });

    let scrapeData = await scrapeResponse.json();
    console.log('Firecrawl response status:', scrapeResponse.status);
    
    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('First scrape attempt failed:', scrapeData);
      
      // Retry with different settings
      console.log('Retrying with alternative settings...');
      scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['html'],
          onlyMainContent: false,
          waitFor: 20000,
        }),
      });
      scrapeData = await scrapeResponse.json();
      
      if (!scrapeResponse.ok || !scrapeData.success) {
        console.error('Retry also failed:', scrapeData);
        throw new Error(scrapeData.error || 'Failed to scrape Miami-Dade search results');
      }
    }

    // Try rawHtml first, then html, then content from data
    const html = scrapeData.data?.rawHtml || scrapeData.data?.html || scrapeData.rawHtml || scrapeData.html || '';
    console.log(`Received ${html.length} characters of HTML`);
    
    // Debug: Check what keys are available in scrapeData
    console.log('Scrape data keys:', Object.keys(scrapeData || {}).join(', '));
    if (scrapeData.data) {
      console.log('Scrape data.data keys:', Object.keys(scrapeData.data || {}).join(', '));
    }
    
    // Check if the HTML contains the table or if we got a JavaScript shell
    const hasTable = html.toLowerCase().includes('<table');
    const hasNOAPattern = /\d{2}-\d{4}\.\d{2}/.test(html);
    const hasGridData = html.toLowerCase().includes('datagrid') || html.toLowerCase().includes('gridview');
    
    console.log(`HTML analysis: hasTable=${hasTable}, hasNOAPattern=${hasNOAPattern}, hasGridData=${hasGridData}`);
    
    if (html.length < 5000 && !hasTable) {
      console.log('HTML too short and no table found. This ASP.NET site may require form POST submission.');
      console.log('The Miami-Dade search requires a form submission, not a direct URL load.');
      console.log('Recommendation: Upload PDFs manually via the NOA Intelligence tab.');
      
      // Return early with diagnostic info
      return [];
    }
    
    // The Miami-Dade site uses ASP.NET postback - the table is NOT rendered via GET URL
    // Even with JavaScript rendering, the search results require a form POST with ViewState
    if (!hasTable && !hasNOAPattern) {
      console.log('No table or NOA pattern found. HTML preview (1000 chars):', 
        html.substring(0, 1000).replace(/\s+/g, ' '));
      
      // Check if this is the search form page (no results loaded)
      if (html.includes('pc-searchnoa.asp') || html.includes('AdvancedSearch')) {
        console.log('Detected Miami-Dade search form page without results.');
        console.log('This ASP.NET site requires a server-side form POST to return results.');
        console.log('The URL with GET parameters does not trigger the search - it needs ViewState and form data.');
        
        // Return with clear message
        return [];
      }
    }
    
    // Parse the HTML table
    return parseMiamiDadeTable(html);
    
  } catch (error) {
    console.error('Error crawling Miami-Dade search results:', error);
    throw error;
  }
}

async function crawlDynamicSite(
  url: string,
  firecrawlApiKey: string,
  documentTypes: string[]
): Promise<ExtractedDocument[]> {
  // Check if this is a Miami-Dade search results page with the table format
  if (isMiamiDadeSearchResults(url)) {
    return await crawlMiamiDadeSearchResults(url, firecrawlApiKey);
  }
  
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
        onlyMainContent: false,
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Scrape failed:', scrapeData);
      throw new Error(scrapeData.error || 'Failed to scrape dynamic site');
    }

    console.log('Scrape successful, analyzing content...');
    
    const links: string[] = scrapeData.data?.links || [];
    const markdown: string = scrapeData.data?.markdown || '';
    const html: string = scrapeData.data?.html || '';
    
    console.log(`Found ${links.length} links on the page`);
    
    // If it looks like a Miami-Dade page, try table parsing
    if (url.includes('miamidade.gov') && html.includes('<table')) {
      const tableDocuments = parseMiamiDadeTable(html);
      if (tableDocuments.length > 0) {
        return tableDocuments;
      }
    }
    
    // Filter for PDF links
    const pdfLinks = links.filter(link => 
      link.toLowerCase().endsWith('.pdf') ||
      link.toLowerCase().includes('/pdf/') ||
      link.toLowerCase().includes('getdocument') ||
      link.toLowerCase().includes('download')
    );
    
    console.log(`Found ${pdfLinks.length} potential PDF links`);
    
    for (const pdfUrl of pdfLinks) {
      const noaNumber = extractNoaFromUrl(pdfUrl) || extractNoaFromText(markdown);
      documents.push({
        noaNumber,
        pdfUrl,
        title: noaNumber ? `NOA ${noaNumber}` : undefined,
      });
    }
    
    // Look for NOA references in the HTML/markdown that might link to PDFs
    const noaPattern = /NOA[\s\-_:#]*(\d{2}[\s\-_]?\d{4}\.\d{2})/gi;
    let match;
    while ((match = noaPattern.exec(markdown)) !== null) {
      const noaNumber = match[1].replace(/[\s_]/g, '-');
      if (!documents.some(d => d.noaNumber === noaNumber)) {
        if (url.includes('miamidade.gov')) {
          const potentialUrl = `https://www.miamidade.gov/building/library/noa/${noaNumber.replace('.', '')}.pdf`;
          documents.push({
            noaNumber,
            pdfUrl: potentialUrl,
            title: `NOA ${noaNumber}`,
            hvhzApproved: true,
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
            pdfUrl: url,
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
    console.log('Falling back to scrape approach...');
    return await crawlDynamicSite(url, firecrawlApiKey, documentTypes);
  }

  const allUrls: string[] = mapData.links || [];
  console.log(`Map found ${allUrls.length} URLs`);

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
  
  const nonPdfPages = relevantUrls.filter(u => !u.toLowerCase().endsWith('.pdf')).slice(0, 10);
  
  for (const pageUrl of nonPdfPages) {
    try {
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v2/scrape', {
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
    const requestBody: CrawlRequest = await req.json();
    let { sourceId, url, targetCategory, documentTypes, crawlDepth } = requestBody;

    if (!url || !sourceId) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL and sourceId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize URL - remove common prefixes users might accidentally include
    url = url.trim();
    const prefixesToRemove = ['Enter this URL:', 'URL:', 'Enter URL:', 'Link:'];
    for (const prefix of prefixesToRemove) {
      if (url.toLowerCase().startsWith(prefix.toLowerCase())) {
        url = url.substring(prefix.length).trim();
      }
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      await supabase
        .from('custom_source_websites')
        .update({ 
          crawl_status: 'error', 
          error_message: `Invalid URL format: "${url.substring(0, 50)}...". Please enter a valid URL starting with https://` 
        })
        .eq('id', sourceId);

      return new Response(
        JSON.stringify({ success: false, error: `Invalid URL format. Please enter a valid URL starting with https://` }),
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
    console.log(`Site type: ${isDynamicSite(url) ? 'DYNAMIC' : 'STATIC'}, Miami-Dade Search: ${isMiamiDadeSearchResults(url)}`);

    // Validate Miami-Dade URLs for proper search criteria
    const urlValidation = validateMiamiDadeSearchUrl(url);
    if (!urlValidation.valid) {
      console.log('Miami-Dade URL validation failed:', urlValidation.message);
      
      await supabase
        .from('custom_source_websites')
        .update({ 
          crawl_status: 'error', 
          error_message: urlValidation.message 
        })
        .eq('id', sourceId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: urlValidation.message,
          hint: 'Go to https://www.miamidade.gov/building/pc-searchnoa.asp, perform a search, then copy the URL from the results page.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase
      .from('custom_source_websites')
      .update({ crawl_status: 'crawling', error_message: null })
      .eq('id', sourceId);

    let documents: ExtractedDocument[];
    
    if (isDynamicSite(url)) {
      documents = await crawlDynamicSite(url, firecrawlApiKey, documentTypes);
    } else {
      documents = await crawlStaticSite(url, firecrawlApiKey, documentTypes);
    }

    console.log(`Crawl discovered ${documents.length} documents`);

    let documentsFound = 0;
    const processedDocs: string[] = [];
    let pdfsDownloaded = 0;

    for (const doc of documents.slice(0, 500)) { // Increased limit to 500 per crawl
      try {
        // Use the NOA number as the primary identifier
        const noaNumber = doc.noaNumber?.replace('.', '') || null;
        
        // PHASE 2: Download and store the PDF in Supabase Storage
        let storedPdfUrl: string | null = null;
        if (doc.pdfUrl) {
          try {
            console.log(`Downloading PDF for NOA ${noaNumber}: ${doc.pdfUrl}`);
            const pdfResponse = await fetch(doc.pdfUrl);
            
            if (pdfResponse.ok) {
              const pdfBuffer = await pdfResponse.arrayBuffer();
              const pdfBytes = new Uint8Array(pdfBuffer);
              
              // Create a safe filename
              const safeNoaNumber = (noaNumber || `doc-${Date.now()}`).replace(/[^a-zA-Z0-9-]/g, '-');
              const storagePath = `noa-pdfs/${safeNoaNumber}.pdf`;
              
              // Upload to Supabase Storage
              const { error: uploadError } = await supabase.storage
                .from('product-approvals')
                .upload(storagePath, pdfBytes, {
                  contentType: 'application/pdf',
                  upsert: true,
                });
              
              if (!uploadError) {
                // Get public URL since bucket is public
                const { data: urlData } = supabase.storage
                  .from('product-approvals')
                  .getPublicUrl(storagePath);
                
                if (urlData?.publicUrl) {
                  storedPdfUrl = urlData.publicUrl;
                  pdfsDownloaded++;
                  console.log(`Stored PDF at: ${storedPdfUrl}`);
                }
              } else {
                console.warn(`Upload error for ${noaNumber}:`, uploadError);
              }
            }
          } catch (pdfErr) {
            console.warn(`Failed to download PDF for ${noaNumber}:`, pdfErr);
          }
        }
        
        // Check if this product already exists
        let existingProduct = null;
        if (noaNumber) {
          const { data: existing } = await supabase
            .from('product_approvals')
            .select('id')
            .eq('noa_number', noaNumber)
            .single();
          existingProduct = existing;
        }
        
        if (existingProduct) {
          // Update existing product with stored PDF URL
          const { error: updateError } = await supabase
            .from('product_approvals')
            .update({
              noa_pdf_url: storedPdfUrl || doc.pdfUrl,
              file_url: storedPdfUrl || doc.pdfUrl,
              source_status: storedPdfUrl ? 'found' : 'crawl_discovered',
              last_source_attempt: new Date().toISOString(),
              source_website: url,
              ...(doc.expirationDate && { expiration_date: doc.expirationDate }),
              ...(doc.hvhzApproved !== undefined && { hvhz_approved: doc.hvhzApproved }),
              ...(doc.designPressureMinus && { 
                specifications: { 
                  mdp_plus: doc.designPressurePlus,
                  mdp_minus: doc.designPressureMinus,
                  material: doc.material,
                  impact_rating: doc.impactRating,
                }
              }),
            })
            .eq('id', existingProduct.id);
            
          if (!updateError) {
            documentsFound++;
            processedDocs.push(doc.pdfUrl);
          }
        } else if (doc.noaNumber && doc.manufacturer) {
          // Insert new product with stored PDF URL
          const { error: insertError } = await supabase
            .from('product_approvals')
            .insert({
              noa_number: noaNumber,
              manufacturer: doc.manufacturer,
              product_name: doc.productName || doc.description?.substring(0, 200) || 'Unknown Product',
              product_category: doc.category || (targetCategory !== 'all' ? targetCategory : 'other'),
              noa_pdf_url: storedPdfUrl || doc.pdfUrl,
              file_url: storedPdfUrl || doc.pdfUrl,
              expiration_date: doc.expirationDate,
              hvhz_approved: doc.hvhzApproved || false,
              source_status: storedPdfUrl ? 'found' : 'crawl_discovered',
              source_website: url,
              last_source_attempt: new Date().toISOString(),
              is_active: true,
              specifications: {
                mdp_plus: doc.designPressurePlus,
                mdp_minus: doc.designPressureMinus,
                material: doc.material,
                subcategory: doc.subcategory,
                classification: doc.classification,
                impact_rating: doc.impactRating,
              },
              metadata: {
                crawl_source: 'miami_dade_search',
                crawl_date: new Date().toISOString(),
                pdf_stored: !!storedPdfUrl,
              },
            });

          if (!insertError) {
            documentsFound++;
            processedDocs.push(doc.pdfUrl);
          } else {
            console.log(`Insert error for ${noaNumber}:`, insertError.message);
          }
        } else if (doc.pdfUrl) {
          // Insert minimal record for PDFs without full metadata
          const tempId = `CRAWL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const { error: insertError } = await supabase
            .from('product_approvals')
            .insert({
              noa_number: doc.noaNumber || tempId,
              manufacturer: doc.manufacturer || 'Unknown',
              product_name: doc.title || 'Discovered Product',
              product_category: doc.category || (targetCategory !== 'all' ? targetCategory : 'other'),
              noa_pdf_url: storedPdfUrl || doc.pdfUrl,
              file_url: storedPdfUrl || doc.pdfUrl,
              source_status: storedPdfUrl ? 'found' : 'crawl_discovered',
              source_website: url,
              last_source_attempt: new Date().toISOString(),
              is_active: true,
            });

          if (!insertError) {
            documentsFound++;
            processedDocs.push(doc.pdfUrl);
          }
        }
      } catch (err) {
        console.error(`Error storing document:`, err);
      }
    }

    // Create specific error message based on site type
    let errorMessage: string | null = null;
    if (documentsFound === 0) {
      if (isMiamiDadeSearchResults(url)) {
        errorMessage = 'Miami-Dade NOA search requires server-side form submission (ASP.NET PostBack). The URL with GET parameters cannot load results. Please use the NOA Intelligence tab to upload PDFs manually, or use the Document Search feature to find specific NOAs.';
      } else {
        errorMessage = 'No documents found. This may be because: (1) The site requires login/authentication, (2) PDFs are loaded dynamically via JavaScript, or (3) No matching products exist. Try uploading PDFs manually.';
      }
    }

    await supabase
      .from('custom_source_websites')
      .update({
        crawl_status: 'completed',
        last_crawl_at: new Date().toISOString(),
        documents_found: documentsFound,
        error_message: errorMessage,
      })
      .eq('id', sourceId);

    console.log(`Crawl complete. Found ${documentsFound} documents, downloaded ${pdfsDownloaded} PDFs.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentsFound,
        pdfsDownloaded,
        totalDiscovered: documents.length,
        siteType: isDynamicSite(url) ? 'dynamic' : 'static',
        isMiamiDadeSearch: isMiamiDadeSearchResults(url),
        processedDocs: processedDocs.slice(0, 10),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Crawl error:', error);
    
    try {
      const { sourceId } = await req.clone().json();
      if (sourceId) {
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
