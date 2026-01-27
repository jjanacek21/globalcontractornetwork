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

// NEW: Fastener pattern extraction interface
interface ExtractedFastenerPattern {
  zoneType: "field" | "perimeter" | "corner" | "hip_ridge" | "eave" | "rake" | "general";
  nailType: string | null;
  nailLength: string | null;
  nailGauge: string | null;
  spacingInches: number | null;
  spacingDescription: string | null;
  nailsPerSquare: number | null;
  fastenerFor: string | null;
  roofMaterial: string | null;
  deckType: string | null;
  sourceDocument: string | null;
  sourcePage: number | null;
}

// NEW: Inspection schedule extraction interface
interface ExtractedInspection {
  seqId: number;
  inspectionType: string;
  inspectionCode: string | null;
  category: "building" | "electrical" | "plumbing" | "mechanical" | "fire" | "structural" | "roofing";
  description: string;
  isRequired: boolean;
  orderInSequence: number;
  prerequisites: string[];
}

interface EnhancedAnalysisResult {
  productApprovals: ExtractedProductApproval[];
  formFieldMappings: ExtractedFormMapping[];
  jurisdictionRules: ExtractedJurisdictionRule[];
  tradeSpecificData: TradeSpecificData;
  fastenerPatterns: ExtractedFastenerPattern[]; // NEW
  inspectionSchedule: ExtractedInspection[]; // NEW
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

