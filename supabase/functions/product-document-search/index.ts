import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchRequest {
  projectId: string;
  documentType: string; // underlayment_fpa, underlayment_pe_evaluation, roofing_material_fpa, impact_test_report
  productName?: string;
  manufacturer?: string;
  noaNumber?: string;
  materialType?: string;
}

interface SearchResult {
  id: string;
  title: string;
  manufacturer: string;
  noa_number: string | null;
  fl_number: string | null;
  pdf_url: string;
  source: 'product_approvals' | 'noa_search' | 'fl_search';
  category: string;
  expiration_date: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const params: SearchRequest = await req.json();

    if (!params.projectId || !params.documentType) {
      return new Response(
        JSON.stringify({ success: false, error: 'projectId and documentType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch project details for context
    const { data: project } = await supabase
      .from('permit_projects')
      .select('new_roof_material, underlayment_type, manufacturer, selected_products, jurisdiction_county')
      .eq('id', params.projectId)
      .single();

    if (!project) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: SearchResult[] = [];

    // Determine search strategy based on document type
    const searchTerms = buildSearchTerms(params, project);
    console.log(`Product doc search: type=${params.documentType}, terms=`, searchTerms);

    // 1. Search existing product_approvals table first
    const dbResults = await searchProductApprovals(supabase, searchTerms);
    results.push(...dbResults);

    // 2. If not enough results, use AI to suggest search queries
    if (results.length < 3 && LOVABLE_API_KEY) {
      const aiResults = await aiAssistedSearch(LOVABLE_API_KEY, params, project, searchTerms);
      results.push(...aiResults);
    }

    // Deduplicate by pdf_url
    const seen = new Set<string>();
    const dedupedResults = results.filter(r => {
      if (seen.has(r.pdf_url)) return false;
      seen.add(r.pdf_url);
      return true;
    });

    console.log(`Returning ${dedupedResults.length} results for ${params.documentType}`);

    return new Response(
      JSON.stringify({ success: true, results: dedupedResults.slice(0, 20) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Product document search error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface SearchTerms {
  productName: string;
  manufacturer: string;
  category: string;
  searchQueries: string[];
}

function buildSearchTerms(params: SearchRequest, project: any): SearchTerms {
  const materialType = params.materialType || project.new_roof_material || '';
  const manufacturer = params.manufacturer || project.manufacturer || '';
  const productName = params.productName || '';
  const selectedProducts = (project.selected_products || []) as any[];

  switch (params.documentType) {
    case 'underlayment_fpa':
      return {
        productName: project.underlayment_type || productName || 'synthetic underlayment',
        manufacturer: manufacturer,
        category: 'underlayment',
        searchQueries: [
          `${project.underlayment_type || 'underlayment'} FL product approval`,
          `${manufacturer} underlayment Florida product approval`,
        ],
      };

    case 'underlayment_pe_evaluation':
      return {
        productName: project.underlayment_type || productName || 'underlayment',
        manufacturer: manufacturer,
        category: 'underlayment',
        searchQueries: [
          `${project.underlayment_type || 'underlayment'} PE evaluation report`,
          `${manufacturer} underlayment professional engineer evaluation`,
        ],
      };

    case 'roofing_material_fpa': {
      const roofProduct = selectedProducts.find((p: any) =>
        (p.category || '').toLowerCase().includes('roof') ||
        (p.product_category || '').toLowerCase().includes('roof')
      );
      return {
        productName: roofProduct?.product_name || materialType || productName,
        manufacturer: roofProduct?.manufacturer || manufacturer,
        category: 'roofing',
        searchQueries: [
          `${roofProduct?.product_name || materialType} FL product approval`,
          `${roofProduct?.manufacturer || manufacturer} ${materialType} Florida building product approval`,
        ],
      };
    }

    case 'impact_test_report': {
      const impactProduct = selectedProducts.find((p: any) =>
        (p.category || '').toLowerCase().includes('roof') ||
        (p.product_category || '').toLowerCase().includes('roof')
      );
      return {
        productName: impactProduct?.product_name || materialType || productName,
        manufacturer: impactProduct?.manufacturer || manufacturer,
        category: 'roofing',
        searchQueries: [
          `${impactProduct?.product_name || materialType} UL 2218 impact test report`,
          `${impactProduct?.manufacturer || manufacturer} UL 2218 Class 4 impact resistance`,
        ],
      };
    }

    default:
      return {
        productName: productName || materialType,
        manufacturer,
        category: 'other',
        searchQueries: [`${productName || materialType} ${manufacturer} product approval`],
      };
  }
}

async function searchProductApprovals(supabase: any, terms: SearchTerms): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Search by category + manufacturer
  let query = supabase
    .from('product_approvals')
    .select('id, manufacturer, product_name, noa_number, fl_number, file_url, product_category, expiration_date, noa_pdf_url')
    .eq('is_active', true)
    .not('file_url', 'is', null);

  if (terms.category === 'underlayment') {
    query = query.ilike('product_category', '%underlayment%');
  } else if (terms.category === 'roofing') {
    query = query.or('product_category.ilike.%roofing%,product_category.ilike.%shingle%,product_category.ilike.%metal%');
  }

  if (terms.manufacturer) {
    query = query.ilike('manufacturer', `%${terms.manufacturer}%`);
  }

  const { data: catResults } = await query.limit(10);

  for (const item of (catResults || [])) {
    results.push({
      id: item.id,
      title: item.product_name || 'Unknown Product',
      manufacturer: item.manufacturer || '',
      noa_number: item.noa_number || null,
      fl_number: item.fl_number || null,
      pdf_url: item.file_url || item.noa_pdf_url,
      source: 'product_approvals',
      category: item.product_category || '',
      expiration_date: item.expiration_date || null,
    });
  }

  // Broader search by product name
  if (terms.productName && results.length < 5) {
    const keywords = terms.productName.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
    for (const keyword of keywords) {
      const { data: nameResults } = await supabase
        .from('product_approvals')
        .select('id, manufacturer, product_name, noa_number, fl_number, file_url, product_category, expiration_date, noa_pdf_url')
        .eq('is_active', true)
        .not('file_url', 'is', null)
        .ilike('product_name', `%${keyword}%`)
        .limit(5);

      for (const item of (nameResults || [])) {
        if (!results.find(r => r.id === item.id)) {
          results.push({
            id: item.id,
            title: item.product_name || 'Unknown Product',
            manufacturer: item.manufacturer || '',
            noa_number: item.noa_number || null,
            fl_number: item.fl_number || null,
            pdf_url: item.file_url || item.noa_pdf_url,
            source: 'product_approvals',
            category: item.product_category || '',
            expiration_date: item.expiration_date || null,
          });
        }
      }
    }
  }

  return results;
}

async function aiAssistedSearch(apiKey: string, params: SearchRequest, project: any, terms: SearchTerms): Promise<SearchResult[]> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a Florida building product approval expert. Given a document type needed for a permit packet, suggest specific product approval documents with their likely PDF URLs. Focus on Miami-Dade NOAs and Florida Building product approvals. Use real URL patterns:
- Miami-Dade NOAs: https://www.miamidade.gov/building/library/noa/{noaNumber}.pdf
- FL Product Approvals: https://floridabuilding.org/pr/pr_app_dtl.aspx?param={flNumber}
Only suggest real, commonly-used products in South Florida construction.`,
          },
          {
            role: 'user',
            content: `I need a "${params.documentType}" document for a permit packet.
Product/Material: ${terms.productName}
Manufacturer: ${terms.manufacturer}
Material Type: ${project.new_roof_material || 'not specified'}
County: ${project.jurisdiction_county || 'Miami-Dade'}

Suggest up to 5 product approval documents that could fulfill this requirement. Include NOA numbers and FL numbers where applicable.`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_documents',
              description: 'Suggest product approval documents for a permit packet',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        manufacturer: { type: 'string' },
                        noa_number: { type: 'string' },
                        fl_number: { type: 'string' },
                        pdf_url: { type: 'string' },
                        category: { type: 'string' },
                      },
                      required: ['title', 'manufacturer', 'pdf_url'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['suggestions'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_documents' } },
      }),
    });

    if (!response.ok) {
      console.error('AI search failed:', response.status);
      return [];
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) return [];

    const parsed = JSON.parse(toolCall.function.arguments);
    return (parsed.suggestions || []).map((s: any, i: number) => ({
      id: `ai-${i}-${Date.now()}`,
      title: s.title,
      manufacturer: s.manufacturer || '',
      noa_number: s.noa_number || null,
      fl_number: s.fl_number || null,
      pdf_url: s.pdf_url,
      source: s.noa_number ? 'noa_search' as const : 'fl_search' as const,
      category: s.category || '',
      expiration_date: null,
    }));
  } catch (e) {
    console.error('AI search error:', e);
    return [];
  }
}
