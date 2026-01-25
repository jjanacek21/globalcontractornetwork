import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  trainingId: string;
  fileUrl?: string;
  fileContent?: string; // Base64 encoded file content
  fileName?: string;
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
    const { trainingId, fileUrl, fileContent, fileName } = await req.json() as AnalyzeRequest;

    if (!trainingId) {
      throw new Error("trainingId is required");
    }

    console.log(`[permit-packet-analyzer] Starting analysis for training ID: ${trainingId}`);

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
          { role: "user", content: userPrompt },
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
        trainingId,
        analysisResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[permit-packet-analyzer] Error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
