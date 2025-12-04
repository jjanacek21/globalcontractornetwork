
-- Florida building departments
CREATE TABLE public.permit_building_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  jurisdiction_type TEXT NOT NULL DEFAULT 'city', -- 'city' or 'county'
  county TEXT NOT NULL,
  city TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  portal_url TEXT,
  hours TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Local code requirements by building department
CREATE TABLE public.permit_local_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_dept_id UUID REFERENCES public.permit_building_departments(id) ON DELETE CASCADE,
  trade_type TEXT NOT NULL, -- 'roofing', 'hvac', 'plumbing', 'electrical', 'general', 'solar'
  requirement_title TEXT NOT NULL,
  requirement_description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  code_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Required documents per building department and trade
CREATE TABLE public.permit_required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_dept_id UUID REFERENCES public.permit_building_departments(id) ON DELETE CASCADE,
  trade_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT,
  is_required BOOLEAN DEFAULT true,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permit_building_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_local_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_required_documents ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (reference data)
CREATE POLICY "Building departments are viewable by everyone"
ON public.permit_building_departments FOR SELECT
USING (true);

CREATE POLICY "Local codes are viewable by everyone"
ON public.permit_local_codes FOR SELECT
USING (true);

CREATE POLICY "Required documents are viewable by everyone"
ON public.permit_required_documents FOR SELECT
USING (true);

-- Admin management policies
CREATE POLICY "Admins can manage building departments"
ON public.permit_building_departments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage local codes"
ON public.permit_local_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage required documents"
ON public.permit_required_documents FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_permit_building_depts_county ON public.permit_building_departments(county);
CREATE INDEX idx_permit_building_depts_city ON public.permit_building_departments(city);
CREATE INDEX idx_permit_local_codes_dept ON public.permit_local_codes(building_dept_id);
CREATE INDEX idx_permit_local_codes_trade ON public.permit_local_codes(trade_type);
CREATE INDEX idx_permit_required_docs_dept ON public.permit_required_documents(building_dept_id);
CREATE INDEX idx_permit_required_docs_trade ON public.permit_required_documents(trade_type);
