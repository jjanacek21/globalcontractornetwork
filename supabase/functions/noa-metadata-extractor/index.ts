import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NOAMetadata {
  noa_number: string | null;
  manufacturer: string | null;
  product_name: string | null;
  product_category: string | null;
  expiration_date: string | null;
  issue_date: string | null;
  hvhz_approved: boolean;
  wind_speed_rating: number | null;
  design_pressure_positive: number | null;
  design_pressure_negative: number | null;
  impact_rated: boolean;
  approved_uses: string[];
  installation_requirements: string[];
  fastener_patterns: string[];
  deck_types: string[];
  underlayment_requirements: string[];
  confidence_score: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { pdfUrl, productId, pdfBase64 } = await req.json();

    if (!pdfUrl && !pdfBase64) {
      throw new Error("Either pdfUrl or pdfBase64 is required");
    }

    console.log(`[noa-metadata-extractor] Extracting metadata from PDF${productId ? ` for product ${productId}` : ''}`);

    // Use AI to extract metadata from the PDF
    const extractionPrompt = `You are an expert at reading Florida building product NOA (Notice of Acceptance) documents.

Analyze this NOA PDF document and extract the following information in JSON format:

{
  "noa_number": "The NOA number (e.g., 17-0620.02)",
  "manufacturer": "Company name that manufactures the product",
  "product_name": "Full product name/model",
  "product_category": "Category like 'Roofing', 'Underlayment', 'Fasteners', etc.",
  "expiration_date": "Expiration date in YYYY-MM-DD format",
  "issue_date": "Issue date in YYYY-MM-DD format if available",
  "hvhz_approved": true/false - whether approved for High Velocity Hurricane Zone,
  "wind_speed_rating": number - maximum wind speed in mph if specified,
  "design_pressure_positive": number - positive design pressure rating,
  "design_pressure_negative": number - negative design pressure rating,
  "impact_rated": true/false - whether impact rated,
  "approved_uses": ["array of approved installation uses"],
  "installation_requirements": ["key installation requirements"],
  "fastener_patterns": ["fastener patterns like '6 nails per shingle', '12\" o.c.'"],
  "deck_types": ["approved deck types like 'plywood', 'OSB'"],
  "underlayment_requirements": ["required underlayment specs"],
  "confidence_score": 0.0-1.0 - your confidence in the extraction accuracy
}

If a field cannot be determined from the document, use null for strings/numbers, false for booleans, or empty array for arrays.

IMPORTANT: Only return the JSON object, no additional text.`;

    // Build the message content based on what we have
    const messageContent: any[] = [{ type: "text", text: extractionPrompt }];
    
    if (pdfBase64) {
      // Use base64 data directly
      messageContent.push({
        type: "image_url",
        image_url: {
          url: `data:application/pdf;base64,${pdfBase64}`
        }
      });
    } else if (pdfUrl) {
      // Use URL reference
      messageContent.push({
        type: "image_url",
        image_url: { url: pdfUrl }
      });
    }

    const aiPayload = {
      model: "claude-sonnet-4-20250514",
      messages: [
        {
          role: "user",
          content: messageContent
        }
      ],
      max_tokens: 4000
    };

    console.log(`[noa-metadata-extractor] Calling Lovable AI for extraction...`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiPayload),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[noa-metadata-extractor] AI API error:`, errorText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    console.log(`[noa-metadata-extractor] AI response received, parsing...`);

    // Parse the JSON from AI response
    let metadata: NOAMetadata;
    try {
      // Clean up the response - remove markdown code blocks if present
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      
      metadata = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error(`[noa-metadata-extractor] Failed to parse AI response:`, content);
      throw new Error("Failed to parse AI extraction response");
    }

    // If productId provided, update the product record
    if (productId) {
      const updateData: any = {
        ai_extracted_at: new Date().toISOString(),
        extraction_confidence: metadata.confidence_score,
        updated_at: new Date().toISOString()
      };

      // Only update fields if they have values and confidence is high enough
      if (metadata.confidence_score >= 0.7) {
        if (metadata.noa_number) updateData.noa_number = metadata.noa_number;
        if (metadata.manufacturer) updateData.manufacturer = metadata.manufacturer;
        if (metadata.product_name) updateData.product_name = metadata.product_name;
        if (metadata.product_category) updateData.product_category = metadata.product_category;
        if (metadata.expiration_date) updateData.expiration_date = metadata.expiration_date;
        if (metadata.hvhz_approved !== undefined) updateData.hvhz_approved = metadata.hvhz_approved;
        if (metadata.wind_speed_rating) updateData.wind_speed_rating = metadata.wind_speed_rating;
        
        // Store additional data in specifications JSONB
        updateData.specifications = {
          design_pressure_positive: metadata.design_pressure_positive,
          design_pressure_negative: metadata.design_pressure_negative,
          impact_rated: metadata.impact_rated,
          approved_uses: metadata.approved_uses,
          installation_requirements: metadata.installation_requirements,
          fastener_patterns: metadata.fastener_patterns,
          deck_types: metadata.deck_types,
          underlayment_requirements: metadata.underlayment_requirements
        };
      }

      const { error: updateError } = await supabase
        .from('product_approvals')
        .update(updateData)
        .eq('id', productId);

      if (updateError) {
        console.error(`[noa-metadata-extractor] Update error:`, updateError);
      } else {
        console.log(`[noa-metadata-extractor] Updated product ${productId} with extracted metadata`);
      }

      // Also save fastener patterns to the learning table
      if (metadata.fastener_patterns && metadata.fastener_patterns.length > 0) {
        for (const pattern of metadata.fastener_patterns) {
          try {
            await supabase.from('fastener_patterns').upsert({
              product_approval_id: productId,
              pattern_description: pattern,
              noa_number: metadata.noa_number,
              manufacturer: metadata.manufacturer,
              source: 'ai_extraction',
              created_at: new Date().toISOString()
            }, {
              onConflict: 'product_approval_id,pattern_description'
            });
          } catch (e) {
            // Ignore duplicate errors
            console.log('Fastener pattern upsert skipped:', e);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      metadata,
      productId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[noa-metadata-extractor] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
