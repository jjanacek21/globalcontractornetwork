-- Create new enums for CRM
CREATE TYPE lead_status AS ENUM (
  'new',
  'contact_made', 
  'inspection_scheduled',
  'inspected',
  'estimate_sent',
  'negotiating',
  'closed_won',
  'closed_lost',
  'no_deal'
);

CREATE TYPE lead_type AS ENUM ('retail', 'insurance');

CREATE TYPE contact_source AS ENUM (
  'canvass', 'web_form', 'referral', 'inbound_call', 
  'door_hanger', 'social_media', 'advertisement', 'other'
);

CREATE TYPE property_type AS ENUM (
  'residential', 'commercial', 'multifamily', 'hoa'
);

CREATE TYPE roof_type AS ENUM (
  'shingle', 'tile', 'metal', 'flat', 'coating_candidate', 'other'
);

CREATE TYPE inspection_recommendation AS ENUM (
  'repair', 'partial_replacement', 'full_replacement', 'coating', 'no_action'
);

CREATE TYPE contact_method AS ENUM ('call', 'text', 'email');

-- Create contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  spouse_first_name TEXT,
  spouse_last_name TEXT,
  primary_phone TEXT,
  secondary_phone TEXT,
  email TEXT,
  preferred_contact_method contact_method DEFAULT 'call',
  source contact_source,
  source_details TEXT,
  created_by_user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'contact',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT,
  state TEXT DEFAULT 'FL',
  zip TEXT,
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  mapbox_place_id TEXT,
  property_type property_type DEFAULT 'residential',
  year_built INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create insurance_profiles table
CREATE TABLE insurance_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  insurance_carrier TEXT,
  policy_number TEXT,
  claim_number TEXT,
  date_of_loss DATE,
  deductible_amount NUMERIC(10, 2),
  coverage_type TEXT,
  agent_name TEXT,
  agent_phone TEXT,
  agent_email TEXT,
  adjuster_name TEXT,
  adjuster_phone TEXT,
  adjuster_email TEXT,
  acv_amount NUMERIC(12, 2),
  rcv_amount NUMERIC(12, 2),
  recoverable_depreciation NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  assigned_rep_id UUID REFERENCES company_members(id),
  lead_type lead_type NOT NULL DEFAULT 'retail',
  status lead_status DEFAULT 'new',
  source contact_source,
  qualification_notes TEXT,
  expected_value NUMERIC(12, 2),
  closed_at TIMESTAMPTZ,
  closed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create inspections table
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  inspector_id UUID REFERENCES company_members(id),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  roof_type roof_type,
  damage_types JSONB,
  summary TEXT,
  recommendation inspection_recommendation,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create contingencies table
CREATE TABLE contingencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  file_path TEXT,
  signed_at TIMESTAMPTZ,
  verified_by_user_id UUID REFERENCES profiles(id),
  terms_summary TEXT,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create trades table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default trades
INSERT INTO trades (name, icon, sort_order) VALUES
  ('Roofing', 'home', 1),
  ('Gutters', 'droplets', 2),
  ('Solar', 'sun', 3),
  ('Coatings', 'paintbrush', 4),
  ('Siding', 'square', 5),
  ('Windows', 'app-window', 6),
  ('Paint', 'palette', 7),
  ('Waterproofing', 'umbrella', 8);

-- Create catalog_items table
CREATE TABLE catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  unit_of_measure TEXT NOT NULL,
  unit_cost NUMERIC(10, 2),
  unit_price NUMERIC(10, 2),
  markup_percent NUMERIC(5, 2),
  is_taxable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create activities table (activity feed)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create polymorphic notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  author_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create polymorphic files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  document_category TEXT,
  uploaded_by_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create estimate_packages table
