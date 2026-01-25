-- Phase 1: Enhanced AI Permit Packet Generator Schema

-- Create permit_packet_structures table
-- Stores document ordering and requirements for each county/city/trade/material combination
CREATE TABLE public.permit_packet_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county TEXT NOT NULL,
  city TEXT, -- NULL = county-wide default
  trade_type TEXT NOT NULL, -- 'roofing', 'hvac', 'electrical', etc.
  material_type TEXT, -- 'tile', 'metal', 'shingle', 'flat', etc.
  is_hvhz BOOLEAN DEFAULT FALSE,
  document_structure JSONB NOT NULL, -- Ordered list of documents with source types
  conditional_documents JSONB, -- Conditions like if_hoa, if_pre_1988, if_over_300k
  signature_requirements JSONB, -- Which documents need signatures and what type
  recording_requirements JSONB, -- Which documents need to be recorded (e.g., NOC)
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX idx_packet_structures_lookup ON public.permit_packet_structures (county, city, trade_type, material_type, is_hvhz);

-- Create permit_packet_training table
-- Stores analyzed example packets for AI reference and learning
CREATE TABLE public.permit_packet_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county TEXT NOT NULL,
  city TEXT,
  trade_type TEXT NOT NULL,
  material_type TEXT,
  is_hvhz BOOLEAN DEFAULT FALSE,
  packet_structure JSONB NOT NULL, -- Extracted structure from example
  extracted_fields JSONB, -- Fields extracted from example forms
  example_description TEXT, -- Human-readable description of what was learned
  source_file_name TEXT, -- Original file name for reference
  page_count INTEGER,
  quality_score NUMERIC(3,2), -- 0-1 score for packet completeness
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter permit_form_templates to support county/city-specific forms
ALTER TABLE public.permit_form_templates 
  ADD COLUMN IF NOT EXISTS county TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS material_type TEXT,
  ADD COLUMN IF NOT EXISTS hvhz_only BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_notary BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notary_threshold NUMERIC, -- e.g., 5000 for $5K+ threshold
  ADD COLUMN IF NOT EXISTS signature_fields JSONB, -- Array of signature field locations
  ADD COLUMN IF NOT EXISTS sections_required JSONB, -- For multi-section forms like Boca Raton A-E
  ADD COLUMN IF NOT EXISTS conditional_logic JSONB; -- Conditions for when form is required

-- Alter permit_field_mappings to support transforms and sections
ALTER TABLE public.permit_field_mappings
  ADD COLUMN IF NOT EXISTS county TEXT,
  ADD COLUMN IF NOT EXISTS transform_type TEXT, -- 'uppercase', 'currency', 'date', 'phone', 'checkbox'
  ADD COLUMN IF NOT EXISTS section TEXT, -- For multi-section forms (A, B, C, etc.)
  ADD COLUMN IF NOT EXISTS conditional_logic JSONB, -- Conditional field filling logic
  ADD COLUMN IF NOT EXISTS validation_pattern TEXT; -- Regex for field validation

-- Create indexes for field mapping lookups
CREATE INDEX IF NOT EXISTS idx_field_mappings_county ON public.permit_field_mappings (county);
CREATE INDEX IF NOT EXISTS idx_field_mappings_template ON public.permit_field_mappings (template_id);

-- Enable RLS on new tables
ALTER TABLE public.permit_packet_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_packet_training ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permit_packet_structures (read-only for authenticated users)
CREATE POLICY "Anyone can read packet structures"
  ON public.permit_packet_structures
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage packet structures"
  ON public.permit_packet_structures
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- RLS Policies for permit_packet_training (read-only for authenticated users)
CREATE POLICY "Anyone can read packet training data"
  ON public.permit_packet_training
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage packet training data"
  ON public.permit_packet_training
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Create trigger to update updated_at
CREATE TRIGGER update_permit_packet_structures_updated_at
  BEFORE UPDATE ON public.permit_packet_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();