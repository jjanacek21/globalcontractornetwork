import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentType, searchQuery, county, manufacturer, productName } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    console.log("Permit document search request:", { documentType, searchQuery, county, manufacturer, productName });

    // Build the search prompt based on document type
    const systemPrompt = `You are an expert Florida building permit document specialist. Your job is to help contractors find the right permit documents, NOAs, and product approvals.

You have extensive knowledge of:
- Miami-Dade County NOA (Notice of Acceptance) system
- Florida Building Code and product approvals (FL numbers)
- County building department requirements across Florida
- Manufacturer product documentation and specifications

When providing document search results, return a JSON object with this structure:
{
  "results": [
    {
      "type": "NOA|Engineering Report|County Form|Product Approval",
      "title": "Document title",
      "description": "Brief description of what this document contains",
      "url": "Official URL where this can be found (if known)",
      "source": "Source website or agency",
      "relevance": "Why this document matches the search"
    }
  ],
  "summary": "A helpful summary explaining what was found and any important notes",
  "searchTips": ["Tip 1 for finding more documents", "Tip 2"]
}

IMPORTANT SOURCES TO REFERENCE:
- Miami-Dade NOAs: https://www.miamidade.gov/building/pc-search.asp (NOA format: XX-XXXX.XX)
- Florida Product Approvals: https://floridabuilding.org/pr/pr_app_srch.aspx (FL format: FLXXXXX)
- Broward County: https://webapps6.broward.org/building/
- Palm Beach County: https://discover.pbcgov.org/pzb/building/Pages/default.aspx

Always provide real, verifiable URLs when possible. If you're not certain of a URL, explain how to search for the document instead.`;

    let userPrompt = "";

    if (documentType === "NOA") {
      userPrompt = `I need to find Miami-Dade County NOA (Notice of Acceptance) documents for:
${manufacturer ? `Manufacturer: ${manufacturer}` : ""}
${productName ? `Product: ${productName}` : ""}
${searchQuery ? `Additional details: ${searchQuery}` : ""}

Find relevant NOA documents including:
- NOA numbers and their status
- Expiration dates
- Product specifications covered
- Installation requirements
- Direct links to the NOA PDFs if available

The Miami-Dade NOA search is at: https://www.miamidade.gov/building/pc-search.asp
NOA PDFs follow pattern: https://www.miamidade.gov/building/library/noa/[NOA_NUMBER_without_decimals].pdf`;

    } else if (documentType === "County Requirements") {
      userPrompt = `I need to find ${county || "Florida"} County building department requirements for permits.

Search for:
- Permit application forms and checklists
- Required documentation lists
- Local code amendments
- Wind load zone/HVHZ information
- Fee schedules
- Contractor licensing requirements

Provide official government website URLs only.`;

    } else if (documentType === "Engineering Report") {
      userPrompt = `I need to find Florida Product Approval engineering documents for: ${searchQuery}

Search for:
- FL approval numbers and documentation
- Product specifications and test reports
- Installation instructions
- Load tables and wind ratings
- Compliance documentation

The Florida Product Approval search is at: https://floridabuilding.org/pr/pr_app_srch.aspx`;

    } else {
      userPrompt = `I need to find ${documentType} documents related to: ${searchQuery}
${county ? `County: ${county}` : ""}
${manufacturer ? `Manufacturer: ${manufacturer}` : ""}
${productName ? `Product: ${productName}` : ""}

Find relevant official documents from government building departments, product approval agencies, and manufacturer technical documentation.`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your ANTHROPIC_API_KEY." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    console.log("AI response received, parsing...");

    // Parse the JSON response from the AI
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, create a structured response from the text
        result = {
          results: [],
          summary: content,
          searchTips: [
            "Visit the official Miami-Dade NOA search at miamidade.gov/building/pc-search.asp",
            "Check Florida Product Approval database at floridabuilding.org",
          ],
        };
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      result = {
        results: [],
        summary: content,
        searchTips: [
          "The search returned text results. Please review the summary above.",
        ],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Permit document search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
