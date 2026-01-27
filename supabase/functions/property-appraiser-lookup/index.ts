import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PropertyLookupRequest {
  address?: string;
  folio?: string;  // Also known as PCN (Property Control Number)
  county: "palm_beach" | "broward" | "miami_dade";
}

interface PropertyData {
  folio: string;
  address: string;
  city: string;
  zipCode: string;
  legalDescription: string;
  assessedValue: number;
  marketValue: number;
  zoning: string;
  propertyUse: string;
  isHVHZ: boolean;
  ownerName: string;
  ownerAddress: string;
  yearBuilt: number | null;
  livingArea: number | null;
  lotSize: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  roofType: string | null;
  roofYear: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  exemptions: string[];
  taxAmount: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { address, folio, county } = await req.json() as PropertyLookupRequest;

    if (!county) {
      throw new Error("County is required (palm_beach, broward, or miami_dade)");
    }

    if (!address && !folio) {
      throw new Error("Either address or folio/PCN is required");
    }

    console.log(`[property-appraiser-lookup] Looking up: ${address || folio} in ${county} county`);

    let propertyData: PropertyData | null = null;
    let scraped = false;
    let foundFolio = folio;

    // First, check the cache for existing data
    if (address) {
      const normalizedAddress = normalizeAddress(address);
      console.log(`[property-appraiser-lookup] Checking cache for normalized address: ${normalizedAddress}`);
      
      const { data: cachedData } = await supabase
        .from("property_cache")
        .select("*")
        .eq("county", county)
        .ilike("address_normalized", `%${normalizedAddress.substring(0, 30)}%`)
        .limit(1)
        .maybeSingle();
      
      if (cachedData && cachedData.property_data) {
        console.log(`[property-appraiser-lookup] Cache hit! Using cached data for folio: ${cachedData.folio}`);
        propertyData = cachedData.property_data as PropertyData;
        scraped = true;
        
        return new Response(
          JSON.stringify({
            success: true,
            scraped: true,
            cached: true,
            data: propertyData,
            source: `${county.replace("_", " ")} County Property Appraiser (cached)`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If we have a folio, check cache by folio
    if (folio) {
      const { data: cachedByFolio } = await supabase
        .from("property_cache")
        .select("*")
        .eq("folio", folio)
        .eq("county", county)
        .maybeSingle();
      
      if (cachedByFolio && cachedByFolio.property_data) {
        console.log(`[property-appraiser-lookup] Cache hit by folio: ${folio}`);
        propertyData = cachedByFolio.property_data as PropertyData;
        
        return new Response(
          JSON.stringify({
            success: true,
            scraped: true,
            cached: true,
            data: propertyData,
            source: `${county.replace("_", " ")} County Property Appraiser (cached)`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // County-specific lookup URLs
    const getCountyUrls = (countyCode: string, lookupFolio?: string, lookupAddress?: string) => {
      const encodedAddress = lookupAddress ? encodeURIComponent(lookupAddress) : "";
      
      switch (countyCode) {
        case "palm_beach":
          return {
            searchUrl: lookupAddress 
              ? `https://www.pbcgov.org/papa/Asps/Search/Search.aspx?q=${encodedAddress}`
              : null,
            detailUrl: lookupFolio 
              ? `https://www.pbcgov.org/papa/Asps/PropertyDetail/PropertyDetail.aspx?parcel=${lookupFolio}`
              : null,
            baseUrl: "https://www.pbcgov.org/papa/",
          };
        case "broward":
          return {
            searchUrl: lookupAddress 
              ? `https://www.bcpa.net/Property_Search.asp?Search=${encodedAddress}`
              : null,
            detailUrl: lookupFolio 
              ? `https://www.bcpa.net/RecInfo.asp?FolioNo=${lookupFolio}`
              : null,
            baseUrl: "https://www.bcpa.net/",
          };
        case "miami_dade":
          return {
            searchUrl: lookupAddress 
              ? `https://www.miamidade.gov/pa/property_search.asp?address=${encodedAddress}`
              : null,
            detailUrl: lookupFolio 
              ? `https://www.miamidade.gov/pa/property_search.asp?folio=${lookupFolio}`
              : null,
            baseUrl: "https://www.miamidade.gov/pa/",
          };
        default:
          return { searchUrl: null, detailUrl: null, baseUrl: "" };
      }
    };

    const urls = getCountyUrls(county, foundFolio, address);
    const targetUrl = foundFolio ? urls.detailUrl : urls.searchUrl;

    // If we only have an address, we need to first search for the folio
    if (!foundFolio && address && firecrawlKey) {
      console.log(`[property-appraiser-lookup] Searching for folio via address: ${urls.searchUrl}`);
      
      try {
        const searchResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: urls.searchUrl,
            formats: ["markdown"],
            waitFor: 4000,
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          
          if (searchData.success && searchData.data?.markdown) {
            // Use AI to extract folio from search results
            if (lovableApiKey) {
              const folioResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${lovableApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash",
                  messages: [
                    {
                      role: "system",
                      content: `You are an expert at extracting property folio/PCN numbers from Florida county property appraiser search results.
                      
Look for the folio number (also called PCN, Property Control Number, or Parcel ID) in the search results.
For ${county.replace("_", " ")} County, the format is typically:
- Palm Beach: XX-XX-XX-XX-XX-XXX-XXXX (with dashes)
- Broward: XXXXXXXXXXXXXXXX (16 digits)
- Miami-Dade: XX-XXXX-XXX-XXXX (with dashes)

Return ONLY the folio number, nothing else. If multiple properties are found, return the first/best match.
If no folio is found, return "NOT_FOUND".`,
                    },
                    {
                      role: "user",
                      content: `Find the folio/PCN for address "${address}" from this search results page:\n\n${searchData.data.markdown.substring(0, 6000)}`,
                    },
                  ],
                  max_tokens: 100,
                }),
              });

              if (folioResponse.ok) {
                const folioData = await folioResponse.json();
                const extractedFolio = folioData.choices?.[0]?.message?.content?.trim();
                
                if (extractedFolio && extractedFolio !== "NOT_FOUND") {
                  foundFolio = extractedFolio;
                  console.log(`[property-appraiser-lookup] Found folio from address search: ${foundFolio}`);
                }
              }
            }
          }
        }
      } catch (searchError) {
        console.warn("[property-appraiser-lookup] Address search failed:", searchError);
      }
    }

    // Now lookup property details using the folio
    const detailUrl = foundFolio ? getCountyUrls(county, foundFolio).detailUrl : targetUrl;

    if (firecrawlKey && detailUrl) {
      try {
        console.log(`[property-appraiser-lookup] Scraping details from: ${detailUrl}`);
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: detailUrl,
            formats: ["markdown"],
            waitFor: 3000,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          
          if (scrapeData.success && scrapeData.data?.markdown) {
            console.log(`[property-appraiser-lookup] Successfully scraped page, parsing with AI...`);
            scraped = true;

            // Use AI to extract structured data from the scraped content
            if (lovableApiKey) {
              const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${lovableApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash",
                  messages: [
                    {
                      role: "system",
                      content: `You are an expert at extracting property data from Florida county property appraiser websites.
Extract the following fields from the provided content and return as JSON:

{
  "folio": "string - Property Control Number/Folio",
  "address": "string - Full property address",
  "city": "string",
  "zipCode": "string",
  "legalDescription": "string - Legal property description",
  "assessedValue": number,
  "marketValue": number,
  "zoning": "string - Zoning classification",
  "propertyUse": "string - e.g., Single Family, Commercial",
  "ownerName": "string",
  "ownerAddress": "string",
  "yearBuilt": number or null,
  "livingArea": number or null (sq ft),
  "lotSize": number or null (sq ft),
  "bedrooms": number or null,
  "bathrooms": number or null,
  "roofType": "string or null",
  "roofYear": number or null,
  "lastSaleDate": "string YYYY-MM-DD or null",
  "lastSalePrice": number or null,
  "exemptions": ["array of exemption types"],
  "taxAmount": number or null
}

Return ONLY valid JSON. Use null for missing values.`,
                    },
                    {
                      role: "user",
                      content: `Extract property data from this ${county.replace("_", " ")} County property appraiser page:\n\n${scrapeData.data.markdown.substring(0, 8000)}`,
                    },
                  ],
                  max_tokens: 2000,
                }),
              });

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                const content = aiData.choices?.[0]?.message?.content;
                
                if (content) {
                  try {
                    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                    propertyData = JSON.parse(cleanContent);
                    
                    // Determine HVHZ status based on county
                    if (propertyData) {
                      propertyData.isHVHZ = county === "miami_dade" || 
                        (county === "broward" && isCoastalBroward(propertyData.zipCode || ""));
                    }
                  } catch (parseError) {
                    console.warn("[property-appraiser-lookup] Failed to parse AI response:", parseError);
                  }
                }
              }
            }
          }
        }
      } catch (scrapeError) {
        console.warn("[property-appraiser-lookup] Firecrawl scraping failed:", scrapeError);
      }
    }

    // If scraping failed, return guidance on manual lookup
    if (!propertyData) {
      return new Response(
        JSON.stringify({
          success: false,
          scraped: false,
          message: "Unable to automatically retrieve property data. Please visit the county property appraiser website directly.",
          lookupUrl: detailUrl || urls.baseUrl,
          county,
          searchTerm: foundFolio || address,
          manualSteps: [
            `1. Visit ${detailUrl || urls.baseUrl}`,
            `2. Enter the ${foundFolio ? "folio/PCN: " + foundFolio : "address: " + address}`,
            "3. Copy the relevant property details",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cache the result in the database for future lookups
    try {
      const normalizedAddress = normalizeAddress(propertyData.address || address || "");
      
      await supabase.from("property_cache").upsert({
        folio: propertyData.folio || foundFolio || "unknown",
        county,
        address_normalized: normalizedAddress,
        property_data: propertyData,
        scraped_at: new Date().toISOString(),
      }, { onConflict: "folio,county" });
      
      console.log(`[property-appraiser-lookup] Cached property data for folio: ${propertyData.folio}`);
    } catch (cacheError) {
      console.warn("[property-appraiser-lookup] Failed to cache property data:", cacheError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        scraped,
        data: propertyData,
        source: `${county.replace("_", " ")} County Property Appraiser`,
        lookupUrl: detailUrl || urls.baseUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[property-appraiser-lookup] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Normalize address for comparison
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Helper to determine if a Broward zip code is in coastal HVHZ
function isCoastalBroward(zipCode: string): boolean {
  const coastalZips = [
    "33004", "33019", "33020", "33021", "33062", "33301", "33302", "33303",
    "33304", "33305", "33306", "33308", "33309", "33310", "33311", "33312",
    "33315", "33316", "33334", "33394", "33441", "33442", "33443",
  ];
  return coastalZips.includes(zipCode);
}
