import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, PDFTextField, PDFCheckBox, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FillRequest {
  templateId: string;
  permitProjectId?: string;
  formData?: Record<string, any>;
  mode?: 'fill' | 'blank_for_signature' | 'mark_signature_fields';
}

interface FieldMapping {
  our_field: string;
  pdf_field: string;
  transform_type?: string;
  section?: string;
  conditional_logic?: any;
}

// Transform functions for different field types
function transformValue(value: any, transformType?: string): string {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  switch (transformType) {
    case 'uppercase':
      return stringValue.toUpperCase();
    
    case 'lowercase':
      return stringValue.toLowerCase();
    
    case 'currency':
      const num = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return stringValue;
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    case 'currency_no_symbol':
      const numVal = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
      if (isNaN(numVal)) return stringValue;
      return numVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    case 'date':
      try {
        const date = new Date(stringValue);
        if (isNaN(date.getTime())) return stringValue;
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      } catch {
        return stringValue;
      }
    
    case 'date_long':
      try {
        const date = new Date(stringValue);
        if (isNaN(date.getTime())) return stringValue;
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      } catch {
        return stringValue;
      }
    
    case 'phone':
      const digits = stringValue.replace(/\D/g, '');
      if (digits.length === 10) {
        return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
      } else if (digits.length === 11 && digits[0] === '1') {
        return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
      }
      return stringValue;
    
    case 'zip':
      const zipDigits = stringValue.replace(/\D/g, '');
      if (zipDigits.length === 9) {
        return `${zipDigits.slice(0,5)}-${zipDigits.slice(5)}`;
      }
      return zipDigits.slice(0, 5);
    
    case 'checkbox':
      return ['true', '1', 'yes', 'on', 'checked'].includes(stringValue.toLowerCase()) ? 'Yes' : 'No';
    
    case 'squarefeet':
      const sqft = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
      if (isNaN(sqft)) return stringValue;
      return `${sqft.toLocaleString()} sq ft`;
    
    case 'roofing_squares':
      const sqftVal = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
      if (isNaN(sqftVal)) return stringValue;
      const squares = sqftVal / 100;
      return squares.toFixed(2);
    
    default:
      return stringValue;
  }
}

// Section 1524 checkbox evaluation logic
const SECTION_1524_CHECKBOXES: Record<string, {
  field: string;
  operator: string;
  value: any;
  description: string;
}> = {
  'aesthetics_reserved': { field: '_always', operator: 'always_true', value: null, description: 'Always checked' },
  'renailing_wood_decks': { field: 'year_built', operator: 'less_than', value: 1994, description: 'Pre-1994 homes require deck renailing' },
  'common_roofs_reserved': { field: 'building_type', operator: 'equals', value: 'multi_family', description: 'Multi-family buildings' },
  'exposed_ceilings': { field: 'has_exposed_ceilings', operator: 'equals', value: true, description: 'Has exposed ceilings' },
  'ponding_water_reserved': { field: 'has_ponding_water', operator: 'equals', value: true, description: 'Flat roof with ponding concerns' },
  'overflow_scuppers': { field: 'requires_overflow_scuppers', operator: 'equals', value: true, description: 'Flat roof requires overflow scuppers' },
  'deck_attachment': { field: 'deck_attachment_confirmed', operator: 'equals', value: true, description: 'Deck attachment confirmed' },
  'hvhz_zone': { field: 'is_hvhz', operator: 'equals', value: true, description: 'High Velocity Hurricane Zone' },
};

// Auto-evaluate Section 1524 checkboxes based on project data
function evaluateSection1524Checkboxes(data: Record<string, any>): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  
  for (const [checkboxId, config] of Object.entries(SECTION_1524_CHECKBOXES)) {
    if (config.operator === 'always_true') {
      results[checkboxId] = true;
    } else {
      results[checkboxId] = evaluateCondition(config, data);
    }
  }
  
  // Additional compound logic
  // Ponding water only applies to flat roofs
  if (data.roof_slope !== 'flat' && data.pitch !== 'flat') {
    results['ponding_water_reserved'] = false;
    results['overflow_scuppers'] = false;
  }
  
  // Check for pre-1994 (year_built can be a number or string)
  const yearBuilt = parseInt(String(data.year_built), 10);
  if (!isNaN(yearBuilt) && yearBuilt < 1994) {
    results['renailing_wood_decks'] = true;
  }
  
  return results;
}

