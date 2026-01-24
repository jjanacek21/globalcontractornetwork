import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductApproval {
  id: string;
  manufacturer: string;
  product_name: string;
  product_category: string;
  noa_number: string | null;
  fl_product_approval: string | null;
  file_url: string | null;
  noa_pdf_url: string | null;
  fl_approval_pdf_url: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting AI document sourcing...');

    // Fetch all products that need document URLs
    const { data: products, error: fetchError } = await supabase
      .from('product_approvals')
      .select('id, manufacturer, product_name, product_category, noa_number, fl_product_approval, file_url, noa_pdf_url, fl_approval_pdf_url')
      .eq('is_active', true)
      .is('file_url', null);

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${products?.length || 0} products without file URLs`);

    let updated = 0;
    let failed = 0;
    const total = products?.length || 0;

    // Process products in batches
    for (const product of products || []) {
      try {
        let fileUrl = null;
        let noaPdfUrl = null;
        let flApprovalPdfUrl = null;

        // Generate Florida Building Product Approval URL if we have the approval number
        if (product.fl_product_approval) {
          const flApprovalUrl = `https://www.floridabuilding.org/pr/pr_app_dtl.aspx?param=${encodeURIComponent(product.fl_product_approval)}`;
          flApprovalPdfUrl = flApprovalUrl;
          
          // Use FL approval as primary file_url if no other URL exists
          if (!fileUrl) {
            fileUrl = flApprovalUrl;
          }
          
          console.log(`Generated FL Approval URL for ${product.product_name}: ${flApprovalUrl}`);
        }

        // Generate Miami-Dade NOA lookup URL if we have NOA number
        if (product.noa_number) {
          // Miami-Dade NOA database search pattern
          // Format: NOA XX-XXXX.XX
          const cleanNoaNumber = product.noa_number.replace(/\s+/g, '');
          
          // Miami-Dade Product Control Search URL
          const noaSearchUrl = `https://www.miamidade.gov/permits/product-control-search.asp?noa=${encodeURIComponent(cleanNoaNumber)}`;
          
          noaPdfUrl = noaSearchUrl;
          
          // Use NOA URL as primary if no FL approval URL
          if (!fileUrl) {
            fileUrl = noaSearchUrl;
          }
          
          console.log(`Generated NOA URL for ${product.product_name}: ${noaSearchUrl}`);
        }

        // Update the product if we found any URLs
        if (fileUrl || noaPdfUrl || flApprovalPdfUrl) {
          const updateData: Record<string, any> = {};
          
          if (fileUrl) updateData.file_url = fileUrl;
          if (noaPdfUrl) updateData.noa_pdf_url = noaPdfUrl;
          if (flApprovalPdfUrl) updateData.fl_approval_pdf_url = flApprovalPdfUrl;

          const { error: updateError } = await supabase
            .from('product_approvals')
            .update(updateData)
            .eq('id', product.id);

          if (updateError) {
            console.error(`Failed to update product ${product.id}:`, updateError);
            failed++;
          } else {
            updated++;
            console.log(`Updated product ${product.product_name} with document URLs`);
          }
        } else {
          console.log(`No approval numbers found for ${product.product_name} - skipping`);
        }
      } catch (err) {
        console.error(`Error processing product ${product.id}:`, err);
        failed++;
      }
    }

    console.log(`AI Document Sourcing Complete: Updated ${updated}, Failed ${failed}, Total ${total}`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        failed,
        total,
        message: `Successfully sourced documents for ${updated} products`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during document sourcing';
    console.error('Error in source-product-approvals:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
