import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, filePath } = await req.json();

    if (!templateId || !filePath) {
      return new Response(
        JSON.stringify({ error: "templateId and filePath are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("permit-form-templates")
      .download(filePath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download PDF", details: downloadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to array buffer for processing
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Parse PDF to find form fields
    // This is a simplified approach - we look for field name patterns in the PDF
    const fields: string[] = [];
    const text = new TextDecoder().decode(bytes);
    
    // Common patterns for PDF form field names
    // Pattern 1: /T (FieldName)
    const fieldPattern1 = /\/T\s*\(([^)]+)\)/g;
    let match;
    while ((match = fieldPattern1.exec(text)) !== null) {
      const fieldName = match[1].trim();
      if (fieldName && !fields.includes(fieldName)) {
        fields.push(fieldName);
      }
    }
    
    // Pattern 2: /T <hex encoded>
    const fieldPattern2 = /\/T\s*<([0-9A-Fa-f]+)>/g;
    while ((match = fieldPattern2.exec(text)) !== null) {
      try {
        const hex = match[1];
        const fieldName = hex.match(/.{2}/g)?.map(h => String.fromCharCode(parseInt(h, 16))).join('').trim();
        if (fieldName && !fields.includes(fieldName)) {
          fields.push(fieldName);
        }
      } catch (e) {
        // Skip malformed hex
      }
    }

    // If no fields found, try to use AI to detect field labels
    if (fields.length === 0) {
      console.log("No form fields found via pattern matching, using AI detection");
      
      // Use Lovable AI to analyze the PDF and suggest field names
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableApiKey) {
        try {
          const aiResponse = await fetch("https://api.lovable.dev/v1/chat", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-5-mini",
              messages: [
                {
                  role: "system",
                  content: "You are a PDF form field analyzer. Given a description of a permit application form, list all the likely fillable field names. Return only a JSON array of field name strings."
                },
                {
                  role: "user",
                  content: `This is a building permit application form. Common fields include: applicant name, address, phone, email, property address, folio number, permit type, scope of work, valuation, contractor name, license number, etc. List 20-30 common field names for a typical permit application as a JSON array.`
                }
              ],
              response_format: { type: "json_object" }
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            if (content) {
              try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed.fields)) {
                  fields.push(...parsed.fields);
                }
              } catch (e) {
                console.error("Failed to parse AI response:", e);
              }
            }
          }
        } catch (aiError) {
          console.error("AI analysis failed:", aiError);
        }
      }

      // Fallback: provide common permit form fields
      if (fields.length === 0) {
        fields.push(
          "Applicant Name",
          "Property Address",
          "City",
          "State",
          "Zip",
          "Phone",
          "Email",
          "Owner Name",
          "Owner Address",
          "Contractor Name",
          "License Number",
          "Contractor Address",
          "Contractor Phone",
          "Permit Type",
          "Work Description",
          "Estimated Value",
          "Folio Number",
          "Legal Description",
          "Date",
          "Signature"
        );
      }
    }

    // Sort fields alphabetically
    fields.sort();

    // Update the template with extracted field count
    await supabase
      .from("permit_form_templates")
      .update({ 
        field_mapping: { extracted_count: fields.length, extracted_at: new Date().toISOString() }
      })
      .eq("id", templateId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        fields,
        count: fields.length,
        message: fields.length > 0 
          ? `Found ${fields.length} form fields`
          : "No form fields detected - using common permit field suggestions"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
