import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessRequest {
  bookId: string;
}

// Maximum file size for vision processing (5MB - allows for base64 expansion)
const MAX_VISION_SIZE = 5 * 1024 * 1024;
// Maximum file size we'll attempt at all (15MB)
const MAX_FILE_SIZE = 15 * 1024 * 1024;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let bookId: string | undefined;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.json() as ProcessRequest;
    bookId = requestBody.bookId;

    if (!bookId) {
      return new Response(
        JSON.stringify({ success: false, error: "bookId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-training-book] Processing book: ${bookId}`);

    // Fetch the book record
    const { data: book, error: fetchError } = await supabase
      .from("permit_training_books")
      .select("*")
      .eq("id", bookId)
      .single();

    if (fetchError || !book) {
      console.error("[process-training-book] Book not found:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Book not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabase
      .from("permit_training_books")
      .update({ 
        processing_status: "processing",
        processing_error: null 
      })
      .eq("id", bookId);

    console.log(`[process-training-book] Book: ${book.title}, file: ${book.file_url}`);

    // Generate signed URL to download the file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("permit-training-books")
      .createSignedUrl(book.file_url, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("[process-training-book] Failed to get signed URL:", signedUrlError);
      await supabase
        .from("permit_training_books")
        .update({ 
          processing_status: "failed", 
          processing_error: "Failed to access file in storage. Ensure file exists." 
        })
        .eq("id", bookId);
      
      return new Response(
        JSON.stringify({ success: false, error: "Failed to access file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download the file
    console.log("[process-training-book] Downloading file...");
    const fileResponse = await fetch(signedUrlData.signedUrl);
    if (!fileResponse.ok) {
      console.error("[process-training-book] Failed to download file:", fileResponse.status);
      await supabase
        .from("permit_training_books")
        .update({ 
          processing_status: "failed", 
          processing_error: `Failed to download file: HTTP ${fileResponse.status}` 
        })
        .eq("id", bookId);
      
      return new Response(
        JSON.stringify({ success: false, error: "Failed to download file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileSizeBytes = fileBuffer.byteLength;
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
    
    console.log(`[process-training-book] File downloaded, size: ${fileSizeMB} MB (${fileSizeBytes} bytes)`);

    // Check file size limits
    if (fileSizeBytes > MAX_FILE_SIZE) {
      console.error(`[process-training-book] File too large: ${fileSizeMB} MB`);
      await supabase
        .from("permit_training_books")
        .update({ 
          processing_status: "failed", 
          processing_error: `File too large (${fileSizeMB} MB). Maximum supported size is 15 MB.` 
        })
        .eq("id", bookId);
      
      return new Response(
        JSON.stringify({ success: false, error: "File too large for processing" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Lovable API key
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("[process-training-book] LOVABLE_API_KEY not configured");
      await supabase
        .from("permit_training_books")
        .update({ 
          processing_status: "failed", 
          processing_error: "AI service not configured (missing LOVABLE_API_KEY)" 
        })
        .eq("id", bookId);
      
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine MIME type
    const mimeType = book.file_type === 'pdf' ? 'application/pdf' : 
                     book.file_type === 'txt' ? 'text/plain' : 
                     'application/octet-stream';

    // For large files, we'll process in a simplified way
    const useSimplifiedProcessing = fileSizeBytes > MAX_VISION_SIZE;
    
    console.log(`[process-training-book] Processing mode: ${useSimplifiedProcessing ? 'simplified (large file)' : 'vision'}`);

    // Convert to base64 for AI processing
    const base64Content = base64Encode(fileBuffer);
    console.log(`[process-training-book] Base64 encoded, length: ${base64Content.length} chars`);

    const extractionPrompt = `You are a Florida building permit expert. Analyze this training document and extract structured knowledge items.

Document Title: ${book.title}
Category: ${book.category}
Target County: ${book.target_county || 'All Florida'}

For each distinct piece of knowledge, extract:
1. A clear title (e.g., "Roof Deck Fastening Requirements")
2. The category (one of: fbc_code, permit_requirement, inspection_checkpoint, trade_rule, hvhz_requirement, noa_product, form_instruction, general)
3. The content - a clear, actionable summary
4. Applicable trades (roofing, electrical, plumbing, mechanical, solar, windows_doors, fencing, pool, structural, general)
5. Applicable counties (miami_dade, broward, palm_beach, all_florida)
6. Confidence level (high, medium, low)

Return JSON array:
[
  {
    "title": "...",
    "category": "...",
    "content": "...",
    "applicable_trades": ["..."],
    "applicable_counties": ["..."],
    "confidence_level": "..."
  }
]

Extract 10-30 key knowledge items from this document. Focus on:
- Specific FBC code references
- County-specific requirements  
- Form completion instructions
- Inspection checklists
- HVHZ requirements
- Product approval (NOA) requirements
- Fastener patterns and schedules
- Wind zone requirements

Return ONLY the JSON array, no other text.`;

    console.log("[process-training-book] Sending to AI for analysis...");
    
    // Build the message content
    const messageContent: any[] = [
      { type: "text", text: extractionPrompt }
    ];
    
    // Only add vision content if file is small enough
    if (!useSimplifiedProcessing) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Content}`
        }
      });
    } else {
      // For large files, add a note that we're working with limited context
      messageContent[0].text = extractionPrompt + "\n\n[Note: This is a large document. Extract as much knowledge as possible from the visible content.]";
      messageContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Content.substring(0, 1000000)}` // Send first ~750KB of base64
        }
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[process-training-book] AI request failed:", aiResponse.status, errorText);
      
      let errorMessage = `AI analysis failed: ${aiResponse.status}`;
      if (aiResponse.status === 429) {
        errorMessage = "Rate limited by AI service. Please try again in a few minutes.";
      } else if (aiResponse.status === 413) {
        errorMessage = "Document too large for AI processing. Try a smaller document.";
      } else if (aiResponse.status === 402) {
        errorMessage = "AI credits exhausted. Please add more credits.";
      }
      
      await supabase
        .from("permit_training_books")
        .update({ 
          processing_status: "failed", 
          processing_error: errorMessage
        })
        .eq("id", bookId);
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("[process-training-book] AI response received");

    // Parse the AI response
    const aiText = aiData.choices?.[0]?.message?.content || "";
    console.log("[process-training-book] AI text length:", aiText.length);
    console.log("[process-training-book] AI text preview:", aiText.substring(0, 500));

    let knowledgeItems: any[] = [];
    try {
      // Extract JSON from the response (might have markdown code blocks)
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        knowledgeItems = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("[process-training-book] Failed to parse AI response:", parseError);
      console.error("[process-training-book] Raw AI text:", aiText.substring(0, 1000));
      
      await supabase
        .from("permit_training_books")
        .update({ 
          processing_status: "failed", 
          processing_error: "Failed to parse AI response. The AI may have returned invalid JSON." 
        })
        .eq("id", bookId);
      
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-training-book] Extracted ${knowledgeItems.length} knowledge items`);

    // Insert knowledge items into database
    let insertedCount = 0;
    if (knowledgeItems.length > 0) {
      const knowledgeRecords = knowledgeItems.map(item => ({
        knowledge_type: item.category || 'general',
        pattern_description: `${item.title}: ${item.content || ''}`,
        source: `training_book:${bookId}`,
        trade_type: Array.isArray(item.applicable_trades) ? item.applicable_trades[0] : item.applicable_trades || 'general',
        jurisdiction_county: Array.isArray(item.applicable_counties) 
          ? (item.applicable_counties[0] === 'all_florida' ? null : item.applicable_counties[0])
          : item.applicable_counties || null,
        confidence: item.confidence_level === 'high' ? 0.9 : item.confidence_level === 'medium' ? 0.7 : 0.5,
        is_verified: false,
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from("permit_ai_knowledge")
        .insert(knowledgeRecords)
        .select('id');

      if (insertError) {
        console.error("[process-training-book] Failed to insert knowledge:", insertError);
        // Continue anyway to update status
      } else {
        insertedCount = insertedData?.length || 0;
        console.log(`[process-training-book] Inserted ${insertedCount} knowledge items`);
      }
    }

    // Update book status to completed
    await supabase
      .from("permit_training_books")
      .update({ 
        processing_status: "completed",
        knowledge_items_extracted: insertedCount,
        processed_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", bookId);

    console.log(`[process-training-book] Book ${bookId} processed successfully with ${insertedCount} knowledge items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Extracted ${insertedCount} knowledge items from "${book.title}"`,
        knowledge_count: insertedCount,
        file_size_mb: fileSizeMB,
        processing_mode: useSimplifiedProcessing ? 'simplified' : 'full_vision'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("[process-training-book] Error:", error);
    
    // Try to update the book status if we have the bookId
    if (bookId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from("permit_training_books")
          .update({ 
            processing_status: "failed", 
            processing_error: errMessage
          })
          .eq("id", bookId);
      } catch (updateErr) {
        console.error("[process-training-book] Failed to update error status:", updateErr);
      }
    }
    
    return new Response(
      JSON.stringify({ success: false, error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
