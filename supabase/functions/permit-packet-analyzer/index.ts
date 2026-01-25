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

interface AnalysisResult {
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

    console.log(`[permit-packet-analyzer] Mode: ${mode}, Training ID: ${trainingId || "N/A"}, File: ${fileName || "N/A"}`);

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
          // For PDFs, Gemini can analyze them via URL or we describe context
          // Since we have base64, we'll use the inline_data approach
          messageContent = [
            { type: "text", text: "Analyze this scanned permit document PDF and extract the metadata as specified. Use OCR to read all visible text." },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${fileContent}` },
            },
          ];
        }
      } else if (fileUrl) {
        // Use URL for analysis
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
          // Use verified data from database
          detectionResult.detected.county = dept.county;
          detectionResult.detected.city = dept.city;
          detectionResult.matched_department = {
            id: dept.id,
            name: dept.name,
            portal_url: dept.portal_url,
          };
          // Boost confidence for verified matches
          detectionResult.confidence.county = Math.max(detectionResult.confidence.county, 0.95);
          if (dept.city) {
            detectionResult.confidence.city = Math.max(detectionResult.confidence.city, 0.95);
          }
          console.log(`[permit-packet-analyzer] Matched to department: ${dept.name}`);
        }
      }

      // If we have a trainingId, create/update the training record with detected values
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
    // MODE: ANALYZE_ONLY (Original detailed analysis)
    // ========================================
    if (!trainingId) {
      throw new Error("trainingId is required for analyze_only mode");
    }

    console.log(`[permit-packet-analyzer] Starting detailed analysis for training ID: ${trainingId}`);

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
      .single();

    if (fetchError || !trainingRecord) {
      throw new Error(`Training record not found: ${fetchError?.message}`);
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

    // AI Analysis Prompt
    const systemPrompt = `You are an expert Florida building permit analyst specializing in South Florida jurisdictions (Miami-Dade, Broward, Palm Beach counties and their cities like Boca Raton, Fort Lauderdale, West Palm Beach).

Your task is to analyze permit packet documentation and extract structured information that will be used to train an AI system for automated permit processing.

Focus on:
1. Identifying standard document types (application forms, site plans, NOCs, product approvals, affidavits, etc.)
2. Extracting field patterns and how they should be filled
3. Recognizing jurisdiction-specific requirements
4. Noting HVHZ (High Velocity Hurricane Zone) requirements when applicable
5. Identifying common rejection reasons based on document patterns

Always base your analysis on Florida Building Code standards and municipal requirements.`;

    const userPrompt = `Analyze this completed Florida permit packet:

Context:
${analysisContext}

${fileContent ? `The packet file has been provided as base64 content.` : fileUrl ? `File URL: ${fileUrl}` : "No file content available - analyze based on context only."}

Extract and return a JSON object with the following structure:
{
  "packetStructure": [
    {
      "type": "document type name",
      "description": "what this document contains",
      "pageRange": "e.g., 1-3 or 'single page'",
      "requirements": ["list of requirements this document fulfills"],
      "fields": {"fieldName": "expected value format or example"}
    }
  ],
  "extractedFields": {
    "ownerName": "format pattern",
    "propertyAddress": "format pattern",
    "jobDescription": "typical content",
    // other common permit fields
  },
  "jurisdictionPatterns": [
    "e.g., 'Boca Raton requires sealed engineer drawings for roofs over 500 sqft'",
    "e.g., 'Palm Beach County needs NOC recording before permit closure'"
  ],
  "qualityScore": 0.85, // 0-1 rating of packet completeness
  "keyFeatures": [
    "e.g., 'Includes HVHZ product approvals'",
    "e.g., 'Has notarized owner affidavit'"
  ],
  "exampleDescription": "A one-paragraph summary of what this packet demonstrates",
  "commonDocuments": ["list of document types present"],
  "processingNotes": ["any observations about the packet quality or patterns"]
}

If you cannot analyze the file directly, provide your best inference based on the context provided (county, trade type, etc.) using your knowledge of Florida permit requirements.`;

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

    // Call Lovable AI for analysis
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
        temperature: 0.3,
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

    console.log("[permit-packet-analyzer] AI response received, parsing...");

    // Parse the AI response - try to extract JSON
    let analysisResult: AnalysisResult;
    try {
      // Try to find JSON in the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[permit-packet-analyzer] Failed to parse AI response:", parseError);
      // Create a default structure if parsing fails
      analysisResult = {
        packetStructure: [],
        extractedFields: {},
        jurisdictionPatterns: [],
        qualityScore: 0.5,
        keyFeatures: [],
        exampleDescription: aiContent.substring(0, 500),
        commonDocuments: [],
        processingNotes: ["AI response could not be fully parsed"],
      };
    }

    // Update the training record with extracted data
    const updateData: Record<string, any> = {
      processing_status: "completed",
      processed_at: new Date().toISOString(),
      quality_score: analysisResult.qualityScore,
      example_description: analysisResult.exampleDescription || trainingRecord.example_description,
      extracted_documents: analysisResult.packetStructure,
      key_features: analysisResult.keyFeatures,
    };

    // If we have packet structure, extract common requirements
    if (analysisResult.packetStructure.length > 0) {
      const allRequirements = analysisResult.packetStructure
        .flatMap((doc) => doc.requirements || []);
      updateData.required_documents = [...new Set(allRequirements)];
    }

    await supabase
      .from("permit_packet_training")
      .update(updateData)
      .eq("id", trainingId);

    // Also update/create AI knowledge entries for jurisdiction patterns
    if (analysisResult.jurisdictionPatterns.length > 0) {
      for (const pattern of analysisResult.jurisdictionPatterns) {
        // Check if similar knowledge exists
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
      }
    }

    console.log(`[permit-packet-analyzer] Analysis complete for training ID: ${trainingId}`);

    return new Response(
      JSON.stringify({
        success: true,
        mode: "analyze_only",
        trainingId,
        analysisResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[permit-packet-analyzer] Critical Error:", error);
    
    // ALWAYS update the training record status on failure to prevent orphaned "processing" records
    const requestData = await req.clone().json().catch(() => ({})) as AnalyzeRequest;
    const { trainingId } = requestData;
    
    if (trainingId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.log(`[permit-packet-analyzer] Marking training ID ${trainingId} as failed`);
        
        await supabase
          .from("permit_packet_training")
          .update({ 
            processing_status: "failed",
            admin_notes: `Error: ${errorMessage}`,
            processed_at: new Date().toISOString()
          })
          .eq("id", trainingId);
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
