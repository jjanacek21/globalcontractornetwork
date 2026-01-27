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
  
  // Find all table rows - the results table has NOA in first column
  // Match rows that contain NOA patterns
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  
  let rowMatch;
  let rowCount = 0;
  
  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    
    // Skip header rows (contain <th> or header text)
    if (rowContent.includes('<th') || rowContent.includes('APPLICANT') || rowContent.includes('CATEGORY')) {
      continue;
    }
    
    // Check if this row has an NOA number pattern
    const noaMatch = rowContent.match(/(\d{2}-\d{4}\.\d{2})/);
    if (!noaMatch) continue;
    
    rowCount++;
    const noaNumber = noaMatch[1];
    
    // Extract all cells
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
      // Strip HTML tags and decode entities
      let cellText = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellText);
    }
    // Reset regex for next row
    cellPattern.lastIndex = 0;
    
    if (cells.length < 7) continue;
    
    // Parse cells based on Miami-Dade table structure:
    // NOA | APPLICANT | CATEGORY | SUBCATEGORY | MATERIAL | DESCRIPTION | IMPACT | MDP+ | MDP- | CLASS_DESC | EXPIRES
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
    
    // Build the PDF URL
    const pdfUrl = `https://www.miamidade.gov/building/library/noa/${noaNumber.replace('.', '')}.pdf`;
    
    // Check if HVHZ approved based on classification
    const hvhzApproved = classification.toLowerCase().includes('high velocity') || 
                         classification.toLowerCase().includes('hvhz') ||
                         classification.toLowerCase().includes('hurricane zone');
    
    documents.push({
      noaNumber,
      pdfUrl,
      title: `NOA ${noaNumber}`,
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
  
  console.log(`Parsed ${rowCount} product rows from table, extracted ${documents.length} valid documents`);
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
    // Scrape the search results page with full HTML
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'rawHtml'],
        onlyMainContent: false,
        waitFor: 8000, // Wait longer for ASP.NET to render
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Scrape failed:', scrapeData);
      throw new Error(scrapeData.error || 'Failed to scrape Miami-Dade search results');
    }

    const html = scrapeData.data?.rawHtml || scrapeData.data?.html || '';
    console.log(`Received ${html.length} characters of HTML`);
    
    if (html.length < 1000) {
      console.log('HTML too short, site may require form submission');
      return [];
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
    console.log(`Site type: ${isDynamicSite(url) ? 'DYNAMIC' : 'STATIC'}, Miami-Dade Search: ${isMiamiDadeSearchResults(url)}`);

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

    await supabase
      .from('custom_source_websites')
      .update({
        crawl_status: 'completed',
        last_crawl_at: new Date().toISOString(),
        documents_found: documentsFound,
        error_message: documentsFound === 0 ? 'No documents found. The site may require manual review or different search parameters.' : null,
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
