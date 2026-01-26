import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LicenseCheckRequest {
  licenseNumber: string;  // e.g., CCC1330395, CBC1234567, CGC1234567
  licenseType?: "contractor" | "roofing" | "general" | "building";
}

interface LicenseData {
  licenseNumber: string;
  licenseType: string;
  status: "active" | "expired" | "suspended" | "revoked" | "inactive" | "unknown";
  businessName: string | null;
  qualifierName: string | null;
  qualifierTitle: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  county: string | null;
  phone: string | null;
  hasComplaints: boolean;
  complaintCount: number;
  disciplinaryActions: string[];
  insuranceOnFile: boolean;
  workersCompOnFile: boolean;
  verifiedAt: string;
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
    const { licenseNumber, licenseType } = await req.json() as LicenseCheckRequest;

    if (!licenseNumber) {
      throw new Error("License number is required");
    }

    // Normalize license number (remove spaces, uppercase)
    const normalizedLicense = licenseNumber.replace(/\s+/g, "").toUpperCase();
    
    console.log(`[dbpr-license-check] Checking license: ${normalizedLicense}`);

    // Determine license prefix and type
    const prefix = normalizedLicense.substring(0, 3);
    let detectedType = licenseType || "unknown";
    
    if (prefix === "CCC") {
      detectedType = "roofing";
    } else if (prefix === "CBC") {
      detectedType = "building";
    } else if (prefix === "CGC") {
      detectedType = "general";
    } else if (prefix === "EC" || prefix === "ER") {
      detectedType = "electrical";
    } else if (prefix === "CFC") {
      detectedType = "plumbing";
    } else if (prefix === "CMC") {
      detectedType = "mechanical";
    }

    // DBPR license lookup URL
    const dbprUrl = `https://www.myfloridalicense.com/LicenseSearch/SearchByLicNum.aspx`;
    const directUrl = `https://www.myfloridalicense.com/wl11.asp?mode=1&search=LicNbr&SID=&bession=&id=&id2=&lression=&LIC=${normalizedLicense}`;

    let licenseData: LicenseData | null = null;

    // Try to scrape DBPR if Firecrawl is available
    if (firecrawlKey) {
      try {
        console.log(`[dbpr-license-check] Scraping DBPR for ${normalizedLicense}`);
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: directUrl,
            formats: ["markdown"],
            waitFor: 3000,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          
          if (scrapeData.success && scrapeData.data?.markdown) {
            console.log(`[dbpr-license-check] Successfully scraped DBPR, parsing with AI...`);

            // Use AI to extract structured data
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
                      content: `You are an expert at extracting Florida contractor license data from DBPR (Department of Business and Professional Regulation) website content.

Extract the following fields and return as JSON:
{
  "licenseNumber": "string",
  "licenseType": "string - e.g., Certified Roofing Contractor, Certified General Contractor",
  "status": "active | expired | suspended | revoked | inactive",
  "businessName": "string or null - DBA/Company name",
  "qualifierName": "string or null - Primary qualifier/license holder name",
  "qualifierTitle": "string or null - e.g., PRIMARY QUALIFIER",
  "issueDate": "string YYYY-MM-DD or null",
  "expirationDate": "string YYYY-MM-DD or null",
  "address": "string or null",
  "city": "string or null",
  "state": "string or null",
  "zipCode": "string or null",
  "county": "string or null",
  "phone": "string or null",
  "hasComplaints": boolean,
  "complaintCount": number,
  "disciplinaryActions": ["array of action descriptions or empty"],
  "insuranceOnFile": boolean,
  "workersCompOnFile": boolean
}

Look for:
- License Status (Current, Expired, etc.)
- Primary Qualifier name
- DBA (Doing Business As) name
- License Effective and Expiration dates
- Any disciplinary actions or complaints
- Business address information

Return ONLY valid JSON. Use null for missing values. Set status to "active" if it says "Current".`,
                    },
                    {
                      role: "user",
                      content: `Extract license data for ${normalizedLicense} from this DBPR page content:\n\n${scrapeData.data.markdown.substring(0, 8000)}`,
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
                    const parsed = JSON.parse(cleanContent);
                    
                    licenseData = {
                      ...parsed,
                      licenseNumber: normalizedLicense,
                      verifiedAt: new Date().toISOString(),
                    };
                  } catch (parseError) {
                    console.warn("[dbpr-license-check] Failed to parse AI response");
                  }
                }
              }
            }
          }
        }
      } catch (scrapeError) {
        console.warn("[dbpr-license-check] Firecrawl scraping failed:", scrapeError);
      }
    }

    // If scraping failed, return manual lookup guidance
    if (!licenseData) {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          licenseNumber: normalizedLicense,
          detectedType,
          message: "Unable to automatically verify license. Please verify manually at DBPR.",
          lookupUrl: dbprUrl,
          directUrl,
          manualSteps: [
            "1. Visit https://www.myfloridalicense.com",
            "2. Click 'Verify a License'",
            `3. Enter license number: ${normalizedLicense}`,
            "4. Check status, expiration date, and any disciplinary actions",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine if license is valid for permitting
    const isValid = licenseData.status === "active" && 
      (!licenseData.expirationDate || new Date(licenseData.expirationDate) > new Date());

    // Check for concerning issues
    const concerns: string[] = [];
    if (licenseData.status !== "active") {
      concerns.push(`License status is ${licenseData.status}`);
    }
    if (licenseData.expirationDate && new Date(licenseData.expirationDate) < new Date()) {
      concerns.push(`License expired on ${licenseData.expirationDate}`);
    }
    if (licenseData.hasComplaints) {
      concerns.push(`${licenseData.complaintCount} complaint(s) on file`);
    }
    if (licenseData.disciplinaryActions && licenseData.disciplinaryActions.length > 0) {
      concerns.push(`${licenseData.disciplinaryActions.length} disciplinary action(s)`);
    }

    // Cache the verification result
    try {
      await supabase.from("license_verifications").upsert({
        license_number: normalizedLicense,
        license_type: detectedType,
        license_data: licenseData,
        is_valid: isValid,
        concerns,
        verified_at: new Date().toISOString(),
      }, { onConflict: "license_number" });
    } catch (cacheError) {
      console.warn("[dbpr-license-check] Failed to cache verification:", cacheError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        isValid,
        concerns,
        data: licenseData,
        source: "Florida DBPR",
        lookupUrl: directUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[dbpr-license-check] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
