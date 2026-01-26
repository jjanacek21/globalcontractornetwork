-- Phase 1: Add new fields to product_approvals for better document sourcing
ALTER TABLE public.product_approvals 
ADD COLUMN IF NOT EXISTS pe_evaluation_url TEXT,
ADD COLUMN IF NOT EXISTS ul_2218_class TEXT,
ADD COLUMN IF NOT EXISTS impact_test_url TEXT,
ADD COLUMN IF NOT EXISTS installation_guide_url TEXT,
ADD COLUMN IF NOT EXISTS source_url_noa TEXT,
ADD COLUMN IF NOT EXISTS source_url_fl TEXT,
ADD COLUMN IF NOT EXISTS last_source_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS source_status TEXT DEFAULT 'pending' CHECK (source_status IN ('pending', 'searching', 'found', 'not_found', 'error', 'manual')),
ADD COLUMN IF NOT EXISTS source_website TEXT;

-- Phase 4: Create Windows/Doors packet structures for all 3 counties
INSERT INTO public.permit_packet_structures (county, city, trade_type, material_type, is_hvhz, document_structure, is_active)
VALUES 
  -- Miami-Dade Windows/Doors (HVHZ)
  ('Miami-Dade', NULL, 'windows_doors', NULL, true, '[
    {"order": 1, "type": "cover_sheet", "source": "generated", "pages": 1},
    {"order": 2, "type": "permit_application", "source": "auto_fill", "needs_signature": true, "pages": 2},
    {"order": 3, "type": "noc", "source": "auto_fill", "needs_notary": true, "requires_recording": true, "pages": 2},
    {"order": 4, "type": "owner_authorization", "source": "user_upload", "needs_signature": true},
    {"order": 5, "type": "energy_calculations", "source": "auto_fill", "pages": 1},
    {"order": 6, "type": "product_approvals", "source": "auto_source", "product_category": "Impact Window"},
    {"order": 7, "type": "product_approvals", "source": "auto_source", "product_category": "Impact Door"},
    {"order": 8, "type": "engineering_drawings", "source": "conditional", "condition": "if_over_30ft_or_multifamily"},
    {"order": 9, "type": "coi", "source": "user_upload"},
    {"order": 10, "type": "contractor_license", "source": "user_upload"}
  ]'::jsonb, true),
  
  -- Broward Windows/Doors (HVHZ)
  ('Broward', NULL, 'windows_doors', NULL, true, '[
    {"order": 1, "type": "cover_sheet", "source": "generated", "pages": 1},
    {"order": 2, "type": "permit_application", "source": "auto_fill", "needs_signature": true, "pages": 2},
    {"order": 3, "type": "noc", "source": "auto_fill", "needs_notary": true, "requires_recording": true, "pages": 2},
    {"order": 4, "type": "owner_authorization", "source": "user_upload", "needs_signature": true},
    {"order": 5, "type": "hoa_affidavit", "source": "conditional", "condition": "if_hoa", "needs_notary": true},
    {"order": 6, "type": "energy_calculations", "source": "auto_fill", "pages": 1},
    {"order": 7, "type": "product_approvals", "source": "auto_source", "product_category": "Impact Window"},
    {"order": 8, "type": "product_approvals", "source": "auto_source", "product_category": "Impact Door"},
    {"order": 9, "type": "coi", "source": "user_upload"},
    {"order": 10, "type": "contractor_license", "source": "user_upload"}
  ]'::jsonb, true),
  
  -- Palm Beach Windows/Doors (non-HVHZ)
  ('Palm Beach', NULL, 'windows_doors', NULL, false, '[
    {"order": 1, "type": "cover_sheet", "source": "generated", "pages": 1},
    {"order": 2, "type": "permit_application", "source": "auto_fill", "needs_signature": true, "pages": 2},
    {"order": 3, "type": "noc", "source": "auto_fill", "needs_notary": true, "requires_recording": true, "pages": 2},
    {"order": 4, "type": "owner_authorization", "source": "user_upload", "needs_signature": true},
    {"order": 5, "type": "energy_calculations", "source": "auto_fill", "pages": 1},
    {"order": 6, "type": "product_approvals", "source": "auto_source", "product_category": "Impact Window"},
    {"order": 7, "type": "product_approvals", "source": "auto_source", "product_category": "Impact Door"},
    {"order": 8, "type": "coi", "source": "user_upload"},
    {"order": 9, "type": "contractor_license", "source": "user_upload"}
  ]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Phase 5: Create permit_rejections table for learning loop
