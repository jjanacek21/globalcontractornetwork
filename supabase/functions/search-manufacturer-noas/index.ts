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

// Helper function to extract NOA numbers from content
function extractNOANumbers(content: string): string[] {
  const noaNumbers: string[] = [];
  
  // Multiple patterns to catch different NOA formats
  const patterns = [
    /NOA\s*(?:No\.?\s*)?#?\s*(\d{2}-\d{4}\.\d{2})/gi,  // NOA No. 21-1234.01, NOA# 21-1234.01
    /(?:^|\s)(\d{2}-\d{4}\.\d{2})(?:\s|$|[,;.])/gm,    // Standalone: 21-1234.01
    /NOA[:\s]+(\d{2}-\d{4}\.\d{2})/gi,                  // NOA: 21-1234.01
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const noaNumber = match[1];
      if (noaNumber && !noaNumbers.includes(noaNumber)) {
        noaNumbers.push(noaNumber);
      }
    }
  }
  
  return noaNumbers;
}

// Helper function to extract FL approval numbers
function extractFLNumbers(content: string): string[] {
  const flNumbers: string[] = [];
  
  const patterns = [
    /FL\s*[#:]?\s*(\d{5,}(?:-R\d+)?)/gi,  // FL 12345, FL# 12345, FL: 12345-R1
    /Florida\s+(?:Product\s+)?Approval\s*[#:]?\s*(\d{5,})/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const flNumber = `FL${match[1]}`;
      if (!flNumbers.includes(flNumber)) {
        flNumbers.push(flNumber);
      }
    }
  }
  
  return flNumbers;
}

// Helper function to parse product name from title/content
function parseProductName(title: string | undefined, manufacturer: string): string {
  if (!title) return `${manufacturer} Product`;
  
  // Clean up common patterns
  let name = title
    .split(' - ')[0]
    .split(' | ')[0]
    .split(' :: ')[0]
    .replace(/NOA\s*(?:No\.?\s*)?#?\s*\d{2}-\d{4}\.\d{2}/gi, '')
    .replace(/FL\s*\d{5,}/gi, '')
    .replace(/Miami[- ]Dade/gi, '')
    .replace(/Product Approval/gi, '')
    .replace(/Florida Building/gi, '')
    .trim();
  
  // If name is too short or empty, use manufacturer
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
          console.log(`Processing result: ${result.title}`);
          console.log(`URL: ${result.url}`);
          console.log(`Content preview: ${result.content?.substring(0, 300)}`);
          
          // Extract NOA numbers from content
          const noaNumbers = extractNOANumbers(result.content || '');
          console.log(`Extracted NOA numbers: ${noaNumbers.join(', ') || 'none'}`);
          
          for (const noaNumber of noaNumbers) {
            if (!results.find(r => r.noa_number === noaNumber)) {
              results.push({
                noa_number: noaNumber,
                product_name: parseProductName(result.title, manufacturer),
                manufacturer: manufacturer,
                category: 'Roofing',
                expiration_date: null,
                hvhz_approved: true, // Miami-Dade NOAs are HVHZ by default
                pdf_url: result.url || null, // Store the page URL, not just .pdf
              });
            }
          }
          
          // If no NOA numbers found but result seems relevant, still include the URL
          if (noaNumbers.length === 0 && result.url && result.title?.toLowerCase().includes('noa')) {
            console.log(`No NOA number extracted, but URL seems relevant: ${result.url}`);
          }
        }
      } else {
        console.error('Miami-Dade Firecrawl search failed:', await firecrawlResponse.text());
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
          console.log(`Processing FL result: ${result.title}`);
          console.log(`URL: ${result.url}`);
          
          // Extract FL approval numbers
          const flNumbers = extractFLNumbers(result.content || '');
          console.log(`Extracted FL numbers: ${flNumbers.join(', ') || 'none'}`);
          
          for (const flNumber of flNumbers) {
            if (!results.find(r => r.fl_approval_number === flNumber)) {
              results.push({
                noa_number: flNumber,
                product_name: parseProductName(result.title, manufacturer),
                manufacturer: manufacturer,
                category: 'Roofing',
                expiration_date: null,
                hvhz_approved: false,
                pdf_url: result.url || null,
                fl_approval_number: flNumber,
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
            console.log(`Processing manufacturer result: ${result.title}`);
            
            const noaNumbers = extractNOANumbers(result.content || '');
            console.log(`Extracted NOA numbers: ${noaNumbers.join(', ') || 'none'}`);
            
            for (const noaNumber of noaNumbers) {
              if (!results.find(r => r.noa_number === noaNumber)) {
                results.push({
                  noa_number: noaNumber,
                  product_name: parseProductName(result.title, matchedSite[0]),
                  manufacturer: matchedSite[0],
                  category: 'Roofing',
                  expiration_date: null,
                  hvhz_approved: true,
                  pdf_url: result.url || null,
                });
              }
            }
          }
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
