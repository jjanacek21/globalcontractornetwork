import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FillRequest {
  templateId: string;
  permitProjectId: string;
  formData: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, permitProjectId, formData } = await req.json() as FillRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from("permit_form_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: "Template not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch field mappings for this template
    const { data: mappings, error: mappingsError } = await supabase
      .from("permit_field_mappings")
      .select("*")
      .eq("template_id", templateId);

    if (mappingsError) {
      console.error("Mappings error:", mappingsError);
    }

    // Fetch permit project data if provided
    let projectData: Record<string, any> = { ...formData };
    if (permitProjectId) {
      const { data: project } = await supabase
        .from("permit_projects")
        .select("*")
        .eq("id", permitProjectId)
        .single();

      if (project) {
        projectData = { ...project, ...formData };
      }
    }

    // Fetch contractor form data if available
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: contractorData } = await supabase
          .from("contractor_form_data")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (contractorData) {
          projectData = {
            ...projectData,
            contractor_name: contractorData.company_name,
            contractor_license: contractorData.license_number,
            contractor_phone: contractorData.phone,
            contractor_email: contractorData.email,
            contractor_address: `${contractorData.address}, ${contractorData.city}, ${contractorData.state} ${contractorData.zip}`,
            insurance_company: contractorData.insurance_company,
            insurance_policy: contractorData.insurance_policy_number,
          };
        }
      }
    }

    // Transform data based on field types
    const transformValue = (value: any, transform?: string): string => {
      if (value === null || value === undefined) return '';
      
      switch (transform) {
        case 'uppercase':
          return String(value).toUpperCase();
        case 'lowercase':
          return String(value).toLowerCase();
        case 'currency':
          return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
        case 'date':
          return new Date(value).toLocaleDateString('en-US');
        case 'phone':
          const digits = String(value).replace(/\D/g, '');
          return digits.length === 10 
            ? `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
            : value;
        default:
          return String(value);
      }
    };

    // Build the filled data map
    const filledData: Record<string, string> = {};
    
    // Add auto-generated fields
    filledData['date_today'] = new Date().toLocaleDateString('en-US');
    filledData['date_filled'] = new Date().toISOString();
    
    // Map project data to PDF fields using mappings
    if (mappings && mappings.length > 0) {
      for (const mapping of mappings) {
        const value = projectData[mapping.our_field];
        if (value !== undefined) {
          filledData[mapping.pdf_field] = transformValue(value, mapping.transform_function || undefined);
        } else if (mapping.default_value) {
          filledData[mapping.pdf_field] = mapping.default_value;
        }
      }
    } else {
      // Fallback: direct mapping using common field names
      const directMappings: Record<string, string[]> = {
        'property_address': ['Property Address', 'PROPERTY ADDRESS', 'Address', 'Site Address', 'Job Address'],
        'owner_name': ['Owner Name', 'OWNER NAME', 'Property Owner', 'Applicant Name'],
        'owner_phone': ['Owner Phone', 'Phone', 'Telephone'],
        'owner_email': ['Owner Email', 'Email', 'E-mail'],
        'contractor_name': ['Contractor Name', 'CONTRACTOR NAME', 'Licensed Contractor'],
        'contractor_license': ['License Number', 'LICENSE #', 'Contractor License', 'State License'],
        'contractor_phone': ['Contractor Phone', 'Contractor Telephone'],
        'scope_description': ['Scope of Work', 'SCOPE OF WORK', 'Description of Work', 'Work Description'],
        'valuation': ['Estimated Value', 'VALUATION', 'Project Value', 'Cost'],
        'permit_type': ['Permit Type', 'Type of Permit', 'Work Type'],
      };

      for (const [ourField, pdfFields] of Object.entries(directMappings)) {
        const value = projectData[ourField];
        if (value !== undefined) {
          for (const pdfField of pdfFields) {
            filledData[pdfField] = String(value);
          }
        }
      }
    }

    // Mark signature fields
    const signatureFields: string[] = [];
    if (mappings) {
      for (const mapping of mappings) {
        if (mapping.field_type === 'signature') {
          signatureFields.push(mapping.pdf_field);
        }
      }
    }

    // In a real implementation, we would:
    // 1. Download the PDF template
    // 2. Use pdf-lib to fill the fields
    // 3. Upload the filled PDF to storage
    // 4. Return the URL

    // For now, return the mapping data that would be used
    return new Response(
      JSON.stringify({
        success: true,
        templateId,
        templateName: template.form_name,
        jurisdiction: template.jurisdiction_name,
        filledFields: filledData,
        signatureFieldsNeeded: signatureFields,
        totalFieldsFilled: Object.keys(filledData).length,
        message: `Form data prepared for ${template.form_name}. ${signatureFields.length} signature(s) required.`
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