CREATE TABLE IF NOT EXISTS public.permit_rejections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_project_id UUID REFERENCES public.permit_projects(id) ON DELETE CASCADE,
  packet_id UUID,
  rejection_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  rejection_reason TEXT NOT NULL,
  missing_documents TEXT[],
  reviewer_notes TEXT,
  resubmission_required BOOLEAN DEFAULT true,
  resubmission_deadline TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  county TEXT,
  city TEXT,
  trade_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on permit_rejections
ALTER TABLE public.permit_rejections ENABLE ROW LEVEL SECURITY;

-- RLS policies for permit_rejections
CREATE POLICY "Users can view rejections for their permits"
ON public.permit_rejections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.permit_projects pp
    WHERE pp.id = permit_project_id AND pp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert rejections for their permits"
ON public.permit_rejections FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.permit_projects pp
    WHERE pp.id = permit_project_id AND pp.user_id = auth.uid()
  )
);

-- Add Section 1524 fields to permit_projects
ALTER TABLE public.permit_projects
ADD COLUMN IF NOT EXISTS year_built INTEGER,
ADD COLUMN IF NOT EXISTS building_type TEXT DEFAULT 'single_family' CHECK (building_type IN ('single_family', 'multi_family', 'commercial')),
ADD COLUMN IF NOT EXISTS has_exposed_ceilings BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_ponding_water BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_overflow_scuppers BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deck_attachment_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fastener_pattern_confirmed BOOLEAN DEFAULT false;

-- Create Section 1524 checkbox mappings table
CREATE TABLE IF NOT EXISTS public.section_1524_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkbox_id TEXT NOT NULL UNIQUE,
  checkbox_label TEXT NOT NULL,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('always', 'year_built', 'building_type', 'roof_slope', 'field_value')),
  condition_field TEXT,
  condition_operator TEXT CHECK (condition_operator IN ('<', '<=', '>', '>=', '=', '!=', 'includes', 'equals')),
  condition_value TEXT,
  pdf_field_name TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default Section 1524 mappings
INSERT INTO public.section_1524_mappings (checkbox_id, checkbox_label, condition_type, condition_field, condition_operator, condition_value, description)
VALUES
  ('aesthetics_reserved', 'Aesthetics/Workmanship Reserved', 'always', NULL, NULL, NULL, 'Always check - standard disclaimer'),
  ('renailing_wood_decks', 'Renailing Wood Decks', 'year_built', 'year_built', '<', '1994', 'Required if home built before 1994'),
  ('common_roofs_reserved', 'Common Roofs Reserved', 'building_type', 'building_type', '=', 'multi_family', 'Check for multi-family buildings'),
  ('exposed_ceilings', 'Exposed Ceilings', 'field_value', 'has_exposed_ceilings', '=', 'true', 'Check if home has exposed/cathedral ceilings'),
  ('ponding_water_reserved', 'Ponding Water Reserved', 'roof_slope', 'pitch', '=', 'flat', 'Check for flat roofs with potential ponding'),
  ('overflow_scuppers', 'Overflow Scuppers', 'roof_slope', 'pitch', '=', 'flat', 'Check for flat roofs requiring drainage')
ON CONFLICT (checkbox_id) DO NOTHING;

-- No RLS needed for section_1524_mappings - public read access
ALTER TABLE public.section_1524_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read section 1524 mappings"
ON public.section_1524_mappings FOR SELECT
USING (true);

-- Create trigger for updated_at on permit_rejections
CREATE TRIGGER update_permit_rejections_updated_at
BEFORE UPDATE ON public.permit_rejections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();