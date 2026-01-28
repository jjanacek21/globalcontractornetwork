import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// URL patterns to try for Miami-Dade NOAs
const getNoaPatterns = (noa: string) => {
  const cleaned = noa.replace(/\./g, '').replace(/\s/g, '');
  const withDashes = noa.replace(/\./g, '-');
  const noDecimals = noa.replace('.', '');
  
  return [
    `https://www.miamidade.gov/building/library/noa/${cleaned}.pdf`,
    `https://www.miamidade.gov/building/library/noa/${noDecimals}.pdf`,
    `https://www.miamidade.gov/building/library/noa/${withDashes}.pdf`,
    `https://www.miamidade.gov/building/library/noa/${noa}.pdf`,
  ];
};

// Alternative sources for NOA PDFs
const getAlternativeSources = (manufacturer: string, noaNumber: string) => {
  const sources: string[] = [];
  const mfr = manufacturer?.toLowerCase() || '';
  
  // GAF
  if (mfr.includes('gaf')) {
    sources.push(`https://www.gaf.com/en-us/document-library/documents/noa/${noaNumber}.pdf`);
  }
  
  // CertainTeed
  if (mfr.includes('certainteed')) {
    sources.push(`https://www.certainteed.com/resources/noa/${noaNumber}.pdf`);
  }
  
  // Owens Corning
  if (mfr.includes('owens')) {
    sources.push(`https://www.owenscorning.com/roofing/noa/${noaNumber}.pdf`);
  }
  
  return sources;
};

interface DownloadResult {
  productId: string;
  noaNumber: string;
  success: boolean;
  fileUrl?: string;
  error?: string;
  attemptedUrls: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { noaNumbers, productIds, limit = 50, skipExisting = true } = await req.json();

    console.log(`[noa-bulk-downloader] Starting bulk download. Limit: ${limit}, skipExisting: ${skipExisting}`);

    // Get products to process
    let query = supabase
      .from('product_approvals')
      .select('id, noa_number, manufacturer, file_url, source_status')
      .not('noa_number', 'is', null)
      .limit(limit);

    if (skipExisting) {
      query = query.or('file_url.is.null,source_status.eq.pending');
    }

    if (noaNumbers?.length > 0) {
      query = query.in('noa_number', noaNumbers);
    }

    if (productIds?.length > 0) {
      query = query.in('id', productIds);
    }

    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    console.log(`[noa-bulk-downloader] Found ${products?.length || 0} products to process`);

    const results: DownloadResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const product of products || []) {
      const noaNumber = product.noa_number;
      if (!noaNumber) continue;

      const attemptedUrls: string[] = [];
      let downloaded = false;
      let fileUrl: string | undefined;

      // Try Miami-Dade patterns first
      const patterns = getNoaPatterns(noaNumber);
      
      // Add alternative manufacturer sources
      const alternatives = getAlternativeSources(product.manufacturer, noaNumber);
      const allUrls = [...patterns, ...alternatives];

      for (const url of allUrls) {
        attemptedUrls.push(url);
        
        try {
          // First check if URL exists with HEAD request
          const headResponse = await fetch(url, { 
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          
          if (!headResponse.ok) {
            continue;
          }

          // Content-Type check
          const contentType = headResponse.headers.get('content-type');
          if (!contentType?.includes('pdf')) {
            continue;
          }

          // Download the PDF
          console.log(`[noa-bulk-downloader] Downloading ${noaNumber} from ${url}`);
          const pdfResponse = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });

          if (!pdfResponse.ok) {
            continue;
          }

          const pdfBuffer = await pdfResponse.arrayBuffer();
          
          // Store in Supabase Storage
          const storagePath = `noa-pdfs/${noaNumber.replace(/\./g, '-')}.pdf`;
          
          const { error: uploadError } = await supabase.storage
            .from('product-approvals')
            .upload(storagePath, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            console.error(`[noa-bulk-downloader] Upload error for ${noaNumber}:`, uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('product-approvals')
            .getPublicUrl(storagePath);

          fileUrl = urlData.publicUrl;

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
            console.error(`[noa-bulk-downloader] Update error for ${noaNumber}:`, updateError);
          } else {
            downloaded = true;
            successCount++;
            console.log(`[noa-bulk-downloader] Successfully downloaded ${noaNumber}`);
          }

          break;
        } catch (urlError) {
          console.log(`[noa-bulk-downloader] Error trying ${url}:`, urlError);
          continue;
        }
      }

      if (!downloaded) {
        failCount++;
        // Mark as needing manual upload with helpful message
        await supabase
          .from('product_approvals')
          .update({
            source_status: 'needs_manual_upload',
            last_source_attempt: new Date().toISOString(),
            source_notes: `Auto-sourcing failed after trying ${attemptedUrls.length} URL patterns. Please upload PDF manually via NOA Intelligence tab.`,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
      }

      results.push({
        productId: product.id,
        noaNumber,
        success: downloaded,
        fileUrl,
        attemptedUrls,
        error: downloaded ? undefined : 'PDF not found at any known URL pattern'
      });

      // Rate limiting - wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[noa-bulk-downloader] Complete. Success: ${successCount}, Failed: ${failCount}`);

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
    console.error("[noa-bulk-downloader] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
