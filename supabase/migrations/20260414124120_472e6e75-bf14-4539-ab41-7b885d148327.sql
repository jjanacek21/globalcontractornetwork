
-- RoofScope Company Profiles
CREATE TABLE public.rs_company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  license_number TEXT,
  service_area TEXT[],
  logo_url TEXT,
  primary_color TEXT DEFAULT '#58A6FF',
  secondary_color TEXT DEFAULT '#F0883E',
  tagline TEXT,
  default_labor_rate NUMERIC(10,2),
  default_markup_percent NUMERIC(5,2) DEFAULT 0,
  default_waste_factor NUMERIC(5,2) DEFAULT 10,
  preferred_units TEXT DEFAULT 'squares',
  default_terms TEXT,
  default_disclaimer TEXT DEFAULT 'This estimate is based on the information provided and visible conditions. Final pricing is subject to on-site verification. Concealed damage discovered during work may result in additional charges via written change order.',
  tax_rate NUMERIC(5,3) DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.rs_company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own company" ON public.rs_company_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RoofScope Customers
CREATE TABLE public.rs_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.rs_company_profiles(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'multi_family')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rs_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members manage customers" ON public.rs_customers FOR ALL
  USING (company_id IN (SELECT id FROM public.rs_company_profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.rs_company_profiles WHERE user_id = auth.uid()));

-- RoofScope Estimates
CREATE TABLE public.rs_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.rs_company_profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.rs_customers(id) ON DELETE SET NULL,
  estimate_number TEXT UNIQUE NOT NULL,
  property_address TEXT,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  property_type TEXT,
  num_stories INTEGER DEFAULT 1,
  existing_roof_type TEXT,
  existing_layers INTEGER DEFAULT 1,
  existing_condition TEXT,
  known_issues TEXT[],
  new_roof_type TEXT,
  new_roof_details JSONB DEFAULT '{}',
  total_squares NUMERIC(10,2),
  total_sf NUMERIC(10,2),
  roof_pitch TEXT,
  waste_factor NUMERIC(5,2),
  num_facets TEXT,
  linear_measurements JSONB DEFAULT '{}',
  penetrations JSONB DEFAULT '{}',
  underlayment_type TEXT,
  ventilation JSONB DEFAULT '{}',
  gutters JSONB DEFAULT '{}',
  decking JSONB DEFAULT '{}',
  drip_edge BOOLEAN DEFAULT true,
  fascia_repair TEXT DEFAULT 'none',
  soffit_repair TEXT DEFAULT 'none',
  painting BOOLEAN DEFAULT false,
  region TEXT,
  code_requirements JSONB DEFAULT '{}',
  permit_included BOOLEAN DEFAULT true,
  permit_cost NUMERIC(10,2) DEFAULT 0,
  engineering_required BOOLEAN DEFAULT false,
  engineering_cost NUMERIC(10,2) DEFAULT 0,
  selected_tier TEXT DEFAULT 'better',
  notes TEXT,
  disclaimer TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined')),
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  grand_total NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rs_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members manage estimates" ON public.rs_estimates FOR ALL
  USING (company_id IN (SELECT id FROM public.rs_company_profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.rs_company_profiles WHERE user_id = auth.uid()));

-- RoofScope Estimate Line Items
CREATE TABLE public.rs_estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.rs_estimates(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('good', 'better', 'best', 'all')),
  category TEXT,
  description TEXT NOT NULL,
  detail TEXT,
  quantity NUMERIC(10,2),
  unit TEXT,
  unit_price NUMERIC(10,2),
  total NUMERIC(12,2),
  sort_order INTEGER DEFAULT 0,
  is_from_ai BOOLEAN DEFAULT false,
  ai_analysis_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rs_estimate_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage line items via estimate" ON public.rs_estimate_line_items FOR ALL
  USING (estimate_id IN (SELECT id FROM public.rs_estimates WHERE company_id IN (SELECT id FROM public.rs_company_profiles WHERE user_id = auth.uid())))
  WITH CHECK (estimate_id IN (SELECT id FROM public.rs_estimates WHERE company_id IN (SELECT id FROM public.rs_company_profiles WHERE user_id = auth.uid())));

-- RoofScope AI Analyses
CREATE TABLE public.rs_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.rs_company_profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.rs_customers(id) ON DELETE SET NULL,
  estimate_id UUID REFERENCES public.rs_estimates(id) ON DELETE SET NULL,
  photo_urls TEXT[],
  analysis_results JSONB,
  is_storm_damage BOOLEAN DEFAULT false,
  storm_damage_type TEXT,
  storm_lookup_results JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rs_ai_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members manage analyses" ON public.rs_ai_analyses FOR ALL
  USING (company_id IN (SELECT id FROM public.rs_company_profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.rs_company_profiles WHERE user_id = auth.uid()));

-- RoofScope Line Item Templates
CREATE TABLE public.rs_line_item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.rs_company_profiles(id) ON DELETE CASCADE,
  category TEXT,
  description TEXT NOT NULL,
  detail TEXT,
  default_unit TEXT,
  default_unit_price NUMERIC(10,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rs_line_item_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members manage templates" ON public.rs_line_item_templates FOR ALL
  USING (company_id IN (SELECT id FROM public.rs_company_profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.rs_company_profiles WHERE user_id = auth.uid()));

-- RoofScope Pricing Rules (public reference data)
CREATE TABLE public.rs_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  roof_type TEXT NOT NULL,
  material_description TEXT,
  unit TEXT DEFAULT 'SF',
  price_low NUMERIC(10,2),
  price_mid NUMERIC(10,2),
  price_high NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rs_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pricing rules" ON public.rs_pricing_rules FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert pricing rules" ON public.rs_pricing_rules FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX idx_rs_estimates_company ON public.rs_estimates(company_id);
CREATE INDEX idx_rs_estimates_customer ON public.rs_estimates(customer_id);
CREATE INDEX idx_rs_line_items_estimate ON public.rs_estimate_line_items(estimate_id);
CREATE INDEX idx_rs_customers_company ON public.rs_customers(company_id);
CREATE INDEX idx_rs_pricing_region_type ON public.rs_pricing_rules(region, roof_type);

-- Updated_at triggers
CREATE TRIGGER update_rs_company_profiles_updated_at BEFORE UPDATE ON public.rs_company_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rs_customers_updated_at BEFORE UPDATE ON public.rs_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rs_estimates_updated_at BEFORE UPDATE ON public.rs_estimates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
