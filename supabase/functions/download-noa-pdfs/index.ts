import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DownloadResult {
  productId: string;
  noaNumber: string;
  success: boolean;
  fileUrl?: string;
  error?: string;
  originalUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { limit = 50, productIds } = await req.json();

    console.log(`[download-noa-pdfs] Starting download. Limit: ${limit}`);

    // Build query - find records with external Miami-Dade URLs (not yet cached internally)
    // External URLs contain 'miamidade.gov', internal storage URLs contain 'supabase'
    let query = supabase
      .from('product_approvals')
      .select('id, noa_number, manufacturer, file_url')
      .ilike('file_url', '%miamidade.gov%')
      .limit(limit);

    if (productIds?.length > 0) {
      query = query.in('id', productIds);
    }

    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    console.log(`[download-noa-pdfs] Found ${products?.length || 0} products with external Miami-Dade URLs to cache`);

    const results: DownloadResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const product of products || []) {
      // Use file_url which contains the external Miami-Dade URL
      const pdfUrl = product.file_url;
      const noaNumber = product.noa_number || 'unknown';

      if (!pdfUrl || !pdfUrl.includes('miamidade.gov')) continue;

      try {
        console.log(`[download-noa-pdfs] Downloading ${noaNumber} from ${pdfUrl}`);

        // Download the PDF
        const pdfResponse = await fetch(pdfUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/pdf,*/*'
          }
        });

        if (!pdfResponse.ok) {
          console.log(`[download-noa-pdfs] Failed to fetch ${noaNumber}: ${pdfResponse.status}`);
          results.push({
            productId: product.id,
            noaNumber,
            success: false,
            error: `HTTP ${pdfResponse.status}`,
            originalUrl: pdfUrl
          });
          failCount++;
          continue;
        }

        // Check content type
        const contentType = pdfResponse.headers.get('content-type');
        if (!contentType?.includes('pdf') && !contentType?.includes('octet-stream')) {
          console.log(`[download-noa-pdfs] Not a PDF for ${noaNumber}: ${contentType}`);
          results.push({
            productId: product.id,
            noaNumber,
            success: false,
            error: `Not a PDF: ${contentType}`,
            originalUrl: pdfUrl
          });
          failCount++;
          continue;
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        
        // Validate PDF size
        if (pdfBuffer.byteLength < 1000) {
          console.log(`[download-noa-pdfs] PDF too small for ${noaNumber}: ${pdfBuffer.byteLength} bytes`);
          results.push({
            productId: product.id,
            noaNumber,
            success: false,
            error: 'PDF file too small (possibly invalid)',
            originalUrl: pdfUrl
          });
          failCount++;
          continue;
        }

        // Generate storage path
        const cleanNoaNumber = noaNumber.replace(/\./g, '-').replace(/\s/g, '_');
        const manufacturer = (product.manufacturer || 'unknown').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
        const storagePath = `noa-pdfs/${manufacturer}/${cleanNoaNumber}.pdf`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('product-approvals')
          .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error(`[download-noa-pdfs] Upload error for ${noaNumber}:`, uploadError);
          results.push({
            productId: product.id,
            noaNumber,
            success: false,
            error: `Upload failed: ${uploadError.message}`,
            originalUrl: pdfUrl
          });
          failCount++;
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-approvals')
          .getPublicUrl(storagePath);

        const fileUrl = urlData.publicUrl;

        // Update product record
        const { error: updateError } = await supabase
          .from('product_approvals')
          .update({
            file_url: fileUrl,
            noa_pdf_url: fileUrl,
            source_status: 'found',
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`[download-noa-pdfs] Update error for ${noaNumber}:`, updateError);
          results.push({
            productId: product.id,
            noaNumber,
            success: false,
            error: `DB update failed: ${updateError.message}`,
            originalUrl: pdfUrl
          });
          failCount++;
          continue;
        }

        console.log(`[download-noa-pdfs] Successfully downloaded and stored ${noaNumber}`);
        results.push({
          productId: product.id,
          noaNumber,
          success: true,
          fileUrl,
          originalUrl: pdfUrl
        });
        successCount++;

      } catch (error) {
        console.error(`[download-noa-pdfs] Error processing ${noaNumber}:`, error);
        results.push({
          productId: product.id,
          noaNumber,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalUrl: pdfUrl
        });
        failCount++;
      }

      // Rate limiting - wait 300ms between requests to be nice to Miami-Dade servers
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`[download-noa-pdfs] Complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      downloaded: successCount,
      failed: failCount,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[download-noa-pdfs] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