    // ENHANCED AI Analysis Prompt with OCR/Handwriting handling
    const systemPrompt = `You are an expert Florida building permit analyst and data extraction specialist, focusing on South Florida jurisdictions (Miami-Dade, Broward, Palm Beach counties).

Your mission is to analyze permit packet documentation and extract STRUCTURED DATA that will be saved to a database for training an AI permit expediting system.

IMPORTANT OCR/SCANNING NOTES:
- Some documents may be handwritten or poorly scanned
- Do your best to read handwritten text - common handwritten fields include signatures, dates, and addresses
- If text is illegible, use null for that field
- For handwritten numeric values (permit numbers, square footage), extract what you can read
- Focus on typed/printed text first, then attempt handwritten sections
- NEVER guess at illegible text - leave as null

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

5. FASTENER PATTERNS (CRITICAL for compliance):
   Extract DETAILED nail/screw schedules from product approvals, installation instructions, or NOAs:
   - Zone type: field, perimeter, corner, hip_ridge, eave, rake
   - Nail type: ring shank, smooth shank, cap nail, roofing nail, coil nail
   - Nail length: "1.25 inch", "2 inch", etc.
   - Nail gauge: "12 gauge", "11 gauge"
   - Spacing: in inches on center (e.g., 6 for "6 inches o.c.")
   - Nails per square (100 sq ft): if mentioned
   - What the fastener is for: underlayment, shingle, metal panel, tile, base sheet
   - Roof material: asphalt shingle, metal, tile, modified bitumen, TPO
   - Deck type: plywood, OSB, concrete

6. INSPECTION SCHEDULE:
   Extract the list of required inspections from the permit card or application:
   - SEQ ID number (e.g., 8, 9, 10)
   - Inspection type: anchor_sheet, fire_barrier, roof_in_progress, final, tie_beam, electrical_rough, etc.
   - Inspection code used by building dept
   - Category: building, electrical, plumbing, mechanical, fire, structural, roofing
   - Description as printed (e.g., "Anchor Sheet (Tin Cap)")
   - Is it required?
   - Order in sequence (which inspection comes first?)
   - Prerequisites (what must pass first?)

7. PACKET STRUCTURE:
   List all documents in order with their purpose.

CRITICAL JSON FORMATTING RULES:
1. Return ONLY the JSON object - NO markdown code blocks, NO explanations before or after
2. Start your response with { and end with }
3. Do NOT wrap in \`\`\`json code blocks
4. Use null (not "null" string) for missing values
5. Ensure all arrays and objects are properly closed
6. No trailing commas after the last item in arrays or objects

PRIORITY ORDER FOR TRUNCATION SAFETY:
If response approaches token limit, prioritize in this order:
1. MOST IMPORTANT: productApprovals array - complete all product entries first
2. fastenerPatterns array - critical for compliance
3. formFieldMappings array
4. inspectionSchedule array
5. jurisdictionRules, tradeSpecificData, packetStructure (least critical)
Ensure each array has valid complete objects before starting the next section.`;

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
  "fastenerPatterns": [
    {
      "zoneType": "field",
      "nailType": "ring shank",
      "nailLength": "1.25 inch",
      "nailGauge": "12 gauge",
      "spacingInches": 6,
      "spacingDescription": "6 inches on center",
      "nailsPerSquare": 320,
      "fastenerFor": "shingle",
      "roofMaterial": "asphalt shingle",
      "deckType": "plywood",
      "sourceDocument": "GAF Installation Instructions",
      "sourcePage": 3
    },
    {
      "zoneType": "perimeter",
      "nailType": "ring shank",
      "nailLength": "1.25 inch",
      "nailGauge": "12 gauge",
      "spacingInches": 4,
      "spacingDescription": "4 inches on center",
      "nailsPerSquare": 480,
      "fastenerFor": "shingle",
      "roofMaterial": "asphalt shingle",
      "deckType": "plywood",
      "sourceDocument": "NOA 21-0123.01",
      "sourcePage": 5
    }
  ],
  "inspectionSchedule": [
    {
      "seqId": 8,
      "inspectionType": "anchor_sheet",
      "inspectionCode": "8",
      "category": "roofing",
      "description": "Anchor Sheet (Tin Cap)",
      "isRequired": true,
      "orderInSequence": 1,
      "prerequisites": []
    },
    {
      "seqId": 9,
      "inspectionType": "fire_barrier",
      "inspectionCode": "9",
      "category": "roofing",
      "description": "Fire Barrier",
      "isRequired": false,
      "orderInSequence": 2,
      "prerequisites": ["anchor_sheet"]
    },
    {
      "seqId": 10,
      "inspectionType": "roof_in_progress",
      "inspectionCode": "10",
      "category": "roofing",
      "description": "Roof In Progress",
      "isRequired": true,
      "orderInSequence": 3,
      "prerequisites": ["anchor_sheet"]
    },
    {
      "seqId": 11,
      "inspectionType": "final",
      "inspectionCode": "11",
      "category": "building",
      "description": "Final Inspection",
      "isRequired": true,
      "orderInSequence": 4,
      "prerequisites": ["roof_in_progress"]
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

    // Helper function to extract array items using bracket-aware parsing
    // This handles truncated JSON by extracting complete objects from partial arrays
    function extractArrayItems(arrayContent: string): any[] {
      const items: any[] = [];
      let depth = 0;
      let currentItem = '';
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < arrayContent.length; i++) {
        const char = arrayContent[i];
        
        if (escapeNext) {
          currentItem += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\' && inString) {
          currentItem += char;
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
        }
        
        if (!inString) {
          if (char === '{') {
            if (depth === 0) {
              currentItem = ''; // Start fresh for new object
            }
            depth++;
          }
          if (char === '}') {
            depth--;
            if (depth === 0) {
              currentItem += char;
              try {
                const parsed = JSON.parse(currentItem.trim());
                items.push(parsed);
              } catch (e) {
                // Skip malformed item
                console.log("[permit-packet-analyzer] Skipped malformed object during bracket-aware extraction");
              }
              currentItem = '';
              continue;
            }
          }
        }
        
        if (depth > 0) {
          currentItem += char;
        }
      }
      
      return items;
    }

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

    // Helper function to call API with retry logic for transient errors
    async function callAPIWithRetry(
      url: string,
      options: RequestInit,
      maxRetries: number = 3
    ): Promise<Response> {
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, options);
          
          // Success or client error (no retry)
          if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
            return response;
          }
          
          // Retry on 503 (Service Unavailable) or 429 (Rate Limit)
          if (response.status === 503 || response.status === 429) {
            const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`[permit-packet-analyzer] API returned ${response.status}, retry ${attempt}/${maxRetries} after ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            lastError = new Error(`API returned ${response.status}`);
            continue;
          }
          
          // Other errors - don't retry
          return response;
        } catch (fetchError) {
          console.error(`[permit-packet-analyzer] Fetch error on attempt ${attempt}:`, fetchError);
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`[permit-packet-analyzer] Retrying after ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      throw lastError || new Error("Max retries exceeded");
    }

