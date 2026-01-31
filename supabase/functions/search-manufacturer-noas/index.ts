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

    // Strategy 1: Search Florida Building Product Approval database
    try {
      const flSearchUrl = `https://floridabuilding.org/pr/pr_app_srch.aspx`;
      // Note: Florida Building uses ASP.NET postback which is hard to scrape
      // We'll focus on direct Miami-Dade NOA search
    } catch (err) {
      console.error('Florida Building search error:', err);
    }

    // Strategy 2: Search Miami-Dade NOA database via their search API
    // Miami-Dade's NOA search is at: https://www.miamidade.gov/permits/product-approval.asp
    // They use a product search that we can query
    try {
      // The Miami-Dade site uses a complex ASP.NET form, but we can try their search endpoint
      const searchTerms = encodeURIComponent(manufacturer);
      
      // Try the public Miami-Dade product search
      const mdSearchUrl = `https://www.miamidade.gov/building/noa-search.asp?manufacturer=${searchTerms}`;
      
      console.log(`Searching Miami-Dade: ${mdSearchUrl}`);
      
      // Since Miami-Dade's site requires form submission, we'll use a workaround
      // by searching their NOA database directly or using cached/known products
      
      // For now, let's implement a fallback using web search for manufacturer NOAs
      const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
      
      if (firecrawlApiKey) {
        // Use Firecrawl to search for manufacturer NOAs
        const searchQuery = `site:miamidade.gov NOA "${manufacturer}" product approval`;
        
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
          console.log(`Firecrawl found ${searchData.data?.length || 0} results`);
          
          // Parse NOA numbers from search results
          for (const result of searchData.data || []) {
            const noaMatches = result.content?.match(/NOA\s*(?:No\.?\s*)?(\d{2}-\d{4}\.\d{2})/gi) || [];
            for (const match of noaMatches) {
              const noaNumber = match.replace(/NOA\s*(?:No\.?\s*)?/i, '').trim();
              if (!results.find(r => r.noa_number === noaNumber)) {
                results.push({
                  noa_number: noaNumber,
                  product_name: result.title || `${manufacturer} Product`,
                  manufacturer: manufacturer,
                  category: 'Roofing',
                  expiration_date: null,
                  hvhz_approved: true, // Miami-Dade NOAs are HVHZ by default
                  pdf_url: result.url?.includes('.pdf') ? result.url : null,
                });
              }
            }
          }
        }
      }

      // Also try searching floridabuilding.org for FL Product Approvals
      if (firecrawlApiKey) {
        const flSearchQuery = `site:floridabuilding.org "${manufacturer}" product approval`;
        
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
          console.log(`Firecrawl FL search found ${flData.data?.length || 0} results`);
          
          // Parse FL approval numbers
          for (const result of flData.data || []) {
            const flMatches = result.content?.match(/FL\s*(\d{5,}(?:-R\d+)?)/gi) || [];
            for (const match of flMatches) {
              const flNumber = match.trim();
              if (!results.find(r => r.fl_approval_number === flNumber)) {
                results.push({
                  noa_number: flNumber,
                  product_name: result.title || `${manufacturer} Product`,
                  manufacturer: manufacturer,
                  category: 'Roofing',
                  expiration_date: null,
                  hvhz_approved: false,
                  pdf_url: result.url?.includes('.pdf') ? result.url : null,
                  fl_approval_number: flNumber,
                });
              }
            }
          }
        }
      }

    } catch (err) {
      console.error('Miami-Dade search error:', err);
    }

    // Strategy 3: Search manufacturer websites for NOA listings
    // Many manufacturers publish their NOAs on their websites
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
      const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlApiKey) {
        try {
          const siteSearchQuery = `site:${matchedSite[1]} NOA product approval florida`;
          
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
              // Extract NOA numbers from content
              const noaMatches = result.content?.match(/NOA\s*(?:No\.?\s*)?(\d{2}-\d{4}\.\d{2})/gi) || [];
              for (const match of noaMatches) {
                const noaNumber = match.replace(/NOA\s*(?:No\.?\s*)?/i, '').trim();
                if (!results.find(r => r.noa_number === noaNumber)) {
                  results.push({
                    noa_number: noaNumber,
                    product_name: result.title || `${manufacturer} Product`,
                    manufacturer: matchedSite[0],
                    category: 'Roofing',
                    expiration_date: null,
                    hvhz_approved: true,
                    pdf_url: result.url?.includes('.pdf') ? result.url : null,
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error('Manufacturer site search error:', err);
        }
      }
    }

    // Remove duplicates and sort
    const uniqueResults = results.filter((r, i, arr) => 
      arr.findIndex(x => x.noa_number === r.noa_number) === i
    ).sort((a, b) => a.noa_number.localeCompare(b.noa_number));

    console.log(`Found ${uniqueResults.length} unique NOA products for ${manufacturer}`);

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
