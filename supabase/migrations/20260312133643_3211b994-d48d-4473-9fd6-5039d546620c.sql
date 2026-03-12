
-- PIQ Tables for PropertyIQ service

CREATE TABLE public.piq_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text,
  latitude numeric,
  longitude numeric,
  parcel_id text,
  property_type text,
  building_sqft int,
  lot_sqft int,
  year_built int,
  stories int,
  construction_type text,
  estimated_value numeric,
  assessed_value numeric,
  occupancy_status text,
  property_manager text,
  zoning text,
  flood_zone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.piq_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_type text,
  mailing_address text,
  phone text,
  email text,
  website text,
  linkedin_url text,
  facebook_url text
);

CREATE TABLE public.piq_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.piq_owners(id) ON DELETE CASCADE,
  company_name text,
  state_registered text,
  registration_number text,
  registered_agent text,
  formation_date date,
  status text,
  sunbiz_url text
);

CREATE TABLE public.piq_property_ownership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.piq_properties(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES public.piq_owners(id) ON DELETE CASCADE,
  ownership_percent numeric DEFAULT 100,
  is_current boolean DEFAULT true
);

CREATE TABLE public.piq_property_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.piq_properties(id) ON DELETE CASCADE,
  sale_date date,
  sale_price numeric,
  buyer text,
  seller text,
  lender text
);

CREATE TABLE public.piq_permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.piq_properties(id) ON DELETE CASCADE,
  permit_number text,
  permit_type text,
  description text,
  contractor text,
  estimated_cost numeric,
  issue_date date,
  status text
);

CREATE TABLE public.piq_building_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.piq_properties(id) ON DELETE CASCADE,
  component_type text,
  material text,
  install_year int,
  estimated_life int,
  condition text
);

CREATE TABLE public.piq_storm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.piq_properties(id) ON DELETE CASCADE,
  event_name text,
  event_type text,
  category text,
  wind_speed int,
  event_date date,
  damage_reported boolean,
  insurance_claims int
);

CREATE TABLE public.piq_property_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.piq_properties(id) ON DELETE CASCADE UNIQUE,
  roof_replacement_score int,
  renovation_score int,
  investment_score int,
  overall_contractor_score int,
  last_calculated timestamptz DEFAULT now()
);

CREATE TABLE public.piq_owner_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.piq_owners(id) ON DELETE CASCADE UNIQUE,
  total_properties int,
  total_sqft int,
  total_value numeric,
  states text[]
);

CREATE TABLE public.piq_code_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.piq_properties(id) ON DELETE CASCADE,
  violation_code text,
  description text,
  filed_date date,
  status text
);

CREATE TABLE public.piq_contractor_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.piq_properties(id) ON DELETE CASCADE,
  opportunity_type text,
  description text,
  priority text
);

CREATE TABLE public.piq_saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid REFERENCES public.piq_properties(id) ON DELETE CASCADE,
  list_name text DEFAULT 'Default',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id, list_name)
);

-- Enable RLS on all tables
ALTER TABLE public.piq_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_property_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_property_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_building_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_storm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_property_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_owner_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_code_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_contractor_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piq_saved_properties ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated can SELECT all piq_ tables
CREATE POLICY "Authenticated can read piq_properties" ON public.piq_properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_owners" ON public.piq_owners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_companies" ON public.piq_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_property_ownership" ON public.piq_property_ownership FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_property_sales" ON public.piq_property_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_permits" ON public.piq_permits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_building_components" ON public.piq_building_components FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_storm_events" ON public.piq_storm_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_property_scores" ON public.piq_property_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_owner_portfolios" ON public.piq_owner_portfolios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_code_violations" ON public.piq_code_violations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_contractor_opportunities" ON public.piq_contractor_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read piq_saved_properties" ON public.piq_saved_properties FOR SELECT TO authenticated USING (true);

-- RLS: saved_properties - own rows only for INSERT/UPDATE/DELETE
CREATE POLICY "Users can insert own saved properties" ON public.piq_saved_properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved properties" ON public.piq_saved_properties FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved properties" ON public.piq_saved_properties FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger for piq_properties
CREATE TRIGGER piq_properties_updated_at BEFORE UPDATE ON public.piq_properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
