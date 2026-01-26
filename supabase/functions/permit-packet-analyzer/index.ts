import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Request types for different modes
interface AnalyzeRequest {
  mode?: "analyze_only" | "detect_and_analyze";
  trainingId?: string;
  fileUrl?: string;
  fileContent?: string; // Base64 encoded file content
  fileName?: string;
  batchId?: string;
}

interface DetectionResult {
  detected: {
    building_department: string | null;
    county: string | null;
    city: string | null;
    trade_type: string | null;
    material_type: string | null;
    is_hvhz: boolean;
  };
  confidence: {
    county: number;
    city: number;
    trade_type: number;
    material_type: number;
    building_department: number;
  };
  detected_from: string[];
  raw_text_sample: string;
  matched_department?: {
    id: string;
    name: string;
    portal_url: string | null;
  };
}

interface ExtractedDocument {
  type: string;
  description: string;
  pageRange?: string;
  requirements?: string[];
  fields?: Record<string, string>;
}

interface ExtractedProductApproval {
  manufacturer: string;
  productName: string;
  noaNumber: string | null;
  flApprovalNumber: string | null;
  ulListing: string | null;
  hvhzApproved: boolean;
  expirationDate: string | null;
  category: string;
  pageFound: number;
}

interface ExtractedFormMapping {
  formName: string;
  formType: string;
  fields: {
    ourFieldName: string;
    pdfFieldName: string;
    sampleValue: string;
    fieldType: string;
    transform: string | null;
    pageNumber: number;
  }[];
}

interface ExtractedJurisdictionRule {
  ruleType: "gotcha" | "requirement" | "exception";
  description: string;
  tradeApplicable: string[];
  documentRequired: string | null;
  source: string;
}

interface TradeSpecificData {
  nailPattern: string | null;
  strapSpacing: string | null;
  meanRoofHeight: string | null;
  roofSlope: string | null;
  deckType: string | null;
  underlaymentProduct: string | null;
  hvhzRequirements: string[];
}

interface EnhancedAnalysisResult {
  productApprovals: ExtractedProductApproval[];
  formFieldMappings: ExtractedFormMapping[];
  jurisdictionRules: ExtractedJurisdictionRule[];
  tradeSpecificData: TradeSpecificData;
  packetStructure: ExtractedDocument[];
  extractedFields: Record<string, string>;
  jurisdictionPatterns: string[];
  qualityScore: number;
  keyFeatures: string[];
  exampleDescription: string;
  commonDocuments: string[];
  processingNotes: string[];
}

// Helper to get file extension
function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts[parts.length - 1] || "";
}

