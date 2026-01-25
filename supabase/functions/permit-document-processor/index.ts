import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessRequest {
  documentPath: string;
  documentType: string;
  permitProjectId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ProcessRequest = await req.json();
    const { documentPath, documentType, permitProjectId } = request;

    console.log('Processing document:', { documentPath, documentType, permitProjectId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update document status to processing
    await supabase
      .from('permit_project_documents')
      .update({ processing_status: 'processing' })
      .eq('project_id', permitProjectId)
      .eq('file_path', documentPath);

    // Download the document from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('permit-documents')
      .download(documentPath);

    if (downloadError) {
      throw new Error(`Failed to download document: ${downloadError.message}`);
    }

    // Determine document type and expected fields
    const expectedFields = getExpectedFieldsForDocType(documentType);
    
    // Extract data using AI
    const extractedData = await extractDataFromDocument(
      fileData,
      documentType,
      expectedFields
    );

    console.log('Extracted data:', extractedData);

    // Update document record with extracted data
    const { error: updateError } = await supabase
      .from('permit_project_documents')
      .update({
        processing_status: 'complete',
        extracted_data: extractedData,
        fields_populated: Object.keys(extractedData),
      })
      .eq('project_id', permitProjectId)
      .eq('file_path', documentPath);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    // If we extracted useful data, update the permit project form_data
    if (Object.keys(extractedData).length > 0) {
      const { data: permit } = await supabase
        .from('permit_projects')
        .select('form_data')
        .eq('id', permitProjectId)
        .single();

      const currentFormData = (permit?.form_data as Record<string, unknown>) || {};
      const updatedFormData = { ...currentFormData };

      // Only update fields that are currently empty
      for (const [key, value] of Object.entries(extractedData)) {
        if (!currentFormData[key] && value) {
          updatedFormData[key] = value;
        }
      }

      await supabase
        .from('permit_projects')
        .update({ form_data: updatedFormData })
        .eq('id', permitProjectId);
    }

    return new Response(JSON.stringify({
      success: true,
      extractedFields: Object.keys(extractedData),
      data: extractedData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Document processing error:', error);
    
    // Update document status to failed
    try {
      const request: ProcessRequest = await req.clone().json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('permit_project_documents')
        .update({ processing_status: 'failed' })
        .eq('project_id', request.permitProjectId)
        .eq('file_path', request.documentPath);
    } catch (e) {
      console.error('Failed to update document status:', e);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getExpectedFieldsForDocType(documentType: string): string[] {
  const fieldMappings: Record<string, string[]> = {
    'contractor_license': [
      'contractor_name',
      'contractor_license_number',
      'license_expiration',
      'license_type',
      'qualifier_name',
    ],
    'certificate_of_insurance': [
      'insurance_company',
      'policy_number',
      'coverage_amount',
      'expiration_date',
      'insured_name',
    ],
    'signed_contract': [
      'contract_amount',
      'contract_date',
      'scope_of_work',
      'owner_name',
      'contractor_name',
    ],
    'notice_of_commencement': [
      'property_address',
      'owner_name',
      'contractor_name',
      'project_description',
      'bond_amount',
    ],
    'property_survey': [
      'lot_number',
      'block_number',
      'subdivision',
      'lot_size',
      'legal_description',
    ],
    'proof_of_ownership': [
      'owner_name',
      'property_address',
      'parcel_id',
    ],
    'site_plan': [
      'building_footprint_sqft',
      'lot_coverage',
      'setbacks',
    ],
    'roof_drawing': [
      'roof_sqft',
      'roof_pitch',
      'number_of_squares',
    ],
    'product_approval': [
      'manufacturer',
      'product_name',
      'noa_number',
      'fl_approval_number',
      'wind_rating',
    ],
    'energy_calculation': [
      'hvac_size',
      'duct_size',
      'insulation_r_value',
    ],
  };

  return fieldMappings[documentType] || [
    'document_date',
    'document_title',
    'key_information',
  ];
}

async function extractDataFromDocument(
  fileData: Blob,
  documentType: string,
  expectedFields: string[]
): Promise<Record<string, string>> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    console.log('No LOVABLE_API_KEY, skipping AI extraction');
    return {};
  }

  try {
    // Convert file to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileData.type || 'application/pdf';

    const prompt = `You are extracting data from a ${documentType.replace(/_/g, ' ')} document for a Florida building permit application.

Expected fields to extract:
${expectedFields.map(f => `- ${f}`).join('\n')}

Analyze the document and extract any matching information. For each field found, provide the exact value from the document.

IMPORTANT:
- Only extract data that is clearly visible in the document
- Format dates as MM/DD/YYYY
- Format phone numbers as (XXX) XXX-XXXX
- Format currency as numbers without symbols
- If a field is not found, do not include it

Respond with a JSON object mapping field names to their extracted values. Only include fields that were found.
Respond ONLY with the JSON object, no other text.`;

    const response = await fetch('https://api.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return {};
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI extraction response:', content);

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {};

  } catch (error) {
    console.error('AI extraction error:', error);
    return {};
  }
}
