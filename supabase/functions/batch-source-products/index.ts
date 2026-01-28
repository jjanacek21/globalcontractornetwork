import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BatchRequest {
  category?: string;
  limit?: number;
  priorityOrder?: string[];
  forceRescan?: boolean;
}

// Known manufacturer website patterns for direct lookups
const MANUFACTURER_PATTERNS: Record<string, string> = {
  GAF: "gaf.com",
  CertainTeed: "certainteed.com",
  "Owens Corning": "owenscorning.com",
  IKO: "iko.com",
  Tamko: "tamko.com",
  Atlas: "atlasroofing.com",
  BASF: "basf.com",
  Polyglass: "polyglass.us",
  "Johns Manville": "jm.com",
  Tremco: "tremcoinc.com",
  Andersen: "andersenwindows.com",
  Pella: "pella.com",
  PGT: "pgtindustries.com",
  CGI: "cgiwindows.com",
  Milgard: "milgard.com",
  Simonton: "simonton.com",
  Marvin: "marvin.com",
  Boral: "boral.com",
  Eagle: "eagleroofing.com",
  Monier: "monier.com",
  Ludowici: "ludowici.com",
  "US Tile": "ustile.com",
};

// Official document sources
const OFFICIAL_SOURCES = {
  floridaBuilding: "https://floridabuilding.org/pr/pr_app_srch.aspx",
  miamidadeNoa: "https://www.miamidade.gov/permits/product-control-search.asp",
  ulProspector: "https://productiq.ulprospector.com",
};

