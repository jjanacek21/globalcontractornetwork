import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NOAResult {
  noa_number: string;
  product_name: string;
  manufacturer: string;
  category: string;
  expiration_date: string | null;
  hvhz_approved: boolean;
  pdf_url: string | null;
  fl_approval_number?: string;
}

// Helper function to construct direct Miami-Dade NOA PDF URL
function getMiamiDadePdfUrl(noaNumber: string): string {
  return `https://www.miamidade.gov/building/noa-documents/${noaNumber}.pdf`;
}

// Helper function to extract NOA numbers from content
function extractNOANumbers(content: string): string[] {
  const noaNumbers: string[] = [];
  
  if (!content) {
    console.log('extractNOANumbers: No content provided');
    return noaNumbers;
  }
  
  // Multiple patterns to catch different NOA formats - ordered from most specific to least
  const patterns = [
    /NOA\s*(?:No\.?\s*)?#?\s*(\d{2}-\d{4}\.\d{2})/gi,  // NOA No. 21-1234.01, NOA# 21-1234.01
    /NOA[:\s]+(\d{2}-\d{4}\.\d{2})/gi,                  // NOA: 21-1234.01
    /Notice\s+of\s+Acceptance[:\s#]*(\d{2}-\d{4}\.\d{2})/gi, // Notice of Acceptance: 21-1234.01
    /(?:^|[\s,;(])(\d{2}-\d{4}\.\d{2})(?:[\s,;).]|$)/gm,    // Standalone with various delimiters
    /[#:](\d{2}-\d{4}\.\d{2})/gi,                       // #21-1234.01 or :21-1234.01
  ];
  
  console.log(`extractNOANumbers: Scanning content (${content.length} chars)`);
  
  for (const pattern of patterns) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const noaNumber = match[1];
      if (noaNumber && !noaNumbers.includes(noaNumber)) {
        console.log(`  Found NOA: ${noaNumber} (pattern: ${pattern.source})`);
        noaNumbers.push(noaNumber);
      }
    }
  }
  
  // Also try a very loose pattern as fallback
  if (noaNumbers.length === 0) {
    const loosePattern = /(\d{2}-\d{4}\.\d{2})/g;
    let match;
    while ((match = loosePattern.exec(content)) !== null) {
      const noaNumber = match[1];
      if (noaNumber && !noaNumbers.includes(noaNumber)) {
        console.log(`  Found NOA (loose): ${noaNumber}`);
        noaNumbers.push(noaNumber);
      }
    }
  }
  
  console.log(`extractNOANumbers: Found ${noaNumbers.length} NOA numbers`);
  return noaNumbers;
}