    // Call Lovable AI for enhanced analysis with retry logic
    console.log("[permit-packet-analyzer] Calling AI with enhanced extraction prompt...");
    const aiResponse = await callAPIWithRetry(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
          max_tokens: 16000, // Increased to reduce truncation likelihood
        }),
      },
      3 // max retries
    );

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

    console.log("[permit-packet-analyzer] AI response received, length:", aiContent.length);

    // ROBUST JSON extraction with multiple fallback strategies
    function extractJSON(content: string): any {
      console.log("[permit-packet-analyzer] Attempting JSON extraction, content length:", content.length);
      
      // Strategy 1: Remove markdown code blocks wrapper first
      let cleanContent = content.trim();
      
      // Check for various code block formats
      // Handle: ```json\n{...}\n``` or ```{...}``` or ``` json {...}```
      const codeBlockPatterns = [
        /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/,  // Standard markdown
        /```(?:json)?\s*([\s\S]*?)```/,              // Inline code block
        /^`([^`]+)`$/,                                // Single backticks
      ];
      
      for (const pattern of codeBlockPatterns) {
        const match = cleanContent.match(pattern);
        if (match) {
          cleanContent = match[1].trim();
          console.log("[permit-packet-analyzer] Extracted from code block, new length:", cleanContent.length);
          break;
        }
      }
      
      // Strategy 2: Find content between first { and last }
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
        console.log("[permit-packet-analyzer] Extracted JSON object, length:", cleanContent.length);
      }
      
      // Strategy 3: Try direct parse
      try {
        const result = JSON.parse(cleanContent);
        console.log("[permit-packet-analyzer] Direct parse successful");
        return result;
      } catch (e) {
        console.log("[permit-packet-analyzer] Direct parse failed, trying repairs...", e instanceof Error ? e.message : e);
      }
      
      // Strategy 4: Fix common JSON issues
      let repaired = cleanContent
        .replace(/,(\s*[}\]])/g, '$1')     // Remove trailing commas
        .replace(/\r\n/g, ' ')              // Replace CRLF with space
        .replace(/\n/g, ' ')                // Replace newlines with space
        .replace(/\r/g, '')                 // Remove carriage returns
        .replace(/\t/g, ' ')                // Replace tabs with spaces
        .replace(/[\x00-\x1F\x7F]/g, '')    // Remove control characters (except within strings)
        .replace(/\\'/g, "'")               // Fix escaped single quotes
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Add quotes to unquoted keys
      
      try {
        const result = JSON.parse(repaired);
        console.log("[permit-packet-analyzer] Repaired parse successful");
        return result;
      } catch (e) {
        console.log("[permit-packet-analyzer] Repaired parse failed:", e instanceof Error ? e.message : e);
      }

      // Strategy 5: Bracket-aware extraction of productApprovals from truncated response
      const productStartMatch = cleanContent.match(/"productApprovals"\s*:\s*\[/);
      if (productStartMatch && productStartMatch.index !== undefined) {
        console.log("[permit-packet-analyzer] Attempting bracket-aware extraction of productApprovals...");
        const startIndex = productStartMatch.index + productStartMatch[0].length;
        const arrayContent = cleanContent.substring(startIndex);
        const products = extractArrayItems(arrayContent);
        
        if (products.length > 0) {
          console.log(`[permit-packet-analyzer] Recovered ${products.length} products from truncated response`);
          
          // Calculate quality score based on recovery
          // Estimate total products from response length heuristic
          const estimatedTotal = Math.max(products.length, Math.floor(cleanContent.length / 500));
          const recoveryRatio = products.length / estimatedTotal;
          const qualityScore = recoveryRatio >= 0.9 ? 0.8 : recoveryRatio >= 0.5 ? 0.6 : 0.4;
          
          return {
            productApprovals: products,
            formFieldMappings: [],
            jurisdictionRules: [],
            tradeSpecificData: { nailPattern: null, strapSpacing: null, meanRoofHeight: null, roofSlope: null, deckType: null, underlaymentProduct: null, hvhzRequirements: [] },
            fastenerPatterns: [],
            inspectionSchedule: [],
            packetStructure: [],
            extractedFields: {},
            jurisdictionPatterns: [],
            qualityScore: qualityScore,
            keyFeatures: [`Partial extraction - recovered ${products.length} product approvals`],
            exampleDescription: "Partial data extraction due to truncated response",
            commonDocuments: [],
            processingNotes: [`Full JSON parsing failed, recovered ${products.length} productApprovals using bracket-aware extraction`],
          };
        }
      }
      
      // Strategy 6: Try legacy regex extraction as fallback
      const productArrayMatch = cleanContent.match(/"productApprovals"\s*:\s*\[([\s\S]*?)\]/);
      if (productArrayMatch) {
        console.log("[permit-packet-analyzer] Attempting legacy regex partial extraction...");
        try {
          const partialProducts = JSON.parse('[' + productArrayMatch[1] + ']');
          if (partialProducts.length > 0) {
            return {
              productApprovals: partialProducts,
              formFieldMappings: [],
              jurisdictionRules: [],
              tradeSpecificData: { nailPattern: null, strapSpacing: null, meanRoofHeight: null, roofSlope: null, deckType: null, underlaymentProduct: null, hvhzRequirements: [] },
              fastenerPatterns: [],
              inspectionSchedule: [],
              packetStructure: [],
              extractedFields: {},
              jurisdictionPatterns: [],
              qualityScore: 0.5,
              keyFeatures: ["Partial extraction - only product approvals recovered"],
              exampleDescription: "Partial data extraction",
              commonDocuments: [],
              processingNotes: ["Full JSON parsing failed, recovered productApprovals only"],
            };
          }
        } catch (partialError) {
          console.log("[permit-packet-analyzer] Legacy regex extraction also failed");
        }
      }
      
      console.log("[permit-packet-analyzer] All parsing strategies failed");
      console.log("[permit-packet-analyzer] First 200 chars of content:", cleanContent.substring(0, 200));
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
        fastenerPatterns: [],
        inspectionSchedule: [],
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

    // 2. SAVE FORM FIELD MAPPINGS (Now saves even without matching template)
    if (analysisResult.formFieldMappings && analysisResult.formFieldMappings.length > 0) {
      console.log(`[permit-packet-analyzer] Processing ${analysisResult.formFieldMappings.length} form mappings...`);
      
      for (const form of analysisResult.formFieldMappings) {
        try {
          // Try to find matching template (optional now)
          let templateId: string | null = null;
          
          if (form.formName && form.formName.length > 5) {
            const { data: templates } = await supabase
              .from("permit_form_templates")
              .select("id, form_name")
              .ilike("form_name", `%${form.formName.substring(0, 30)}%`)
              .limit(1);

            if (templates && templates.length > 0) {
              templateId = templates[0].id;
              console.log(`[permit-packet-analyzer] Matched form to template: ${templates[0].form_name}`);
            } else {
              console.log(`[permit-packet-analyzer] No template match for form: ${form.formName}, saving with county context`);
            }
          }

          // Process each field mapping
          for (const field of form.fields) {
            if (!field.pdfFieldName || !field.ourFieldName) {
              console.log(`[permit-packet-analyzer] Skipping field with missing names`);
              continue;
            }
            
            // Check if mapping exists (by pdf_field and county, since template_id can be null)
            const { data: existingMapping } = await supabase
              .from("permit_field_mappings")
              .select("id")
              .eq("pdf_field", field.pdfFieldName)
              .eq("our_field", field.ourFieldName)
              .maybeSingle();

            if (!existingMapping) {
              const mappingData: Record<string, any> = {
                template_id: templateId, // Can be null - we'll associate later
                our_field: field.ourFieldName,
                pdf_field: field.pdfFieldName,
                field_type: field.fieldType || "text",
                transform_type: field.transform || null,
                page_number: field.pageNumber || 1,
                notes: `Learned from training: ${trainingId}, Form: ${form.formName}, County: ${trainingRecord.county || "Unknown"}`,
              };
              
              const { error: mapError } = await supabase
                .from("permit_field_mappings")
                .insert(mappingData);

              if (!mapError) {
                mappingsLearned++;
                console.log(`[permit-packet-analyzer] Saved field mapping: ${field.ourFieldName} -> ${field.pdfFieldName}`);
              } else {
                console.warn(`[permit-packet-analyzer] Failed to save mapping:`, mapError.message);
              }
            } else {
              console.log(`[permit-packet-analyzer] Mapping already exists: ${field.pdfFieldName}`);
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

    // 5. SAVE FASTENER PATTERNS (NEW)
    let fastenerPatternsSaved = 0;
    if (analysisResult.fastenerPatterns && analysisResult.fastenerPatterns.length > 0) {
      console.log(`[permit-packet-analyzer] Saving ${analysisResult.fastenerPatterns.length} fastener patterns...`);
      
      for (const pattern of analysisResult.fastenerPatterns) {
        try {
          // Check if similar pattern exists
          const { data: existingPattern } = await supabase
            .from("fastener_patterns")
            .select("id")
            .eq("jurisdiction_county", trainingRecord.county || "")
            .eq("zone_type", pattern.zoneType || "general")
            .eq("roof_material", pattern.roofMaterial || "")
            .maybeSingle();

          if (!existingPattern) {
            const { error: patternError } = await supabase.from("fastener_patterns").insert({
              training_session_id: trainingId,
              jurisdiction_county: trainingRecord.county || "Unknown",
              jurisdiction_city: trainingRecord.city || null,
              is_hvhz: trainingRecord.is_hvhz || false,
              zone_type: pattern.zoneType || "general",
              nail_type: pattern.nailType,
              nail_length: pattern.nailLength,
              nail_gauge: pattern.nailGauge,
              spacing_inches: pattern.spacingInches,
              spacing_description: pattern.spacingDescription,
              nails_per_square: pattern.nailsPerSquare,
              fastener_for: pattern.fastenerFor,
              roof_material: pattern.roofMaterial,
              deck_type: pattern.deckType,
              source_document: pattern.sourceDocument,
              source_page: pattern.sourcePage,
            });

            if (!patternError) {
              fastenerPatternsSaved++;
              console.log(`[permit-packet-analyzer] Saved fastener pattern: ${pattern.zoneType} - ${pattern.roofMaterial}`);
            } else {
              console.warn(`[permit-packet-analyzer] Failed to save fastener pattern:`, patternError.message);
            }
          } else {
            console.log(`[permit-packet-analyzer] Fastener pattern already exists for ${pattern.zoneType}`);
          }
        } catch (fastenerErr) {
          console.warn(`[permit-packet-analyzer] Error saving fastener pattern:`, fastenerErr);
        }
      }
    }

    // 6. SAVE INSPECTION SCHEDULE (NEW)
    let inspectionsSaved = 0;
    if (analysisResult.inspectionSchedule && analysisResult.inspectionSchedule.length > 0) {
      console.log(`[permit-packet-analyzer] Saving ${analysisResult.inspectionSchedule.length} inspections...`);
      
      for (const inspection of analysisResult.inspectionSchedule) {
        try {
          // Check if similar inspection exists for this training session
          const { data: existingInspection } = await supabase
            .from("permit_inspections")
            .select("id")
            .eq("training_session_id", trainingId)
            .eq("seq_id", inspection.seqId)
            .maybeSingle();

          if (!existingInspection) {
            const { error: inspectionError } = await supabase.from("permit_inspections").insert({
              training_session_id: trainingId,
              seq_id: inspection.seqId,
              inspection_type: inspection.inspectionType,
              inspection_code: inspection.inspectionCode,
              category: inspection.category,
              description: inspection.description,
              is_required: inspection.isRequired,
              order_in_sequence: inspection.orderInSequence,
              prerequisites: inspection.prerequisites,
              result: "pending",
            });

            if (!inspectionError) {
              inspectionsSaved++;
              console.log(`[permit-packet-analyzer] Saved inspection: ${inspection.seqId} - ${inspection.description}`);
            } else {
              console.warn(`[permit-packet-analyzer] Failed to save inspection:`, inspectionError.message);
            }
          }
        } catch (inspErr) {
          console.warn(`[permit-packet-analyzer] Error saving inspection:`, inspErr);
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
        fastenerPatterns: analysisResult.fastenerPatterns, // NEW
        inspectionSchedule: analysisResult.inspectionSchedule, // NEW
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

    console.log(`[permit-packet-analyzer] Analysis complete for ${trainingId}. Products: ${productsExtracted}, Mappings: ${mappingsLearned}, Rules: ${rulesDiscovered}, Fasteners: ${fastenerPatternsSaved}, Inspections: ${inspectionsSaved}`);

    return new Response(
      JSON.stringify({
        success: true,
        mode: "analyze_only",
        trainingId,
        stats: {
          productsExtracted,
          mappingsLearned,
          rulesDiscovered,
          fastenerPatternsSaved,
          inspectionsSaved,
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