// Download PDF from external URL and store in Lovable storage
async function downloadAndStorePdf(
  supabase: any,
  pdfUrl: string,
  productId: string,
  docType: "noa" | "fl_approval" | "ul_listing" | "installation_guide" | "pe_evaluation",
): Promise<string | null> {
  try {
    console.log(`Downloading PDF from: ${pdfUrl}`);

    const response = await fetch(pdfUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PermitQueens/1.0)",
      },
    });

    if (!response.ok) {
      console.error(`Failed to download PDF: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("pdf") && !contentType?.includes("octet-stream")) {
      console.warn(`Unexpected content type: ${contentType}`);
    }

    const pdfBuffer = await response.arrayBuffer();

    if (pdfBuffer.byteLength < 1000) {
      console.warn(`PDF too small (${pdfBuffer.byteLength} bytes), likely an error page`);
      return null;
    }

    const filename = `${productId}/${docType}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage.from("product-approvals").upload(filename, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-approvals").getPublicUrl(filename);

    console.log(`✅ PDF stored locally: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("Download/store error:", error);
    return null;
  }
}

// Search for documents using Firecrawl
async function searchForDocuments(
  firecrawlApiKey: string,
  lovableApiKey: string,
  manufacturer: string,
  productName: string,
  noaNumber: string | null,
  flApproval: string | null,
  productCategory: string,
): Promise<{
  noa_url: string | null;
  fl_url: string | null;
  ul_url: string | null;
  installation_guide_url: string | null;
  pe_evaluation_url: string | null;
  source_website: string | null;
}> {
  try {
    const searchTerms = [];
    if (noaNumber) searchTerms.push(noaNumber);
    if (flApproval) searchTerms.push(`FL ${flApproval}`);
    searchTerms.push(manufacturer, productName, "product approval PDF");

    const query = searchTerms.join(" ");

    const manufacturerKey = Object.keys(MANUFACTURER_PATTERNS).find((key) =>
      manufacturer.toLowerCase().includes(key.toLowerCase()),
    );
    const manufacturerDomain = manufacturerKey ? MANUFACTURER_PATTERNS[manufacturerKey] : null;

    console.log(`Searching for: ${query}`);

    // Search manufacturer site first
    const manufacturerSearch = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: manufacturerDomain ? `${query} site:${manufacturerDomain}` : query,
        limit: 8,
        scrapeOptions: { formats: ["links", "markdown"] },
      }),
    });

    let searchResults = [];
    if (manufacturerSearch.ok) {
      const data = await manufacturerSearch.json();
      searchResults = data.data || [];
    }

    // Also search Florida Building Code site
    const fbcSearch = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${noaNumber || flApproval || productName} site:floridabuilding.org product approval`,
        limit: 5,
        scrapeOptions: { formats: ["links", "markdown"] },
      }),
    });

    if (fbcSearch.ok) {
      const data = await fbcSearch.json();
      searchResults = [...searchResults, ...(data.data || [])];
    }

    // Use AI to analyze results and extract best URLs
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [
          {
            role: "system",
            content: `You are an expert at finding Florida building product approval documents. Extract the most relevant PDF URLs from search results. Prioritize:
1. Miami-Dade NOA documents (for HVHZ)
2. Florida Product Approvals (FL# or FBC approval)
3. UL 2218 impact test reports (for metal/shingle roofing)
4. Manufacturer installation guides
5. P.E. evaluations

Only return URLs that appear to be direct PDF links or product approval pages.`,
          },
          {
            role: "user",
            content: `Find documents for:
Manufacturer: ${manufacturer}
Product: ${productName}
Category: ${productCategory}
${noaNumber ? `NOA Number: ${noaNumber}` : ""}
${flApproval ? `FL Product Approval: ${flApproval}` : ""}

Search results:
${JSON.stringify(searchResults.slice(0, 10), null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_document_urls",
              description: "Extract product approval and related document URLs",
              parameters: {
                type: "object",
                properties: {
                  noa_pdf_url: { type: "string", description: "Direct URL to Miami-Dade NOA PDF" },
                  fl_approval_pdf_url: { type: "string", description: "Direct URL to FL Product Approval PDF" },
                  ul_listing_url: { type: "string", description: "URL to UL 2218 listing or impact test report" },
                  installation_guide_url: { type: "string", description: "URL to manufacturer installation guide" },
                  pe_evaluation_url: { type: "string", description: "URL to P.E. evaluation document" },
                  source_website: { type: "string", description: "Primary website domain where found" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                },
                required: ["confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_document_urls" } },
      }),
    });

    if (aiResponse.ok) {
      const aiResult = await aiResponse.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

      if (toolCall?.function?.arguments) {
        const args = JSON.parse(toolCall.function.arguments);
        console.log("AI extracted:", args);

        if (args.confidence === "high" || args.confidence === "medium") {
          return {
            noa_url: args.noa_pdf_url || null,
            fl_url: args.fl_approval_pdf_url || null,
            ul_url: args.ul_listing_url || null,
            installation_guide_url: args.installation_guide_url || null,
            pe_evaluation_url: args.pe_evaluation_url || null,
            source_website: args.source_website || null,
          };
        }
      }
    }

    return {
      noa_url: null,
      fl_url: null,
      ul_url: null,
      installation_guide_url: null,
      pe_evaluation_url: null,
      source_website: null,
    };
  } catch (error) {
    console.error("Search error:", error);
    return {
      noa_url: null,
      fl_url: null,
      ul_url: null,
      installation_guide_url: null,
      pe_evaluation_url: null,
      source_website: null,
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      category,
      limit = 50,
      priorityOrder = ["Underlayment", "Shingle", "Metal Roofing", "Impact Window", "Impact Door"],
      forceRescan = false,
    } = (await req.json()) as BatchRequest;

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl API key not configured. Connect Firecrawl in Settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "Lovable AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Build query based on parameters
    let query = supabase
      .from("product_approvals")
      .select(
        "id, manufacturer, product_name, product_category, noa_number, fl_product_approval, file_url, noa_pdf_url, fl_approval_pdf_url, source_status",
      )
      .eq("is_active", true)
      .or("noa_number.not.is.null,fl_product_approval.not.is.null");

    if (!forceRescan) {
      query = query.or("source_status.is.null,source_status.eq.pending,source_status.eq.not_found");
    }

    if (category) {
      query = query.eq("product_category", category);
    }

    // Order by priority categories
    const { data: products, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      console.error("Error fetching products:", fetchError);
      throw fetchError;
    }

    // Sort by priority order
    const sortedProducts = (products || []).sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.product_category);
      const bIndex = priorityOrder.indexOf(b.product_category);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    console.log(`Processing ${sortedProducts.length} products for batch document sourcing`);

    const results = {
      total: sortedProducts.length,
      sourced: 0,
      failed: 0,
      skipped: 0,
      byCategory: {} as Record<string, { sourced: number; failed: number }>,
    };

    for (const product of sortedProducts) {
      try {
        // Skip if no approval numbers
        if (!product.noa_number && !product.fl_product_approval) {
          results.skipped++;
          continue;
        }

        console.log(`\n--- Processing: ${product.manufacturer} - ${product.product_name} ---`);

        // Mark as searching
        await supabase
          .from("product_approvals")
          .update({ source_status: "searching", last_source_attempt: new Date().toISOString() })
          .eq("id", product.id);

        // Search for all document types
        const foundDocs = await searchForDocuments(
          FIRECRAWL_API_KEY,
          LOVABLE_API_KEY,
          product.manufacturer,
          product.product_name,
          product.noa_number,
          product.fl_product_approval,
          product.product_category,
        );

        const updateData: Record<string, any> = {
          last_source_attempt: new Date().toISOString(),
        };

        let foundAny = false;

        // Download and store each found document
        if (foundDocs.noa_url) {
          const localUrl = await downloadAndStorePdf(supabase, foundDocs.noa_url, product.id, "noa");
          if (localUrl) {
            updateData.noa_pdf_url = localUrl;
            updateData.file_url = localUrl;
            updateData.source_url_noa = foundDocs.noa_url;
            foundAny = true;
          }
        }

        if (foundDocs.fl_url) {
          const localUrl = await downloadAndStorePdf(supabase, foundDocs.fl_url, product.id, "fl_approval");
          if (localUrl) {
            updateData.fl_approval_pdf_url = localUrl;
            updateData.source_url_fl = foundDocs.fl_url;
            if (!updateData.file_url) updateData.file_url = localUrl;
            foundAny = true;
          }
        }

        if (foundDocs.ul_url) {
          const localUrl = await downloadAndStorePdf(supabase, foundDocs.ul_url, product.id, "ul_listing");
          if (localUrl) {
            updateData.ul_listing_url = localUrl;
            foundAny = true;
          }
        }

        if (foundDocs.installation_guide_url) {
          const localUrl = await downloadAndStorePdf(
            supabase,
            foundDocs.installation_guide_url,
            product.id,
            "installation_guide",
          );
          if (localUrl) {
            updateData.installation_guide_url = localUrl;
            foundAny = true;
          }
        }

        if (foundDocs.pe_evaluation_url) {
          const localUrl = await downloadAndStorePdf(
            supabase,
            foundDocs.pe_evaluation_url,
            product.id,
            "pe_evaluation",
          );
          if (localUrl) {
            updateData.pe_evaluation_url = localUrl;
            foundAny = true;
          }
        }

        if (foundAny) {
          updateData.source_status = "found";
          updateData.source_website = foundDocs.source_website;
          results.sourced++;
          console.log(`✅ Found documents for: ${product.product_name}`);
        } else {
          updateData.source_status = "not_found";
          results.failed++;
          console.log(`❌ No documents found for: ${product.product_name}`);
        }

        await supabase.from("product_approvals").update(updateData).eq("id", product.id);

        // Track by category
        if (!results.byCategory[product.product_category]) {
          results.byCategory[product.product_category] = { sourced: 0, failed: 0 };
        }
        if (foundAny) {
          results.byCategory[product.product_category].sourced++;
        } else {
          results.byCategory[product.product_category].failed++;
        }

        // Rate limit
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (productError) {
        console.error(`Error processing ${product.id}:`, productError);
        results.failed++;

        await supabase
          .from("product_approvals")
          .update({ source_status: "error", last_source_attempt: new Date().toISOString() })
          .eq("id", product.id);
      }
    }

    console.log(`\n=== Batch sourcing complete ===`);
    console.log(`Sourced: ${results.sourced}, Failed: ${results.failed}, Skipped: ${results.skipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Found documents for ${results.sourced} of ${results.total} products`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Batch source error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
