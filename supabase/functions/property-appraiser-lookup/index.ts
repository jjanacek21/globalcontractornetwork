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

    // County-specific lookup URLs
    const countyUrls: Record<string, string> = {
      palm_beach: folio 
        ? `https://www.pbcgov.org/papa/Asps/PropertyDetail/PropertyDetail.aspx?parcel=${folio}`
        : `https://www.pbcgov.org/papa/`,
      broward: folio
        ? `https://www.bcpa.net/RecInfo.asp?FolioNo=${folio}`
        : `https://www.bcpa.net/`,
      miami_dade: folio
        ? `https://www.miamidade.gov/pa/property_search.asp?folio=${folio}`
        : `https://www.miamidade.gov/pa/`,
    };

    const targetUrl = countyUrls[county];

    // Use Firecrawl to scrape property data if available
    if (firecrawlKey && folio) {
      try {
        console.log(`[property-appraiser-lookup] Scraping ${targetUrl}`);
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: targetUrl,
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
                    console.warn("[property-appraiser-lookup] Failed to parse AI response");
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
          lookupUrl: targetUrl,
          county,
          searchTerm: folio || address,
          manualSteps: [
            `1. Visit ${targetUrl}`,
            `2. Enter the ${folio ? "folio/PCN: " + folio : "address: " + address}`,
            "3. Copy the relevant property details",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cache the result in the database for future lookups
    try {
      await supabase.from("property_cache").upsert({
        folio: propertyData.folio,
        county,
        property_data: propertyData,
        scraped_at: new Date().toISOString(),
      }, { onConflict: "folio,county" });
    } catch (cacheError) {
      console.warn("[property-appraiser-lookup] Failed to cache property data:", cacheError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        scraped,
        data: propertyData,
        source: `${county.replace("_", " ")} County Property Appraiser`,
        lookupUrl: targetUrl,
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

// Helper to determine if a Broward zip code is in coastal HVHZ
function isCoastalBroward(zipCode: string): boolean {
  const coastalZips = [
    "33004", "33019", "33020", "33021", "33062", "33301", "33302", "33303",
    "33304", "33305", "33306", "33308", "33309", "33310", "33311", "33312",
    "33315", "33316", "33334", "33394", "33441", "33442", "33443",
  ];
  return coastalZips.includes(zipCode);
}
