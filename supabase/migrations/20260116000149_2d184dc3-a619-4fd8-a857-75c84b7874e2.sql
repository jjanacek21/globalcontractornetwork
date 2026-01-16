-- Create storage bucket for permit form templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('permit-form-templates', 'permit-form-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for permit form templates
CREATE POLICY "Anyone can read permit form templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'permit-form-templates');

CREATE POLICY "Authenticated users can upload permit form templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'permit-form-templates' AND auth.role() = 'authenticated');

-- Permit form templates - stores blank PDF forms by jurisdiction
CREATE TABLE public.permit_form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id uuid REFERENCES public.jurisdiction_rules(id) ON DELETE CASCADE,
  jurisdiction_name text NOT NULL,
  form_type text NOT NULL, -- 'permit_application', 'noc', 'owner_authorization', 'affidavit'
  form_name text NOT NULL,
  form_version text,
  file_path text NOT NULL,
  field_mapping jsonb DEFAULT '{}', -- Maps data fields to PDF form field names
  is_fillable boolean DEFAULT false,
  requires_signature boolean DEFAULT false,
  requires_notary boolean DEFAULT false,
  page_count integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permit_form_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates
CREATE POLICY "Anyone can read permit form templates table"
ON public.permit_form_templates FOR SELECT
USING (true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage permit form templates"
ON public.permit_form_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Contractor form data - pre-filled info for auto-population
CREATE TABLE public.contractor_form_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_profile_id uuid REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  qualifier_name text,
  license_number text,
  license_type text,
  license_state text DEFAULT 'FL',
  address text,
  city text,
  state text DEFAULT 'FL',
  zip text,
  phone text,
  fax text,
  email text,
  insurance_company text,
  insurance_policy_number text,
  insurance_expiration date,
  workers_comp_provider text,
  workers_comp_policy text,
  workers_comp_expiration date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contractor_form_data ENABLE ROW LEVEL SECURITY;

-- Contractors can manage their own form data
CREATE POLICY "Contractors can view own form data"
ON public.contractor_form_data FOR SELECT
USING (user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.contractor_profiles cp 
    WHERE cp.id = contractor_profile_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Contractors can insert own form data"
ON public.contractor_form_data FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Contractors can update own form data"
ON public.contractor_form_data FOR UPDATE
USING (user_id = auth.uid());

-- Generated permit packets
CREATE TABLE public.permit_packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_request_id uuid REFERENCES public.permit_projects(id) ON DELETE CASCADE,
  packet_type text DEFAULT 'submission', -- 'submission', 'revision', 'supplemental'
  file_path text,
  document_count integer DEFAULT 0,
  total_pages integer DEFAULT 0,
  documents_included jsonb DEFAULT '[]', -- Array of included documents
  cover_sheet_html text,
  document_index jsonb DEFAULT '[]',
  ai_notes text,
  generated_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'draft', -- 'draft', 'ready', 'submitted', 'approved', 'rejected'
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permit_packets ENABLE ROW LEVEL SECURITY;

-- Users can view packets for their permits
CREATE POLICY "Users can view own permit packets"
ON public.permit_packets FOR SELECT
USING (
  generated_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.permit_projects pp
    WHERE pp.id = permit_request_id AND pp.contractor_id = auth.uid()
  )
);

CREATE POLICY "Users can create packets for own permits"
ON public.permit_packets FOR INSERT
WITH CHECK (
  generated_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.permit_projects pp
    WHERE pp.id = permit_request_id AND pp.contractor_id = auth.uid()
  )
);

CREATE POLICY "Users can update own packets"
ON public.permit_packets FOR UPDATE
USING (
  generated_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.permit_projects pp
    WHERE pp.id = permit_request_id AND pp.contractor_id = auth.uid()
  )
);

-- Product approvals / NOAs database
CREATE TABLE public.product_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer text NOT NULL,
  product_name text NOT NULL,
  product_line text,
  product_category text NOT NULL, -- 'shingles', 'underlayment', 'tiles', 'metal', 'fasteners', 'adhesive'
  noa_number text,
  fl_product_approval text,
  approval_date date,
  expiration_date date,
  file_path text, -- Storage path to NOA PDF
  file_url text, -- Direct URL if external
  hvhz_approved boolean DEFAULT false, -- High Velocity Hurricane Zone
  jurisdiction_scope text[] DEFAULT ARRAY['All Florida'], -- ['Miami-Dade', 'Broward', 'All Florida']
  wind_speed_rating integer, -- Max wind speed in mph
  specifications jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_approvals ENABLE ROW LEVEL SECURITY;