CREATE TABLE estimate_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB,
  total NUMERIC(12, 2),
  is_recommended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE contingencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Company members can view contacts" ON contacts
  FOR SELECT USING (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company members can create contacts" ON contacts
  FOR INSERT WITH CHECK (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company members can update contacts" ON contacts
  FOR UPDATE USING (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company admins can delete contacts" ON contacts
  FOR DELETE USING (is_company_or_super_admin(company_id));

-- RLS Policies for properties
CREATE POLICY "Company members can view properties" ON properties
  FOR SELECT USING (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company members can create properties" ON properties
  FOR INSERT WITH CHECK (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company members can update properties" ON properties
  FOR UPDATE USING (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company admins can delete properties" ON properties
  FOR DELETE USING (is_company_or_super_admin(company_id));

-- RLS Policies for insurance_profiles
CREATE POLICY "View insurance profiles via property" ON insurance_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = insurance_profiles.property_id 
      AND (is_company_member(p.company_id) OR is_super_admin())
    )
  );

CREATE POLICY "Create insurance profiles" ON insurance_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = insurance_profiles.property_id 
      AND (is_company_member(p.company_id) OR is_super_admin())
    )
  );

CREATE POLICY "Update insurance profiles" ON insurance_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = insurance_profiles.property_id 
      AND (is_company_member(p.company_id) OR is_super_admin())
    )
  );

-- RLS Policies for leads
CREATE POLICY "Company members can view leads" ON leads
  FOR SELECT USING (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company members can create leads" ON leads
  FOR INSERT WITH CHECK (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company members can update leads" ON leads
  FOR UPDATE USING (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company admins can delete leads" ON leads
  FOR DELETE USING (is_company_or_super_admin(company_id));

-- RLS Policies for inspections
CREATE POLICY "View inspections via lead" ON inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = inspections.lead_id 
      AND (is_company_member(l.company_id) OR is_super_admin())
    )
  );

CREATE POLICY "Create inspections" ON inspections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = inspections.lead_id 
      AND (is_company_member(l.company_id) OR is_super_admin())
    )
  );

CREATE POLICY "Update inspections" ON inspections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = inspections.lead_id 
      AND (is_company_member(l.company_id) OR is_super_admin())
    )
  );

-- RLS Policies for contingencies
CREATE POLICY "View contingencies via lead" ON contingencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = contingencies.lead_id 
      AND (is_company_member(l.company_id) OR is_super_admin())
    )
  );

CREATE POLICY "Create contingencies" ON contingencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = contingencies.lead_id 
      AND (is_company_member(l.company_id) OR is_super_admin())
    )
  );

-- RLS Policies for trades (viewable by all authenticated, manageable by admins)
CREATE POLICY "Anyone can view active trades" ON trades
  FOR SELECT USING (is_active = true OR is_super_admin());

CREATE POLICY "Super admins can manage trades" ON trades
  FOR ALL USING (is_super_admin());

-- RLS Policies for catalog_items
CREATE POLICY "Anyone can view active catalog items" ON catalog_items
  FOR SELECT USING (is_active = true OR is_super_admin());

CREATE POLICY "Super admins can manage catalog items" ON catalog_items
  FOR ALL USING (is_super_admin());

-- RLS Policies for activities
CREATE POLICY "Company members can view activities" ON activities
  FOR SELECT USING (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company members can create activities" ON activities
  FOR INSERT WITH CHECK (is_company_member(company_id) OR is_super_admin());

-- RLS Policies for notes (polymorphic - check based on entity)
CREATE POLICY "Authenticated users can view notes" ON notes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = author_user_id);

CREATE POLICY "Authors can update their notes" ON notes
  FOR UPDATE USING (auth.uid() = author_user_id);

CREATE POLICY "Authors can delete their notes" ON notes
  FOR DELETE USING (auth.uid() = author_user_id OR is_super_admin());

-- RLS Policies for files
CREATE POLICY "Company members can view files" ON files
  FOR SELECT USING (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company members can upload files" ON files
  FOR INSERT WITH CHECK (is_company_member(company_id) OR is_super_admin());

CREATE POLICY "Company admins can delete files" ON files
  FOR DELETE USING (is_company_or_super_admin(company_id));

-- RLS Policies for estimate_packages
CREATE POLICY "View estimate packages via estimate" ON estimate_packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM estimates e
      JOIN customers c ON e.customer_id = c.id
      WHERE e.id = estimate_packages.estimate_id
      AND (has_role(auth.uid(), 'admin') OR c.assigned_rep_id = auth.uid())
    )
  );

CREATE POLICY "Manage estimate packages" ON estimate_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM estimates e
      JOIN customers c ON e.customer_id = c.id
      WHERE e.id = estimate_packages.estimate_id
      AND (has_role(auth.uid(), 'admin') OR c.assigned_rep_id = auth.uid())
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_profiles_updated_at BEFORE UPDATE ON insurance_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalog_items_updated_at BEFORE UPDATE ON catalog_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();