import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SourceRequest {
  productId: string;
}

// Known URL patterns for Florida product approvals
const PDF_URL_PATTERNS = {
  // Miami-Dade NOA pattern: NOA 21-0312.02 → 21-031202.pdf
  miamidade: (noaNumber: string) => {
    if (!noaNumber) return null;
    // Remove "NOA " prefix if present, and remove dots
    const cleaned = noaNumber.replace(/^NOA\s*/i, '').replace(/\./g, '');
    return `https://www.miamidade.gov/building/library/noa/${cleaned}.pdf`;
  },
  // Florida Building Code product approval
  floridabuilding: (flNumber: string) => {
    if (!flNumber) return null;
    // FL# pattern: FL12345 → FL12345.pdf
    return `https://www.floridabuilding.org/upload/PR_Instl_Docs/${flNumber}.pdf`;
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId } = await req.json() as SourceRequest;
    
    if (!productId) {
      throw new Error('productId is required');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('product_approvals')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      throw new Error('Product not found');
    }
    
    // Check if already has a PDF URL
    if (product.file_url || product.noa_pdf_url || product.fl_approval_pdf_url) {
      console.log(`Product ${productId} already has PDF URL`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Product already has PDF',
        fileUrl: product.file_url || product.noa_pdf_url || product.fl_approval_pdf_url,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Attempting to source PDF for: ${product.manufacturer} ${product.product_name}`);
    console.log(`NOA: ${product.noa_number}, FL#: ${product.fl_product_approval}`);
    
    // Try to find and download PDF from known sources
    let pdfUrl: string | null = null;
    let pdfBytes: Uint8Array | null = null;
    let source: string = '';
    
    // Try Miami-Dade NOA first
    if (product.noa_number) {
      const noaUrl = PDF_URL_PATTERNS.miamidade(product.noa_number);
      if (noaUrl) {
        console.log(`Trying Miami-Dade NOA URL: ${noaUrl}`);
        try {
          const response = await fetch(noaUrl, { 
            method: 'GET',
            headers: { 'Accept': 'application/pdf' }
          });
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('pdf') || response.status === 200) {
              pdfBytes = new Uint8Array(await response.arrayBuffer());
              if (pdfBytes.length > 1000) { // Sanity check for valid PDF
                pdfUrl = noaUrl;
                source = 'miamidade_noa';
                console.log(`Successfully fetched PDF from Miami-Dade (${pdfBytes.length} bytes)`);
              }
            }
          }
        } catch (e) {
          console.log(`Miami-Dade fetch failed: ${e}`);
        }
      }
    }
    
    // Try Florida Building Code if no Miami-Dade PDF found
    if (!pdfBytes && product.fl_product_approval) {
      const flUrl = PDF_URL_PATTERNS.floridabuilding(product.fl_product_approval);
      if (flUrl) {
        console.log(`Trying Florida Building URL: ${flUrl}`);
        try {
          const response = await fetch(flUrl, { 
            method: 'GET',
            headers: { 'Accept': 'application/pdf' }
          });
          if (response.ok) {
            pdfBytes = new Uint8Array(await response.arrayBuffer());
            if (pdfBytes.length > 1000) {
              pdfUrl = flUrl;
              source = 'florida_building';
              console.log(`Successfully fetched PDF from Florida Building (${pdfBytes.length} bytes)`);
            }
          }
        } catch (e) {
          console.log(`Florida Building fetch failed: ${e}`);
        }
      }
    }
    
    // If we found a PDF, store it in Supabase Storage
    if (pdfBytes && pdfBytes.length > 1000) {
      const fileName = `${product.id}-${Date.now()}.pdf`;
      const storagePath = `noa-pdfs/${product.manufacturer?.replace(/\s+/g, '-') || 'unknown'}/${fileName}`;
      
      console.log(`Uploading PDF to storage: ${storagePath}`);
      
      const { error: uploadError } = await supabase.storage
        .from('product-approvals')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        // Even if upload fails, we can update the record with the source URL
      } else {
        // Get signed URL for the uploaded file
        const { data: signedData } = await supabase.storage
          .from('product-approvals')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year
        
        if (signedData?.signedUrl) {
          pdfUrl = signedData.signedUrl;
          console.log(`PDF uploaded successfully, signed URL generated`);
        }
      }
      
      // Update product_approvals record
      const updateData: Record<string, any> = {
        source_status: 'found',
        source_updated_at: new Date().toISOString(),
      };
      
      if (source === 'miamidade_noa') {
        updateData.noa_pdf_url = pdfUrl;
        updateData.file_url = pdfUrl;
      } else if (source === 'florida_building') {
        updateData.fl_approval_pdf_url = pdfUrl;
        updateData.file_url = pdfUrl;
      }
      
      const { error: updateError } = await supabase
        .from('product_approvals')
        .update(updateData)
        .eq('id', productId);
      
      if (updateError) {
        console.error('Error updating product:', updateError);
      } else {
        console.log(`Product ${productId} updated with PDF URL`);
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'PDF sourced successfully',
        fileUrl: pdfUrl,
        source,
        fileSize: pdfBytes.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // No PDF found - update status
    await supabase
      .from('product_approvals')
      .update({ 
        source_status: 'not_found',
        source_updated_at: new Date().toISOString(),
      })
      .eq('id', productId);
    
    console.log(`No PDF found for product ${productId}`);
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'No PDF found at known sources',
      triedSources: [
        product.noa_number ? 'Miami-Dade NOA' : null,
        product.fl_product_approval ? 'Florida Building' : null,
      ].filter(Boolean),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Source product PDF error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to source PDF';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