-- Everyone can read product approvals
CREATE POLICY "Anyone can read product approvals"
ON public.product_approvals FOR SELECT
USING (true);

-- Only admins can manage product approvals
CREATE POLICY "Admins can manage product approvals"
ON public.product_approvals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create indexes for faster lookups
CREATE INDEX idx_product_approvals_manufacturer ON public.product_approvals(manufacturer);
CREATE INDEX idx_product_approvals_category ON public.product_approvals(product_category);
CREATE INDEX idx_product_approvals_noa ON public.product_approvals(noa_number);

-- Insert common roofing product approvals
INSERT INTO public.product_approvals (manufacturer, product_name, product_line, product_category, noa_number, hvhz_approved, jurisdiction_scope, wind_speed_rating)
VALUES 
  ('CertainTeed', 'Landmark', 'Landmark Series', 'shingles', 'FL-29034', true, ARRAY['All Florida'], 130),
  ('CertainTeed', 'Landmark Pro', 'Landmark Series', 'shingles', 'FL-29034', true, ARRAY['All Florida'], 130),
  ('CertainTeed', 'Landmark Premium', 'Landmark Series', 'shingles', 'FL-29034', true, ARRAY['All Florida'], 130),
  ('GAF', 'Timberline HDZ', 'Timberline', 'shingles', 'FL-13706-R12', true, ARRAY['All Florida'], 130),
  ('GAF', 'Timberline UHDZ', 'Timberline Ultra', 'shingles', 'FL-13706-R12', true, ARRAY['All Florida'], 150),
  ('Owens Corning', 'Duration', 'Duration Series', 'shingles', 'FL-8774-R13', true, ARRAY['All Florida'], 130),
  ('Owens Corning', 'Duration Storm', 'Duration Series', 'shingles', 'FL-8774-R13', true, ARRAY['All Florida'], 130),
  ('IKO', 'Cambridge', 'Cambridge Series', 'shingles', 'FL-13825-R4', true, ARRAY['All Florida'], 130),
  ('Atlas', 'Pinnacle Pristine', 'Pinnacle Series', 'shingles', 'FL-15093-R5', true, ARRAY['All Florida'], 130),
  ('Boral', 'Barrel Tile', 'Concrete Tile', 'tiles', 'NOA 17-0605.09', true, ARRAY['Miami-Dade', 'Broward', 'All Florida'], 180),
  ('Eagle Roofing', 'Flat Tile', 'Concrete Tile', 'tiles', 'NOA 18-0310.04', true, ARRAY['Miami-Dade', 'Broward', 'All Florida'], 180),
  ('Polyglass', 'Polystick MTS Plus', 'Self-Adhered', 'underlayment', 'NOA 21-0603.05', true, ARRAY['All Florida'], 175),
  ('CertainTeed', 'DiamondDeck', 'Synthetic', 'underlayment', 'FL-8566-R8', true, ARRAY['All Florida'], 130),
  ('GAF', 'FeltBuster', 'Synthetic', 'underlayment', 'FL-11843-R6', true, ARRAY['All Florida'], 130),
  ('Grip-Rite', 'Coil Roofing Nails', 'Fasteners', 'fasteners', 'FL-9245-R4', true, ARRAY['All Florida'], 175),
  ('Henry', 'Roof Cement', 'Adhesives', 'adhesive', 'FL-7823', true, ARRAY['All Florida'], 130);

-- Update timestamp trigger for new tables
CREATE TRIGGER update_permit_form_templates_updated_at
  BEFORE UPDATE ON public.permit_form_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contractor_form_data_updated_at
  BEFORE UPDATE ON public.contractor_form_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permit_packets_updated_at
  BEFORE UPDATE ON public.permit_packets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_approvals_updated_at
  BEFORE UPDATE ON public.product_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();