// Helper function to extract FL approval numbers
function extractFLNumbers(content: string): string[] {
  const flNumbers: string[] = [];
  
  if (!content) return flNumbers;
  
  const patterns = [
    /FL\s*[#:]?\s*(\d{5,}(?:-R\d+)?)/gi,  // FL 12345, FL# 12345, FL: 12345-R1
    /Florida\s+(?:Product\s+)?Approval\s*[#:]?\s*(\d{5,})/gi,
    /FBC\s*[#:]?\s*(\d{5,})/gi,  // Florida Building Code approval
  ];
  
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const flNumber = `FL${match[1]}`;
      if (!flNumbers.includes(flNumber)) {
        console.log(`  Found FL number: ${flNumber}`);
        flNumbers.push(flNumber);
      }
    }
  }
  
  return flNumbers;
}

// Helper function to parse product name from title/content
function parseProductName(title: string | undefined, manufacturer: string, content?: string): string {
  if (!title && !content) return `${manufacturer} Product`;
  
  const source = title || '';
  
  // Clean up common patterns
  let name = source
    .split(' - ')[0]
    .split(' | ')[0]
    .split(' :: ')[0]
    .replace(/NOA\s*(?:No\.?\s*)?#?\s*\d{2}-\d{4}\.\d{2}/gi, '')
    .replace(/FL\s*\d{5,}/gi, '')
    .replace(/Miami[- ]Dade/gi, '')
    .replace(/Product Approval/gi, '')
    .replace(/Florida Building/gi, '')
    .replace(/County/gi, '')
    .replace(/Search Results?/gi, '')
    .replace(/PDF/gi, '')
    .trim();
  
  // If name is too short or empty, try to extract from content
  if (name.length < 3 && content) {
    // Look for product-related keywords in content
    const productMatch = content.match(/(?:product|system|coating|shingle|tile|membrane)[:\s]+([A-Za-z0-9\s\-]+)/i);
    if (productMatch) {
      name = productMatch[1].trim().substring(0, 100);
    }
  }
  
  // If still empty, use manufacturer
  if (name.length < 3) {
    return `${manufacturer} Product`;
  }
  
  return name.substring(0, 100); // Limit length
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { manufacturer } = await req.json();

    if (!manufacturer || typeof manufacturer !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Manufacturer name is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Searching NOAs for manufacturer: ${manufacturer}`);

    const results: NOAResult[] = [];
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Search 1: Miami-Dade NOA database
    try {
      const searchQuery = `site:miamidade.gov NOA "${manufacturer}" product approval`;
      console.log(`Search 1 - Miami-Dade: ${searchQuery}`);
      
      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 20,
        }),
      });

      if (firecrawlResponse.ok) {
        const searchData = await firecrawlResponse.json();
        console.log(`Miami-Dade search found ${searchData.data?.length || 0} results`);
        
        for (const result of searchData.data || []) {
          console.log(`\n--- Processing Miami-Dade result ---`);
          console.log(`Title: ${result.title || 'No title'}`);
          console.log(`URL: ${result.url || 'No URL'}`);
          
          // Combine title and content for extraction
          const combinedContent = `${result.title || ''} ${result.content || ''}`;
          console.log(`Combined content length: ${combinedContent.length} chars`);
          console.log(`Content preview: ${combinedContent.substring(0, 500)}`);
          
          // Extract NOA numbers from combined content
          const noaNumbers = extractNOANumbers(combinedContent);
          
          if (noaNumbers.length > 0) {
            for (const noaNumber of noaNumbers) {
              if (!results.find(r => r.noa_number === noaNumber)) {
                const productName = parseProductName(result.title, manufacturer, result.content);
                console.log(`Adding NOA: ${noaNumber}, Product: ${productName}`);
                results.push({
                  noa_number: noaNumber,
                  product_name: productName,
                  manufacturer: manufacturer,
                  category: 'Roofing',
                  expiration_date: null,
                  hvhz_approved: true, // Miami-Dade NOAs are HVHZ by default
                  pdf_url: getMiamiDadePdfUrl(noaNumber), // Direct PDF URL
                });
              }
            }
          } else {
            // If no NOA found but URL contains NOA-related content, create entry from URL
            if (result.url) {
              const urlNoaMatch = result.url.match(/(\d{2}-\d{4}\.\d{2})/);
              if (urlNoaMatch) {
                const noaNumber = urlNoaMatch[1];
                if (!results.find(r => r.noa_number === noaNumber)) {
                  console.log(`Found NOA in URL: ${noaNumber}`);
                  results.push({
                    noa_number: noaNumber,
                    product_name: parseProductName(result.title, manufacturer, result.content),
                    manufacturer: manufacturer,
                    category: 'Roofing',
                    expiration_date: null,
                    hvhz_approved: true,
                    pdf_url: getMiamiDadePdfUrl(noaNumber), // Direct PDF URL
                  });
                }
              } else {
                console.log(`No NOA pattern found in content or URL`);
              }
            }
          }
        }
      } else {
        const errorText = await firecrawlResponse.text();
        console.error('Miami-Dade Firecrawl search failed:', errorText);
      }
    } catch (err) {
      console.error('Miami-Dade search error:', err);
    }

    // Search 2: Florida Building Product Approvals
    try {
      const flSearchQuery = `site:floridabuilding.org "${manufacturer}" product approval`;
      console.log(`Search 2 - Florida Building: ${flSearchQuery}`);
      
      const flResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: flSearchQuery,
          limit: 20,
        }),
      });

      if (flResponse.ok) {
        const flData = await flResponse.json();
        console.log(`Florida Building search found ${flData.data?.length || 0} results`);
        
        for (const result of flData.data || []) {
          console.log(`\n--- Processing FL result ---`);
          console.log(`Title: ${result.title || 'No title'}`);
          console.log(`URL: ${result.url || 'No URL'}`);
          
          const combinedContent = `${result.title || ''} ${result.content || ''}`;
          console.log(`Content preview: ${combinedContent.substring(0, 500)}`);
          
          // Extract FL approval numbers
          const flNumbers = extractFLNumbers(combinedContent);
          
          // Also check for NOA numbers in Florida Building results
          const noaNumbers = extractNOANumbers(combinedContent);
          
          for (const flNumber of flNumbers) {
            if (!results.find(r => r.fl_approval_number === flNumber)) {
              console.log(`Adding FL: ${flNumber}`);
              results.push({
                noa_number: flNumber,
                product_name: parseProductName(result.title, manufacturer, result.content),
                manufacturer: manufacturer,
                category: 'Roofing',
                expiration_date: null,
                hvhz_approved: false,
                pdf_url: result.url || null,
                fl_approval_number: flNumber,
              });
            }
          }
          
          // Add any NOA numbers found in FL Building results
          for (const noaNumber of noaNumbers) {
            if (!results.find(r => r.noa_number === noaNumber)) {
              console.log(`Adding NOA from FL site: ${noaNumber}`);
              results.push({
                noa_number: noaNumber,
                product_name: parseProductName(result.title, manufacturer, result.content),
                manufacturer: manufacturer,
                category: 'Roofing',
                expiration_date: null,
                hvhz_approved: false,
                pdf_url: result.url || null,
              });
            }
          }
        }
      } else {
        console.error('Florida Building search failed:', await flResponse.text());
      }
    } catch (err) {
      console.error('Florida Building search error:', err);
    }

    // Search 3: Manufacturer website (if known)
    const manufacturerSites: Record<string, string> = {
      'GAF': 'gaf.com',
      'Polyglass': 'polyglass.us',
      'CertainTeed': 'certainteed.com',
      'Owens Corning': 'owenscorning.com',
      'Johns Manville': 'jm.com',
      'IKO': 'iko.com',
      'Boral': 'boral.com',
      'Eagle Roofing': 'eagleroofing.com',
    };

    const manufacturerLower = manufacturer.toLowerCase();
    const matchedSite = Object.entries(manufacturerSites).find(
      ([name]) => manufacturerLower.includes(name.toLowerCase()) || name.toLowerCase().includes(manufacturerLower)
    );

    if (matchedSite) {
      try {
        const siteSearchQuery = `site:${matchedSite[1]} NOA product approval florida`;
        console.log(`Search 3 - Manufacturer site (${matchedSite[1]}): ${siteSearchQuery}`);
        
        const siteResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: siteSearchQuery,
            limit: 30,
          }),
        });

        if (siteResponse.ok) {
          const siteData = await siteResponse.json();
          console.log(`Manufacturer site search found ${siteData.data?.length || 0} results`);
          
          for (const result of siteData.data || []) {
            console.log(`\n--- Processing manufacturer result ---`);
            console.log(`Title: ${result.title || 'No title'}`);
            console.log(`URL: ${result.url || 'No URL'}`);
            
            const combinedContent = `${result.title || ''} ${result.content || ''}`;
            console.log(`Content preview: ${combinedContent.substring(0, 500)}`);
            
            const noaNumbers = extractNOANumbers(combinedContent);
            
            for (const noaNumber of noaNumbers) {
              if (!results.find(r => r.noa_number === noaNumber)) {
                console.log(`Adding NOA from manufacturer site: ${noaNumber}`);
                results.push({
                  noa_number: noaNumber,
                  product_name: parseProductName(result.title, matchedSite[0], result.content),
                  manufacturer: matchedSite[0],
                  category: 'Roofing',
                  expiration_date: null,
                  hvhz_approved: true,
                  pdf_url: result.url || null,
                });
              }
            }
          }
        } else {
          console.error('Manufacturer site search failed:', await siteResponse.text());
        }
      } catch (err) {
        console.error('Manufacturer site search error:', err);
      }
    }

    // Remove duplicates and sort
    const uniqueResults = results.filter((r, i, arr) => 
      arr.findIndex(x => x.noa_number === r.noa_number) === i
    ).sort((a, b) => a.noa_number.localeCompare(b.noa_number));

    console.log(`Found ${uniqueResults.length} unique NOA products for ${manufacturer}`);
    
    // Log summary of what was found
    if (uniqueResults.length > 0) {
      console.log('Results summary:');
      uniqueResults.forEach(r => console.log(`  - ${r.noa_number}: ${r.product_name}`));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: uniqueResults,
        manufacturer,
        count: uniqueResults.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Search failed' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
