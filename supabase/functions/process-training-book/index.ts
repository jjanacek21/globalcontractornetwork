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

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookId } = await req.json() as ProcessRequest;

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
      .update({ processing_status: "processing" })
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
          processing_error: "Failed to access file in storage" 
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
          processing_error: "Failed to download file" 
        })
        .eq("id", bookId);
      
      return new Response(
        JSON.stringify({ success: false, error: "Failed to download file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to base64 for AI processing using Deno's built-in encoder
    const fileBuffer = await fileResponse.arrayBuffer();
    const base64Content = base64Encode(fileBuffer);
    
    console.log(`[process-training-book] File downloaded, size: ${fileBuffer.byteLength} bytes`);

    // Use Lovable AI to extract knowledge from the document
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("[process-training-book] LOVABLE_API_KEY not configured");
      await supabase
        .from("permit_training_books")
        .update({ 
          processing_status: "failed", 
          processing_error: "AI service not configured" 
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

    console.log("[process-training-book] Sending to AI for analysis...");
    
    const extractionPrompt = `You are a Florida building permit expert. Analyze this training document and extract structured knowledge items.

Document Title: ${book.title}
Category: ${book.category}
Target County: ${book.target_county}

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

Return ONLY the JSON array, no other text.`;

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
            content: [
              {
                type: "text",
                text: extractionPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Content}`
                }
              }
            ]
          }
        ],
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[process-training-book] AI request failed:", aiResponse.status, errorText);
      await supabase
        .from("permit_training_books")
        .update({ 
          processing_status: "failed", 
          processing_error: `AI analysis failed: ${aiResponse.status}` 
        })
        .eq("id", bookId);
      
      return new Response(
        JSON.stringify({ success: false, error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("[process-training-book] AI response received");

    // Parse the AI response
    const aiText = aiData.choices?.[0]?.message?.content || "";
    console.log("[process-training-book] AI text:", aiText.substring(0, 500));

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
      await supabase
        .from("permit_training_books")
        .update({ 
          processing_status: "failed", 
          processing_error: "Failed to parse AI response" 
        })
        .eq("id", bookId);
      
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-training-book] Extracted ${knowledgeItems.length} knowledge items`);

    // Insert knowledge items into database
    if (knowledgeItems.length > 0) {
      const knowledgeRecords = knowledgeItems.map(item => ({
        category: item.category || 'general',
        title: item.title || 'Untitled',
        content: item.content || '',
        source_type: 'training_book',
        source_id: bookId,
        applicable_trades: item.applicable_trades || [],
        applicable_counties: item.applicable_counties || [],
        confidence_level: item.confidence_level || 'medium',
      }));

      const { error: insertError } = await supabase
        .from("permit_ai_knowledge")
        .insert(knowledgeRecords);

      if (insertError) {
        console.error("[process-training-book] Failed to insert knowledge:", insertError);
        // Continue anyway to update status
      }
    }

    // Update book status to completed
    await supabase
      .from("permit_training_books")
      .update({ 
        processing_status: "completed",
        knowledge_items_extracted: knowledgeItems.length,
        processed_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", bookId);

    console.log(`[process-training-book] Book ${bookId} processed successfully with ${knowledgeItems.length} knowledge items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Extracted ${knowledgeItems.length} knowledge items`,
        knowledge_count: knowledgeItems.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("[process-training-book] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});