-- Enhance permit_form_templates table
ALTER TABLE permit_form_templates 
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'application',
  ADD COLUMN IF NOT EXISTS trade_types text[] DEFAULT ARRAY['*']::text[],
  ADD COLUMN IF NOT EXISTS hvhz_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signature_locations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS page_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS common_errors text[];

-- Create permit field mappings table for PDF auto-fill
CREATE TABLE permit_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES permit_form_templates(id) ON DELETE CASCADE,
  our_field text NOT NULL,
  pdf_field text NOT NULL,
  field_type text DEFAULT 'text' CHECK (field_type IN ('text', 'checkbox', 'date', 'signature', 'number')),
  is_required boolean DEFAULT false,
  page_number integer DEFAULT 1,
  default_value text,
  transform_function text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_field_mappings_template ON permit_field_mappings(template_id);
CREATE UNIQUE INDEX idx_field_mappings_unique ON permit_field_mappings(template_id, pdf_field);

-- Create permit resources table for guides, checklists, examples
CREATE TABLE permit_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL CHECK (resource_type IN ('guide', 'checklist', 'example_packet', 'rejection_explanation', 'video', 'faq')),
  title text NOT NULL,
  description text,
  content_html text,
  file_url text,
  trade text,
  jurisdiction_county text,
  jurisdiction_city text,
  tags text[] DEFAULT '{}',
  view_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_resources_type ON permit_resources(resource_type);
CREATE INDEX idx_resources_trade ON permit_resources(trade);
CREATE INDEX idx_resources_jurisdiction ON permit_resources(jurisdiction_county, jurisdiction_city);

-- Create permit rejections table for learning system
CREATE TABLE permit_rejections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_project_id uuid REFERENCES permit_projects(id) ON DELETE SET NULL,
  rejection_reason text NOT NULL,
  rejection_category text CHECK (rejection_category IN ('missing_document', 'wrong_product', 'form_error', 'code_violation', 'incomplete_info', 'other')),
  jurisdiction_county text NOT NULL,
  jurisdiction_city text,
  trade text NOT NULL,
  resolved boolean DEFAULT false,
  resolution_notes text,
  ai_extracted_rule text,
  ai_suggested_action text,
  admin_reviewed boolean DEFAULT false,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_rejections_jurisdiction ON permit_rejections(jurisdiction_county, jurisdiction_city);
CREATE INDEX idx_rejections_trade ON permit_rejections(trade);
CREATE INDEX idx_rejections_category ON permit_rejections(rejection_category);

-- Create permit types table for unified trade/subtype management
CREATE TABLE permit_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade text NOT NULL,
  subtype text,
  display_name text NOT NULL,
  description text,
  icon_name text,
  requires_engineer boolean DEFAULT false,
  requires_noc boolean DEFAULT true,
  engineering_threshold numeric,
  base_fee numeric,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_permit_types_trade_subtype ON permit_types(trade, COALESCE(subtype, ''));

-- Create trade requirements table per jurisdiction
CREATE TABLE trade_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade text NOT NULL,
  jurisdiction_id uuid REFERENCES permit_building_departments(id) ON DELETE CASCADE,
  required_documents text[] DEFAULT '{}',
  conditional_documents jsonb DEFAULT '{}',
  photo_requirements text[] DEFAULT '{}',
  revision_triggers text[] DEFAULT '{}',
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_trade_requirements_trade ON trade_requirements(trade);
CREATE INDEX idx_trade_requirements_jurisdiction ON trade_requirements(jurisdiction_id);

-- Enable RLS on new tables
ALTER TABLE permit_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_requirements ENABLE ROW LEVEL SECURITY;

-- RLS policies for permit_field_mappings (read-only for authenticated users, write for admins)
CREATE POLICY "Anyone can view field mappings" ON permit_field_mappings FOR SELECT USING (true);
CREATE POLICY "Admins can manage field mappings" ON permit_field_mappings FOR ALL USING (is_super_admin());

-- RLS policies for permit_resources (public read, admin write)
CREATE POLICY "Anyone can view published resources" ON permit_resources FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage resources" ON permit_resources FOR ALL USING (is_super_admin());

-- RLS policies for permit_rejections (project owner or admin)
CREATE POLICY "Users can view own rejections" ON permit_rejections FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM permit_projects pp 
    WHERE pp.id = permit_project_id 
    AND pp.user_id = auth.uid()
  ) OR is_super_admin()
);
CREATE POLICY "Users can insert own rejections" ON permit_rejections FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM permit_projects pp 
    WHERE pp.id = permit_project_id 
    AND pp.user_id = auth.uid()
  ) OR is_super_admin()
);
CREATE POLICY "Admins can update rejections" ON permit_rejections FOR UPDATE USING (is_super_admin());

-- RLS policies for permit_types (public read)
CREATE POLICY "Anyone can view permit types" ON permit_types FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage permit types" ON permit_types FOR ALL USING (is_super_admin());

-- RLS policies for trade_requirements (public read, admin write)
CREATE POLICY "Anyone can view trade requirements" ON trade_requirements FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage trade requirements" ON trade_requirements FOR ALL USING (is_super_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_field_mappings_updated_at
  BEFORE UPDATE ON permit_field_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON permit_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_requirements_updated_at
  BEFORE UPDATE ON trade_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();