// Evaluate conditional logic for fields
function evaluateCondition(condition: any, data: Record<string, any>): boolean {
  if (!condition) return true;
  
  const { field, operator, value } = condition;
  const fieldValue = data[field];
  
  switch (operator) {
    case 'always_true':
      return true;
    case 'equals':
      return fieldValue === value;
    case 'not_equals':
      return fieldValue !== value;
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    case 'greater_than_or_equals':
      return Number(fieldValue) >= Number(value);
    case 'less_than_or_equals':
      return Number(fieldValue) <= Number(value);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case 'is_empty':
      return !fieldValue;
    case 'is_not_empty':
      return !!fieldValue;
    case 'is_true':
      return fieldValue === true || fieldValue === 'true' || fieldValue === '1';
    case 'is_false':
      return fieldValue === false || fieldValue === 'false' || fieldValue === '0' || !fieldValue;
    case 'before_year':
      try {
        const year = new Date(fieldValue).getFullYear();
        return year < Number(value);
      } catch {
        return false;
      }
    case 'after_year':
      try {
        const year = new Date(fieldValue).getFullYear();
        return year >= Number(value);
      } catch {
        return false;
      }
    case 'in_list':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'not_in_list':
      return Array.isArray(value) && !value.includes(fieldValue);
    default:
      return true;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, permitProjectId, formData = {}, mode = 'fill' } = await req.json() as FillRequest;
    
    if (!templateId) {
      throw new Error('templateId is required');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('permit_form_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (templateError || !template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Fetch field mappings for this template
    const { data: mappings, error: mappingsError } = await supabase
      .from('permit_field_mappings')
      .select('*')
      .eq('template_id', templateId);
    
    if (mappingsError) {
      console.warn('Error fetching mappings:', mappingsError);
    }
    
    // Build merged data from permit project + contractor + passed formData
    let mergedData: Record<string, any> = { ...formData };
    
    if (permitProjectId) {
      // Fetch permit project data
      const { data: project, error: projectError } = await supabase
        .from('permit_projects')
        .select('*')
        .eq('id', permitProjectId)
        .single();
      
      if (project) {
        // Map project fields to form fields — covers ALL OUR_FIELDS categories
        mergedData = {
          ...mergedData,
          // Property
          property_address: project.property_address,
          property_unit: project.property_unit,
          property_city: project.city,
          property_state: project.state || 'FL',
          property_zip: project.zip_code,
          property_county: project.county || project.jurisdiction_county,
          folio_number: project.folio_number || project.parcel_id,
          legal_description: project.legal_description,
          flood_zone: project.flood_zone,
          wind_speed_zone: project.wind_speed_zone,

          // Owner
          owner_name: project.owner_name || project.customer_name,
          owner_address: project.owner_address,
          owner_city: project.owner_city,
          owner_state: project.owner_state,
          owner_zip: project.owner_zip,
          owner_phone: project.owner_phone || project.customer_phone,
          owner_fax: project.owner_fax,
          owner_email: project.owner_email || project.customer_email,
          tenant_name: project.tenant_name,

          // Project
          permit_type: project.permit_type || project.service_type,
          scope_description: project.scope_description,
          work_description: project.scope_description,
          work_type: project.roof_work_type || 'repair',
          valuation: project.valuation,
          square_footage: project.square_footage || project.roof_size_sqft,
          commencement_date: project.commencement_date,
          expiration_date: project.expiration_date,

          // Roofing
          roof_work_type: project.roof_work_type,
          roof_size_sqft: project.roof_size_sqft,
          roof_pitch: project.roof_pitch,
          roof_stories: project.roof_stories,
          existing_roof_material: project.existing_roof_material,
          new_roof_material: project.new_roof_material || project.roof_type,
          underlayment_product: project.underlayment_product || project.underlayment_type,
          underlayment_noa: project.underlayment_noa,
          roof_covering_product: project.roof_covering_product,
          roof_covering_noa: project.roof_covering_noa,
          fastener_product: project.fastener_product,
          fastener_noa: project.fastener_noa,
          deck_type: project.deck_type,
          deck_attachment_confirmed: project.deck_attachment_confirmed,
          year_built: project.year_built,
          building_type: project.building_type,
          has_exposed_ceilings: project.has_exposed_ceilings,
          has_ponding_water: project.has_ponding_water,
          requires_overflow_scuppers: project.requires_overflow_scuppers,
          fastener_pattern_confirmed: project.fastener_pattern_confirmed,
          obstacles: project.obstacles,

          // Windows & Doors
          window_count: project.window_count,
          door_count: project.door_count,
          sliding_door_count: project.sliding_door_count,
          frame_material: project.frame_material,
          u_factor: project.u_factor,
          shgc: project.shgc,
          window_product: project.window_product,
          window_noa: project.window_noa,
          door_product: project.door_product,
          door_noa: project.door_noa,

          // NOC
          improvement_description: project.improvement_description,
          lender_name: project.lender_name,
          lender_address: project.lender_address,
          bond_amount: project.bond_amount,
          surety_name: project.surety_name,

          // Compliance
          is_hvhz: project.is_hvhz,
          hvhz_protocol: project.hvhz_protocol,
          energy_code_compliant: project.energy_code_compliant,
          engineer_required: project.engineer_required,

          // Auto
          date_today: new Date().toLocaleDateString('en-US'),
          application_number: project.application_number,

          // Legacy compatibility
          pcn: project.folio_number || project.parcel_id,
          building_use: project.building_use || 'Residential',
          roof_slope: project.roof_pitch,
          is_hoa: project.hoa_approval,

          ...project.trade_data, // Spread any trade-specific data
        };
        
        // Auto-evaluate Section 1524 checkboxes
        const section1524Values = evaluateSection1524Checkboxes(mergedData);
        mergedData = { ...mergedData, ...section1524Values };
        
        // Fetch contractor data if available
        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
          const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
          if (user) {
            const { data: contractor } = await supabase
              .from('contractor_profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();
            
            if (contractor) {
              mergedData = {
                ...mergedData,
                contractor_name: contractor.qualifier_name || contractor.full_name,
                contractor_company: contractor.company_name,
                contractor_license: contractor.license_number,
                contractor_license_state: contractor.license_state || 'FL',
                contractor_address: contractor.address,
                contractor_city: contractor.city,
                contractor_state: contractor.state || 'FL',
                contractor_zip: contractor.zip_code,
                contractor_phone: contractor.phone,
                contractor_fax: contractor.fax,
                contractor_email: contractor.email,
                insurance_company: contractor.insurance_company,
                insurance_policy: contractor.insurance_policy_number,
                insurance_expiration: contractor.insurance_expiration,
                workers_comp_provider: contractor.workers_comp_provider,
                workers_comp_expiration: contractor.workers_comp_expiration,
              };
            }
            
            // Also check contractor_form_data for additional fields
            const { data: formDataRow } = await supabase
              .from('contractor_form_data')
              .select('*')
              .eq('user_id', user.id)
              .single();
            
            if (formDataRow) {
              mergedData = {
                ...mergedData,
                ...formDataRow,
              };
            }
          }
        }
      }
    }
    
    // Download the template PDF
    const templateUrl = template.file_url;
    if (!templateUrl) {
      throw new Error('Template has no file URL');
    }
    
    let pdfBytes: ArrayBuffer;
    
    // Check if it's a storage path or full URL
    if (templateUrl.startsWith('http')) {
      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.status}`);
      }
      pdfBytes = await response.arrayBuffer();
    } else {
      // It's a storage path
      const { data, error } = await supabase.storage
        .from('permit-form-templates')
        .download(templateUrl);
      
      if (error || !data) {
        throw new Error(`Failed to download template: ${error?.message}`);
      }
      pdfBytes = await data.arrayBuffer();
    }
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log('Available PDF fields:', fields.map(f => f.getName()));
    
    // Track which fields were filled and which need signatures
    const filledFields: string[] = [];
    const signatureFields: string[] = [];
    const unfoundFields: string[] = [];
    
    // Process mappings
    const mappingList: FieldMapping[] = mappings || [];
    
    // Also use default mappings from template if available
    if (template.field_mappings && typeof template.field_mappings === 'object') {
      const defaultMappings = template.field_mappings as Record<string, string>;
      for (const [ourField, pdfField] of Object.entries(defaultMappings)) {
        if (!mappingList.find(m => m.our_field === ourField)) {
          mappingList.push({
            our_field: ourField,
            pdf_field: pdfField,
          });
        }
      }
    }
    
    // Fill fields based on mappings
    for (const mapping of mappingList) {
      const { our_field, pdf_field, transform_type, conditional_logic, section } = mapping;
      
      // Skip if section doesn't match (for multi-section forms)
      if (section && formData._requiredSections && !formData._requiredSections.includes(section)) {
        continue;
      }
      
      // Check conditional logic
      if (conditional_logic && !evaluateCondition(conditional_logic, mergedData)) {
        continue;
      }
      
      const value = mergedData[our_field];
      if (value === undefined || value === null) continue;
      
      const transformedValue = transformValue(value, transform_type);
      
      try {
        const field = form.getField(pdf_field);
        
        if (field instanceof PDFTextField) {
          if (mode !== 'blank_for_signature') {
            field.setText(transformedValue);
            filledFields.push(pdf_field);
          }
        } else if (field instanceof PDFCheckBox) {
          const shouldCheck = ['true', '1', 'yes', 'on', 'checked', transformedValue.toLowerCase()].includes(
            String(value).toLowerCase()
          );
          if (mode !== 'blank_for_signature') {
            if (shouldCheck) {
              field.check();
            } else {
              field.uncheck();
            }
            filledFields.push(pdf_field);
          }
        }
      } catch (e) {
        unfoundFields.push(pdf_field);
        console.warn(`Field ${pdf_field} not found or error:`, e);
      }
    }
    
    // Identify signature fields
    const signaturePatterns = ['signature', 'sign', 'notary', 'witness', 'seal'];
    for (const field of fields) {
      const name = field.getName().toLowerCase();
      if (signaturePatterns.some(pattern => name.includes(pattern))) {
        signatureFields.push(field.getName());
        
        // Optionally highlight signature fields
        if (mode === 'mark_signature_fields') {
          try {
            const pages = pdfDoc.getPages();
            const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
            
            // This is a simplified approach - proper implementation would 
            // find the field widget annotations and their positions
            if (field instanceof PDFTextField) {
              field.setText('▶ SIGN HERE ◀');
            }
          } catch (e) {
            console.warn('Could not mark signature field:', e);
          }
        }
      }
    }
    
    // Also check template's signature_fields metadata
    if (template.signature_fields && Array.isArray(template.signature_fields)) {
      for (const sigField of template.signature_fields) {
        if (!signatureFields.includes(sigField.field_name)) {
          signatureFields.push(sigField.field_name);
        }
      }
    }
    
    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    
    // Upload to storage
    const outputPath = `filled-forms/${permitProjectId || 'temp'}/${templateId}-${Date.now()}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from('permit-documents')
      .upload(outputPath, filledPdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });
    
    if (uploadError) {
      console.warn('Upload error:', uploadError);
    }
    
    // Generate signed URL for viewing
    const { data: signedUrl } = await supabase.storage
      .from('permit-documents')
      .createSignedUrl(outputPath, 3600); // 1 hour expiry
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        templateId,
        templateName: template.name,
        filePath: outputPath,
        fileUrl: signedUrl?.signedUrl,
        filledFieldCount: filledFields.length,
        filledFields,
        signatureFields,
        unfoundFields,
        requiresSignature: signatureFields.length > 0,
        requiresNotary: template.requires_notary || false,
        notaryThreshold: template.notary_threshold,
        mode,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Smart form filler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fill form';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