// Helper to determine MIME type
function getMimeType(fileName: string): string {
  const ext = getFileExtension(fileName);
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

serve(async (req) => {
  // Capture trainingId early for error handling
  let capturedTrainingId: string | undefined;
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const requestData = await req.json() as AnalyzeRequest;
    const { mode = "analyze_only", trainingId, fileUrl, fileContent, fileName, batchId } = requestData;

    // Store for error handling
    capturedTrainingId = trainingId;

    console.log(`[permit-packet-analyzer] Mode: ${mode}, Training ID: ${trainingId || "N/A"}, File: ${fileName || "N/A"}, Has Content: ${!!fileContent}`);

    // ========================================
    // MODE: DETECT_AND_ANALYZE (OCR/Vision-based auto-detection)
    // ========================================
    if (mode === "detect_and_analyze") {
      if (!fileContent && !fileUrl) {
        throw new Error("fileContent or fileUrl is required for detect_and_analyze mode");
      }

      console.log("[permit-packet-analyzer] Starting OCR/Vision detection...");

      // Build the vision detection prompt
      const detectionSystemPrompt = `You are an expert at analyzing Florida building permit documents using OCR/vision capabilities.
Your task is to examine scanned permit packets and extract key metadata to categorize them properly.

FOCUS ON EXTRACTING:
1. BUILDING DEPARTMENT: Look for headers, logos, stamps with "CITY OF [NAME]", "[NAME] BUILDING DEPARTMENT", municipal seals
2. COUNTY: Extract from address, headers, form titles (Miami-Dade, Broward, Palm Beach, Monroe, etc.)
3. CITY: Extract from department name, address, or stamps (Boca Raton, Fort Lauderdale, Hollywood, Miami Beach, etc.)
4. TRADE TYPE: Identify from permit type field, description, or scope of work:
   - roofing (re-roof, shingle, tile, roof replacement, roof coating)
   - electrical (panel, wiring, service upgrade, meter)
   - solar (PV, photovoltaic, inverter, solar panel)
   - windows_doors (window replacement, impact windows, doors)
   - mechanical (HVAC, AC, air conditioning, ductwork)
   - plumbing (water heater, repiping, sewer)
   - fencing, pool, structural, general
5. MATERIAL TYPE: Look for product specifications:
   - Roofing: shingle, tile, metal, flat, tpo, epdm, coating, modified_bitumen
   - Windows: impact, non_impact, aluminum, vinyl, wood
   - Other: as applicable
6. HVHZ ZONE: Set to true if:
   - Located in Miami-Dade County
   - Located in eastern/coastal Broward County
   - Document mentions "HVHZ", "High Velocity Hurricane Zone", "Miami-Dade NOA"
   - Product approvals reference FBC HVHZ or TAS testing

Return ONLY valid JSON in this exact format:
{
  "detected": {
    "building_department": "City of Boca Raton Building Department",
    "county": "Palm Beach",
    "city": "Boca Raton",
    "trade_type": "roofing",
    "material_type": "tile",
    "is_hvhz": false
  },
  "confidence": {
    "building_department": 0.95,
    "county": 0.95,
    "city": 0.90,
    "trade_type": 0.85,
    "material_type": 0.80
  },
  "detected_from": ["header: CITY OF BOCA RATON", "form title: RE-ROOFING PERMIT APPLICATION", "address contains: Palm Beach County"],
  "raw_text_sample": "First 300 chars of key extracted text..."
}

IMPORTANT: If you cannot read or detect a field, set it to null and give confidence 0.`;

      // Build message content based on whether we have base64 content or URL
      let messageContent: any[] = [];
      const ext = getFileExtension(fileName || "document.pdf");
      const mimeType = getMimeType(fileName || "document.pdf");

      if (fileContent) {
        // Direct vision analysis with base64 content
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
          messageContent = [
            { type: "text", text: "Analyze this scanned permit document and extract the metadata as specified." },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${fileContent}` },
            },
          ];
        } else if (ext === "pdf") {
          messageContent = [
            { type: "text", text: "Analyze this scanned permit document PDF and extract the metadata as specified. Use OCR to read all visible text." },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${fileContent}` },
            },
          ];
        }
      } else if (fileUrl) {
        messageContent = [
          { type: "text", text: `Analyze the permit document at this URL and extract the metadata as specified: ${fileUrl}` },
        ];
      }

      // Call Gemini Vision for OCR detection
      const detectResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: detectionSystemPrompt },
            { role: "user", content: messageContent },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });

      if (!detectResponse.ok) {
        const errorText = await detectResponse.text();
        console.error("[permit-packet-analyzer] Vision API error:", errorText);
        
        if (detectResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limited. Please try again later.", success: false }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (detectResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required. Please add credits.", success: false }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Vision analysis failed: ${detectResponse.status}`);
      }

      const detectData = await detectResponse.json();
      const detectContent = detectData.choices?.[0]?.message?.content || "";

      console.log("[permit-packet-analyzer] Vision detection response received");

      // Parse detection result
      let detectionResult: DetectionResult;
      try {
        const jsonMatch = detectContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          detectionResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in detection response");
        }
      } catch (parseError) {
        console.error("[permit-packet-analyzer] Failed to parse detection:", parseError);
        detectionResult = {
          detected: {
            building_department: null,
            county: null,
            city: null,
            trade_type: null,
            material_type: null,
            is_hvhz: false,
          },
          confidence: {
            building_department: 0,
            county: 0,
            city: 0,
            trade_type: 0,
            material_type: 0,
          },
          detected_from: ["Detection parsing failed"],
          raw_text_sample: detectContent.substring(0, 300),
        };
      }

      // Validate detected jurisdiction against permit_building_departments
      if (detectionResult.detected.county || detectionResult.detected.city) {
        let query = supabase.from("permit_building_departments").select("id, name, county, city, portal_url");
        
        if (detectionResult.detected.city) {
          query = query.ilike("city", `%${detectionResult.detected.city}%`);
        } else if (detectionResult.detected.county) {
          query = query.ilike("county", `%${detectionResult.detected.county}%`);
        }

        const { data: matchedDepts } = await query.limit(1);
        
        if (matchedDepts && matchedDepts.length > 0) {
          const dept = matchedDepts[0];
          detectionResult.detected.county = dept.county;
          detectionResult.detected.city = dept.city;
          detectionResult.matched_department = {
            id: dept.id,
            name: dept.name,
            portal_url: dept.portal_url,
          };
          detectionResult.confidence.county = Math.max(detectionResult.confidence.county, 0.95);
          if (dept.city) {
            detectionResult.confidence.city = Math.max(detectionResult.confidence.city, 0.95);
          }
          console.log(`[permit-packet-analyzer] Matched to department: ${dept.name}`);
        }
      }

      // If we have a trainingId, update the training record with detected values
      if (trainingId) {
        await supabase
          .from("permit_packet_training")
          .update({
            county: detectionResult.detected.county,
            city: detectionResult.detected.city,
            trade_type: detectionResult.detected.trade_type,
            material_type: detectionResult.detected.material_type,
            is_hvhz: detectionResult.detected.is_hvhz,
            auto_detected: true,
            detection_confidence: detectionResult.confidence,
            detected_from: detectionResult.detected_from,
            processing_status: "detected",
          })
          .eq("id", trainingId);
      }

      // Update batch progress if applicable
      if (batchId) {
        await supabase.rpc("increment_batch_processed", { batch_id: batchId });
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode: "detect_and_analyze",
          detection: detectionResult,
          trainingId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // MODE: ANALYZE_ONLY (Enhanced detailed analysis with knowledge extraction)
    // ========================================
    if (!trainingId) {
      throw new Error("trainingId is required for analyze_only mode");
    }

    console.log(`[permit-packet-analyzer] Starting ENHANCED analysis for training ID: ${trainingId}`);

    // Update status to processing
    await supabase
      .from("permit_packet_training")
      .update({ processing_status: "processing" })
      .eq("id", trainingId);

    // Fetch the training record
    const { data: trainingRecord, error: fetchError } = await supabase
      .from("permit_packet_training")
      .select("*")
      .eq("id", trainingId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Database error fetching training record: ${fetchError.message}`);
    }
    
    if (!trainingRecord) {
      throw new Error(`Training record not found with ID: ${trainingId}`);
    }

    // Build context for AI analysis
    const analysisContext = `
County: ${trainingRecord.county || "Unknown"}
City: ${trainingRecord.city || "Unknown"}
Trade Type: ${trainingRecord.trade_type || "Unknown"}
Material Type: ${trainingRecord.material_type || "Unknown"}
Is HVHZ Zone: ${trainingRecord.is_hvhz ? "Yes" : "No"}
${trainingRecord.example_description ? `Description: ${trainingRecord.example_description}` : ""}
${fileName ? `File Name: ${fileName}` : ""}
    `.trim();

    // ENHANCED AI Analysis Prompt
    const systemPrompt = `You are an expert Florida building permit analyst and data extraction specialist, focusing on South Florida jurisdictions (Miami-Dade, Broward, Palm Beach counties).

Your mission is to analyze permit packet documentation and extract STRUCTURED DATA that will be saved to a database for training an AI permit expediting system.

You MUST extract data in these specific categories:

1. PRODUCT APPROVALS (NOAs, UL Listings, FL Product Approvals):
   For EACH product approval document found, extract:
   - Manufacturer name (e.g., "GAF", "CertainTeed", "Boral")
   - Product name and line (e.g., "Timberline HDZ", "Presidential TL")
   - NOA number (format: NOA-XX-XXXX.XX)
   - FL Product Approval number (format: FL-XXXXX or FL XXXXX-R#)
   - UL Listing number if present (e.g., "UL 2218 Class 4", "UL 2166")
   - HVHZ approval status (true if mentions HVHZ, TAS, or Miami-Dade testing)
   - Expiration date if visible
   - Category: underlayment, shingle, tile, metal, flat_roof, coating, window, door, fastener, other

2. FORM FIELD MAPPINGS (Learn PDF field names for smart-fill):
   For each filled form, identify:
   - Form name/title as printed (e.g., "City of Boca Raton Re-Roofing Application")
   - Form type: permit_application, hvhz_affidavit, noc, owner_affidavit, contractor_affidavit, site_plan, product_approval
   - Field mappings: What OUR internal field name maps to what PDF field name
     Examples:
     - ourFieldName: "owner_name" -> pdfFieldName: "Owner Name" or "PropertyOwner"
     - ourFieldName: "property_address" -> pdfFieldName: "Job Address" or "SiteAddress"
     - ourFieldName: "contractor_license" -> pdfFieldName: "License #" or "ContractorLicenseNumber"
   - Sample value filled in (to understand format)
   - Field type: text, checkbox, date, currency, phone, signature
   - Transform needed: uppercase, date_format, phone_format, currency_format

3. JURISDICTION RULES (City/County-specific requirements):
   Extract rules like:
   - "gotcha": Common rejection reasons or tricky requirements
   - "requirement": Required documents or certifications
   - "exception": Special cases or exemptions
   Include which trades these apply to and any documents required.

4. TRADE-SPECIFIC TECHNICAL DATA (For roofing especially):
   - Nail pattern/schedule (e.g., "6/6 field, 4/4 perimeter")
   - Strap spacing requirements (e.g., "Every 4 rafters")
   - Mean roof height
   - Roof slope/pitch
   - Deck type (Plywood, OSB, etc.)
   - Underlayment product used
   - HVHZ-specific requirements

5. PACKET STRUCTURE:
   List all documents in order with their purpose.

Return ONLY valid JSON in this exact structure. Do NOT include markdown formatting or code blocks.`;

    const userPrompt = `Analyze this completed Florida permit packet and extract ALL structured data:

Context:
${analysisContext}

${fileContent ? "The packet file has been provided as base64 content for vision analysis." : fileUrl ? `File URL: ${fileUrl}` : "No file content available - analyze based on context only."}

Return a JSON object with this EXACT structure (no markdown, just JSON):
{
  "productApprovals": [
    {
      "manufacturer": "GAF",
      "productName": "Timberline HDZ",
      "noaNumber": "NOA-21-0123.01",
      "flApprovalNumber": null,
      "ulListing": "UL 2218 Class 4",
      "hvhzApproved": true,
      "expirationDate": "2026-12-31",
      "category": "shingle",
      "pageFound": 5
    }
  ],
  "formFieldMappings": [
    {
      "formName": "City of Boca Raton Re-Roofing Permit Application",
      "formType": "permit_application",
      "fields": [
        {
          "ourFieldName": "owner_name",
          "pdfFieldName": "Property Owner",
          "sampleValue": "JOHN SMITH",
          "fieldType": "text",
          "transform": "uppercase",
          "pageNumber": 1
        }
      ]
    }
  ],
  "jurisdictionRules": [
    {
      "ruleType": "gotcha",
      "description": "Boca Raton requires product approval documents to be dated within 2 years",
      "tradeApplicable": ["roofing"],
      "documentRequired": null,
      "source": "Form footer note"
    }
  ],
  "tradeSpecificData": {
    "nailPattern": "6 nails per shingle, 4 inch perimeter spacing",
    "strapSpacing": "Every 4 rafters",
    "meanRoofHeight": "18 feet",
    "roofSlope": "5:12",
    "deckType": "Plywood",
    "underlaymentProduct": "GAF FeltBuster",
    "hvhzRequirements": ["Sealed plywood deck", "Hurricane clips at every rafter"]
  },
  "packetStructure": [
    {
      "type": "Permit Application",
      "description": "Main re-roofing permit application form",
      "pageRange": "1-2",
      "requirements": ["Owner signature", "Contractor signature"],
      "fields": {"permitType": "Re-Roof", "scopeOfWork": "Complete tear-off and re-roof"}
    }
  ],
  "extractedFields": {
    "ownerName": "JOHN SMITH",
    "propertyAddress": "123 Main St, Boca Raton, FL 33432",
    "contractorName": "ABC Roofing Inc",
    "contractorLicense": "CCC1234567"
  },
  "jurisdictionPatterns": [
    "Boca Raton requires signed and sealed engineering for roofs over 500 sqft on commercial buildings"
  ],
  "qualityScore": 0.85,
  "keyFeatures": [
    "Complete product approval documentation",
    "HVHZ compliant materials",
    "Notarized owner affidavit"
  ],
  "exampleDescription": "Complete Palm Beach County residential re-roof packet with HVHZ-compliant GAF shingles",
  "commonDocuments": ["Permit Application", "NOA", "Owner Affidavit", "Site Plan"],
  "processingNotes": ["High quality packet suitable for training"]
}

Extract as much data as possible. If you cannot find a particular field, use null. Be thorough!`;

    // Build message content for analysis
    let analysisContent: any[] = [];
    const ext = getFileExtension(fileName || "document.pdf");
    const mimeType = getMimeType(fileName || "document.pdf");

    if (fileContent && ["jpg", "jpeg", "png", "gif", "webp", "pdf"].includes(ext)) {
      analysisContent = [
        { type: "text", text: userPrompt },
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${fileContent}` },
        },
      ];
    } else {
      analysisContent = [{ type: "text", text: userPrompt }];
    }

    // Call Lovable AI for enhanced analysis
    console.log("[permit-packet-analyzer] Calling AI with enhanced extraction prompt...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: analysisContent },
        ],
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[permit-packet-analyzer] AI API error:", errorText);
      
      if (aiResponse.status === 429) {
        await supabase
          .from("permit_packet_training")
          .update({ processing_status: "failed", admin_notes: "Rate limited - try again later" })
          .eq("id", trainingId);
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    console.log("[permit-packet-analyzer] AI response received, parsing enhanced extraction...");

    // Enhanced JSON parsing with multiple fallback strategies
    function extractJSON(content: string): any {
      // Strategy 1: Find JSON between code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1].trim());
        } catch (e) {
          console.log("[permit-packet-analyzer] Code block JSON parse failed:", e);
        }
      }
      
      // Strategy 2: Find outermost JSON object
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.log("[permit-packet-analyzer] Direct JSON parse failed:", e);
        }
      }
      
      // Strategy 3: Try to fix common JSON issues
      let cleaned = content
        .replace(/,\s*\}/g, '}')    // Remove trailing commas in objects
        .replace(/,\s*\]/g, ']')    // Remove trailing commas in arrays
        .replace(/'/g, '"')          // Replace single quotes
        .replace(/\n/g, ' ')         // Remove newlines
        .replace(/\t/g, ' ');        // Remove tabs
        
      const cleanedMatch = cleaned.match(/\{[\s\S]*\}/);
      if (cleanedMatch) {
        try {
          return JSON.parse(cleanedMatch[0]);
        } catch (e) {
          console.log("[permit-packet-analyzer] Cleaned JSON parse failed:", e);
        }
      }
      
      return null;
    }

    // Parse the AI response
    let analysisResult: EnhancedAnalysisResult;
    try {
      const parsed = extractJSON(aiContent);
      if (parsed) {
        analysisResult = parsed;
      } else {
        throw new Error("No JSON found in response after multiple parsing attempts");
      }
    } catch (parseError) {
      console.error("[permit-packet-analyzer] Failed to parse AI response:", parseError);
      console.log("[permit-packet-analyzer] Raw AI content (first 500 chars):", aiContent.substring(0, 500));
      
      // Save fallback data with low quality score to indicate parsing failed
      analysisResult = {
        productApprovals: [],
        formFieldMappings: [],
        jurisdictionRules: [],
        tradeSpecificData: {
          nailPattern: null,
          strapSpacing: null,
          meanRoofHeight: null,
          roofSlope: null,
          deckType: null,
          underlaymentProduct: null,
          hvhzRequirements: [],
        },
        packetStructure: [],
        extractedFields: {},
        jurisdictionPatterns: [],
        qualityScore: 0.3, // Lower score indicates parsing failed
        keyFeatures: ["Parsing failed - manual review needed"],
        exampleDescription: "AI response could not be parsed. Raw: " + aiContent.substring(0, 300),
        commonDocuments: [],
        processingNotes: [
          "AI response parsing failed",
          `Error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`,
          "Consider re-running analysis"
        ],
      };
    }

    // ========================================
    // AUTO-SAVE EXTRACTED DATA TO DATABASE
    // ========================================
    
    let productsExtracted = 0;
    let mappingsLearned = 0;
    let rulesDiscovered = 0;

    // 1. SAVE PRODUCT APPROVALS
    if (analysisResult.productApprovals && analysisResult.productApprovals.length > 0) {
      console.log(`[permit-packet-analyzer] Saving ${analysisResult.productApprovals.length} product approvals...`);
      
      for (const approval of analysisResult.productApprovals) {
        try {
          // Check if product already exists by NOA or FL number
          let existingCheck = null;
          
          if (approval.noaNumber) {
            const { data } = await supabase
              .from("product_approvals")
              .select("id")
              .eq("noa_number", approval.noaNumber)
              .maybeSingle();
            existingCheck = data;
          }
          
          if (!existingCheck && approval.flApprovalNumber) {
            const { data } = await supabase
              .from("product_approvals")
              .select("id")
              .eq("fl_product_approval", approval.flApprovalNumber)
              .maybeSingle();
            existingCheck = data;
          }

          // Guard: Ensure required fields exist before inserting
          if (!existingCheck && 
              (approval.noaNumber || approval.flApprovalNumber) &&
              approval.manufacturer && 
              approval.productName) {
            const { error: insertError } = await supabase.from("product_approvals").insert({
              manufacturer: approval.manufacturer,
              product_name: approval.productName || "Unknown Product",
              product_category: approval.category || "other",
              noa_number: approval.noaNumber,
              fl_product_approval: approval.flApprovalNumber,
              uil_number: approval.ulListing,
              hvhz_approved: approval.hvhzApproved || false,
              expiration_date: approval.expirationDate,
              is_active: true,
              source_status: "training_extracted",
              metadata: { source_training_id: trainingId },
            });

            if (insertError) {
              console.warn(`[permit-packet-analyzer] Failed to insert product approval:`, insertError);
            } else {
              productsExtracted++;
              console.log(`[permit-packet-analyzer] Saved product: ${approval.manufacturer} ${approval.productName}`);
            }
          } else if (existingCheck) {
            console.log(`[permit-packet-analyzer] Product already exists: ${approval.noaNumber || approval.flApprovalNumber}`);
          } else if (!approval.manufacturer || !approval.productName) {
            console.warn(`[permit-packet-analyzer] Skipping product - missing required fields: manufacturer=${approval.manufacturer}, productName=${approval.productName}`);
          }
        } catch (prodError) {
          console.warn(`[permit-packet-analyzer] Error saving product approval:`, prodError);
        }
      }
    }

    // 2. SAVE FORM FIELD MAPPINGS
    if (analysisResult.formFieldMappings && analysisResult.formFieldMappings.length > 0) {
      console.log(`[permit-packet-analyzer] Processing ${analysisResult.formFieldMappings.length} form mappings...`);
      
      for (const form of analysisResult.formFieldMappings) {
        try {
          // Try to find matching template
          const { data: templates } = await supabase
            .from("permit_form_templates")
            .select("id, form_name")
            .ilike("form_name", `%${form.formName.substring(0, 30)}%`)
            .limit(1);

          if (templates && templates.length > 0) {
            const template = templates[0];
            
            for (const field of form.fields) {
              // Check if mapping exists
              const { data: existingMapping } = await supabase
                .from("permit_field_mappings")
                .select("id")
                .eq("template_id", template.id)
                .eq("pdf_field", field.pdfFieldName)
                .maybeSingle();

              if (!existingMapping) {
                const { error: mapError } = await supabase.from("permit_field_mappings").insert({
                  template_id: template.id,
                  our_field: field.ourFieldName,
                  pdf_field: field.pdfFieldName,
                  field_type: field.fieldType,
                  transform_type: field.transform,
                  page_number: field.pageNumber,
                  notes: `Learned from training: ${trainingId}`,
                });

                if (!mapError) {
                  mappingsLearned++;
                }
              }
            }
          }
        } catch (mapError) {
          console.warn(`[permit-packet-analyzer] Error saving form mapping:`, mapError);
        }
      }
    }

    // 3. SAVE JURISDICTION RULES
    if (analysisResult.jurisdictionRules && analysisResult.jurisdictionRules.length > 0) {
      console.log(`[permit-packet-analyzer] Saving ${analysisResult.jurisdictionRules.length} jurisdiction rules...`);
      
      for (const rule of analysisResult.jurisdictionRules) {
        try {
          // Check for existing similar rule
          const { data: existingRule } = await supabase
            .from("building_department_rules")
            .select("id")
            .eq("county", trainingRecord.county || "")
            .ilike("rule_description", `%${rule.description.substring(0, 50)}%`)
            .maybeSingle();

          if (!existingRule) {
            const { error: ruleError } = await supabase.from("building_department_rules").insert({
              county: trainingRecord.county || "",
              city: trainingRecord.city || null,
              rule_type: rule.ruleType,
              permit_types: rule.tradeApplicable,
              rule_description: rule.description,
              document_required: rule.documentRequired,
            });

            if (!ruleError) {
              rulesDiscovered++;
            }
          }
        } catch (ruleErr) {
          console.warn(`[permit-packet-analyzer] Error saving jurisdiction rule:`, ruleErr);
        }
      }
    }

    // 4. SAVE JURISDICTION PATTERNS TO AI KNOWLEDGE
    if (analysisResult.jurisdictionPatterns && analysisResult.jurisdictionPatterns.length > 0) {
      for (const pattern of analysisResult.jurisdictionPatterns) {
        try {
          const { data: existing } = await supabase
            .from("permit_ai_knowledge")
            .select("id")
            .eq("county", trainingRecord.county || "")
            .ilike("knowledge_text", `%${pattern.substring(0, 50)}%`)
            .maybeSingle();

          if (!existing) {
            await supabase.from("permit_ai_knowledge").insert({
              county: trainingRecord.county || "",
              city: trainingRecord.city || null,
              trade_type: trainingRecord.trade_type || null,
              knowledge_type: "requirement",
              knowledge_text: pattern,
              source: "training_packet_analysis",
              confidence_score: analysisResult.qualityScore,
            });
          }
        } catch (patternErr) {
          console.warn(`[permit-packet-analyzer] Error saving pattern:`, patternErr);
        }
      }
    }

    // Update the training record with extracted data
    // NOTE: key_features column doesn't exist - store in packet_structure instead
    const updateData: Record<string, any> = {
      processing_status: "completed",
      processed_at: new Date().toISOString(),
      quality_score: analysisResult.qualityScore,
      example_description: analysisResult.exampleDescription || trainingRecord.example_description,
      extracted_documents: analysisResult.packetStructure,
      packet_structure: {
        documents: analysisResult.packetStructure,
        keyFeatures: analysisResult.keyFeatures, // Store key_features here
        extractedFields: analysisResult.extractedFields,
        jurisdictionPatterns: analysisResult.jurisdictionPatterns,
        commonDocuments: analysisResult.commonDocuments,
        processingNotes: analysisResult.processingNotes,
        productApprovals: analysisResult.productApprovals,
        formFieldMappings: analysisResult.formFieldMappings,
        jurisdictionRules: analysisResult.jurisdictionRules,
        tradeSpecificData: analysisResult.tradeSpecificData,
      },
      products_extracted: productsExtracted,
      mappings_learned: mappingsLearned,
      rules_discovered: rulesDiscovered,
    };

    // Extract common requirements from packet structure
    if (analysisResult.packetStructure && analysisResult.packetStructure.length > 0) {
      const allRequirements = analysisResult.packetStructure
        .flatMap((doc) => doc.requirements || []);
      updateData.required_documents = [...new Set(allRequirements)];
    }

    await supabase
      .from("permit_packet_training")
      .update(updateData)
      .eq("id", trainingId);

    console.log(`[permit-packet-analyzer] Analysis complete for ${trainingId}. Products: ${productsExtracted}, Mappings: ${mappingsLearned}, Rules: ${rulesDiscovered}`);

    return new Response(
      JSON.stringify({
        success: true,
        mode: "analyze_only",
        trainingId,
        stats: {
          productsExtracted,
          mappingsLearned,
          rulesDiscovered,
        },
        analysisResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[permit-packet-analyzer] Critical Error:", error);
    
    // Use captured trainingId for error handling (don't re-read request body)
    if (capturedTrainingId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.log(`[permit-packet-analyzer] Marking training ID ${capturedTrainingId} as failed`);
        
        await supabase
          .from("permit_packet_training")
          .update({ 
            processing_status: "failed",
            admin_notes: `Error: ${errorMessage}`,
            processed_at: new Date().toISOString()
          })
          .eq("id", capturedTrainingId);
      } catch (updateError) {
        console.error("[permit-packet-analyzer] Failed to update training record status:", updateError);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
