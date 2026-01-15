-- =============================================
-- PHASE 1: AI-POWERED PERMIT QUEENS DATABASE SCHEMA
-- =============================================

-- 1.1 Create permit_type enum
DO $$ BEGIN
  CREATE TYPE permit_type_enum AS ENUM (
    'roofing', 'windows_doors', 'fence', 'solar', 'hvac', 
    'electrical', 'plumbing', 'pool', 'demolition', 'addition', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1.2 Create permit_status enum for 7-stage pipeline
DO $$ BEGIN
  CREATE TYPE permit_pipeline_status AS ENUM (
    'intake', 'data_capture', 'docs_needed', 'packet_assembly', 
    'compliance_check', 'awaiting_payment', 'ready_to_submit', 
    'under_review', 'corrections_needed', 'approved_ready_to_pay', 'issued_closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1.3 Create document validation status enum
DO $$ BEGIN
  CREATE TYPE doc_validation_status AS ENUM (
    'pending', 'valid', 'invalid', 'needs_signature', 'needs_review'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1.4 Create payment status enum
DO $$ BEGIN
  CREATE TYPE permit_payment_status AS ENUM (
    'unpaid', 'pending', 'paid', 'refunded', 'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 2. EXPAND permit_projects TABLE
-- =============================================

-- Add new columns for AI-powered pipeline
ALTER TABLE permit_projects 
ADD COLUMN IF NOT EXISTS jurisdiction_county text,
ADD COLUMN IF NOT EXISTS permit_type text,
ADD COLUMN IF NOT EXISTS parcel_id text,
ADD COLUMN IF NOT EXISTS scope_description text,
ADD COLUMN IF NOT EXISTS structured_scope_json jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS valuation decimal(12,2),
ADD COLUMN IF NOT EXISTS owner_name text,
ADD COLUMN IF NOT EXISTS owner_email text,
ADD COLUMN IF NOT EXISTS owner_phone text,
ADD COLUMN IF NOT EXISTS license_numbers_json jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expedited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS after_hours boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fee_estimate decimal(10,2),
ADD COLUMN IF NOT EXISTS fee_actual decimal(10,2),
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_link text,
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS missing_items_json jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_analysis_json jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS complexity_tier text DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS completion_percentage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS packet_url text,
ADD COLUMN IF NOT EXISTS building_dept_id uuid REFERENCES permit_building_departments(id),
ADD COLUMN IF NOT EXISTS assigned_expediter_id uuid,
ADD COLUMN IF NOT EXISTS contractor_profile_id uuid REFERENCES contractor_profiles(id),
ADD COLUMN IF NOT EXISTS pipeline_status text DEFAULT 'intake';

-- =============================================
-- 3. EXPAND permit_project_documents TABLE
-- =============================================

ALTER TABLE permit_project_documents
ADD COLUMN IF NOT EXISTS extracted_text text,
ADD COLUMN IF NOT EXISTS ai_analysis_json jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS validation_notes text,
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- =============================================
-- 4. CREATE jurisdiction_rules TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS jurisdiction_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_dept_id uuid REFERENCES permit_building_departments(id) ON DELETE CASCADE,
  jurisdiction_name text NOT NULL,
  jurisdiction_county text NOT NULL,
  permit_type text NOT NULL,
  required_fields_json jsonb DEFAULT '["property_address", "owner_name", "scope_description", "valuation"]',
  required_documents_json jsonb DEFAULT '["signed_contract", "owner_authorization", "coi"]',
  common_rejection_reasons_json jsonb DEFAULT '[]',
  submission_method text DEFAULT 'portal',
  portal_url text,
  typical_turnaround_days integer DEFAULT 5,
  fee_rules text,
  hvhz_required boolean DEFAULT false,
  noa_required boolean DEFAULT false,
  wind_mitigation_required boolean DEFAULT false,
  special_requirements_json jsonb DEFAULT '[]',
  base_price decimal(10,2) DEFAULT 99.00,
  complexity_multiplier jsonb DEFAULT '{"basic": 1.0, "standard": 1.5, "complex": 2.0}',
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 5. CREATE permit_status_events TABLE (Audit Trail)
-- =============================================

CREATE TABLE IF NOT EXISTS permit_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_request_id uuid REFERENCES permit_projects(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 6. CREATE permit_notifications TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS permit_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  contractor_id uuid REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  permit_request_id uuid REFERENCES permit_projects(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'email',
  message_type text NOT NULL,
  message_title text,
  message_body text,
  sent_at timestamptz,
  status text DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 7. CREATE permit_messages TABLE (Chat/Comments)
-- =============================================

CREATE TABLE IF NOT EXISTS permit_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_request_id uuid REFERENCES permit_projects(id) ON DELETE CASCADE,
  user_id uuid,
  sender_name text,
  sender_role text DEFAULT 'contractor',
  message_type text DEFAULT 'comment',
  content text NOT NULL,
  attachments_json jsonb DEFAULT '[]',
  is_internal boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 8. CREATE permit_pricing_tiers TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS permit_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  base_price decimal(10,2) NOT NULL,
  criteria_json jsonb DEFAULT '{}',
  features_json jsonb DEFAULT '[]',
  turnaround_days integer DEFAULT 5,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 9. CREATE permit_addon_fees TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS permit_addon_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  is_percentage boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 10. ENABLE RLS ON NEW TABLES
-- =============================================

ALTER TABLE jurisdiction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_addon_fees ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 11. RLS POLICIES
-- =============================================

-- jurisdiction_rules: Public read, admin write
CREATE POLICY "Anyone can view jurisdiction rules" 
ON jurisdiction_rules FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage jurisdiction rules" 
ON jurisdiction_rules FOR ALL 
USING (public.is_super_admin());

-- permit_status_events: View own events or admin view all
CREATE POLICY "View own permit status events" 
ON permit_status_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM permit_projects pp 
    WHERE pp.id = permit_request_id 
    AND (pp.user_id = auth.uid() OR pp.contractor_profile_id = public.get_contractor_profile_id())
  )
  OR public.is_super_admin()
  OR EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid())
);

CREATE POLICY "System can insert status events" 
ON permit_status_events FOR INSERT 
WITH CHECK (true);

-- permit_notifications: View own notifications
CREATE POLICY "View own notifications" 
ON permit_notifications FOR SELECT 
USING (
  user_id = auth.uid() 
  OR contractor_id = public.get_contractor_profile_id()
  OR public.is_super_admin()
);

CREATE POLICY "System can manage notifications" 
ON permit_notifications FOR ALL 
USING (public.is_super_admin());

-- permit_messages: View messages for own permits
CREATE POLICY "View messages for own permits" 
ON permit_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM permit_projects pp 
    WHERE pp.id = permit_request_id 
    AND (pp.user_id = auth.uid() OR pp.contractor_profile_id = public.get_contractor_profile_id())
  )
  OR public.is_super_admin()
  OR EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Create messages for own permits" 
ON permit_messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM permit_projects pp 
    WHERE pp.id = permit_request_id 
    AND (pp.user_id = auth.uid() OR pp.contractor_profile_id = public.get_contractor_profile_id())
  )
  OR public.is_super_admin()
  OR EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid())
);

-- permit_pricing_tiers: Public read
CREATE POLICY "Anyone can view pricing tiers" 
ON permit_pricing_tiers FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage pricing tiers" 
ON permit_pricing_tiers FOR ALL 
USING (public.is_super_admin());

-- permit_addon_fees: Public read
CREATE POLICY "Anyone can view addon fees" 
ON permit_addon_fees FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage addon fees" 
ON permit_addon_fees FOR ALL 
USING (public.is_super_admin());

-- =============================================
-- 12. UPDATE permit_projects RLS for contractors
-- =============================================

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Contractors can view own permit requests" ON permit_projects;
DROP POLICY IF EXISTS "Contractors can create permit requests" ON permit_projects;
DROP POLICY IF EXISTS "Contractors can update own permit requests" ON permit_projects;

-- Contractors can view their own permit requests
CREATE POLICY "Contractors can view own permit requests" 
ON permit_projects FOR SELECT 
USING (
  user_id = auth.uid() 
  OR contractor_profile_id = public.get_contractor_profile_id()
  OR public.is_super_admin()
  OR EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid())
);

-- Contractors can create permit requests
CREATE POLICY "Contractors can create permit requests" 
ON permit_projects FOR INSERT 
WITH CHECK (
  contractor_profile_id = public.get_contractor_profile_id()
  OR public.is_super_admin()
);

-- Contractors can update their own permit requests
CREATE POLICY "Contractors can update own permit requests" 
ON permit_projects FOR UPDATE 
USING (
  contractor_profile_id = public.get_contractor_profile_id()
  OR public.is_super_admin()
  OR EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid())
);

-- =============================================
-- 13. CREATE TRIGGER FOR STATUS CHANGE LOGGING
-- =============================================

CREATE OR REPLACE FUNCTION log_permit_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status THEN
    INSERT INTO permit_status_events (permit_request_id, previous_status, new_status, created_by)
    VALUES (NEW.id, OLD.pipeline_status, NEW.pipeline_status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_permit_status_change ON permit_projects;
CREATE TRIGGER trigger_permit_status_change
  AFTER UPDATE ON permit_projects
  FOR EACH ROW
  EXECUTE FUNCTION log_permit_status_change();

-- =============================================
-- 14. INSERT SAMPLE PRICING TIERS
-- =============================================

INSERT INTO permit_pricing_tiers (name, code, description, base_price, criteria_json, features_json, turnaround_days, sort_order)
VALUES 
  ('Basic', 'basic', 'Simple permits - fences, minor repairs, small roofs', 99.00, 
   '{"max_valuation": 25000, "max_roof_squares": 30}',
   '["Standard processing", "Email support", "Document checklist", "AI compliance check"]',
   7, 1),
  ('Standard', 'standard', 'Standard permits - mid-size roofs, windows, HVAC', 199.00,
   '{"max_valuation": 75000, "max_roof_squares": 50}',
   '["Priority processing", "Phone support", "AI packet assembly", "Status notifications", "Expediter review"]',
   5, 2),
  ('Complex', 'complex', 'Complex permits - large roofs, solar, multi-trade, HVHZ zones', 349.00,
   '{"max_valuation": null, "hvhz": true, "multi_trade": true}',
   '["Rush processing", "Dedicated expediter", "Same-day submission", "Direct city liaison", "Re-submission included"]',
   2, 3)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 15. INSERT SAMPLE ADDON FEES
-- =============================================

INSERT INTO permit_addon_fees (name, code, description, price)
VALUES 
  ('After-Hours Submission', 'after_hours', 'Submit outside normal business hours', 75.00),
  ('Rush Processing', 'rush', 'Processing within 24 hours', 150.00),
  ('Document Preparation', 'doc_prep', 'Prepare missing required forms', 50.00),
  ('Re-submission', 'resubmit', 'Handle correction re-submissions', 75.00),
  ('NOC Recording', 'noc_recording', 'Record Notice of Commencement', 45.00),
  ('Engineer Review Coordination', 'engineer', 'Coordinate with structural engineer', 125.00)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 16. INSERT SAMPLE JURISDICTION RULES
-- =============================================

-- Get building dept IDs for sample data (will use NULL if not found)
INSERT INTO jurisdiction_rules (jurisdiction_name, jurisdiction_county, permit_type, required_fields_json, required_documents_json, hvhz_required, noa_required, base_price, typical_turnaround_days, submission_method, notes)
VALUES 
  ('Miami-Dade County', 'Miami-Dade', 'roofing',
   '["property_address", "owner_name", "owner_email", "valuation", "roof_squares", "roof_type", "deck_type"]',
   '["signed_contract", "owner_authorization", "coi", "noa_approval", "product_approval", "roof_layout", "photos"]',
   true, true, 149.00, 7, 'portal',
   'HVHZ zone - requires NOA and Miami-Dade product approvals. All fasteners must be documented.'),
   
  ('Broward County', 'Broward', 'roofing',
   '["property_address", "owner_name", "valuation", "roof_squares", "roof_type"]',
   '["signed_contract", "owner_authorization", "coi", "wind_mitigation", "product_approval", "photos"]',
   false, false, 129.00, 5, 'portal',
   'Wind mitigation form required for insurance. Product approvals from Florida Building Code.'),
   
  ('Palm Beach County', 'Palm Beach', 'roofing',
   '["property_address", "owner_name", "valuation", "roof_squares"]',
   '["signed_contract", "owner_authorization", "coi", "photos"]',
   false, false, 99.00, 5, 'portal',
   'Standard requirements. Check for historic district restrictions.'),
   
  ('City of Miami', 'Miami-Dade', 'windows_doors',
   '["property_address", "owner_name", "valuation", "window_count", "door_count", "impact_rated"]',
   '["signed_contract", "owner_authorization", "coi", "product_approval", "energy_calculations", "noa_approval"]',
   true, true, 179.00, 10, 'portal',
   'Impact-rated products required. Energy calculations mandatory for replacements.'),
   
  ('Fort Lauderdale', 'Broward', 'roofing',
   '["property_address", "owner_name", "valuation", "roof_squares", "building_year"]',
   '["signed_contract", "owner_authorization", "coi", "photos", "asbestos_survey"]',
   false, false, 139.00, 5, 'portal',
   'Asbestos survey required for buildings pre-1980. Tree permit may be needed for access.')
ON CONFLICT DO NOTHING;

-- =============================================
-- 17. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_permit_projects_contractor ON permit_projects(contractor_profile_id);
CREATE INDEX IF NOT EXISTS idx_permit_projects_pipeline_status ON permit_projects(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_permit_projects_building_dept ON permit_projects(building_dept_id);
CREATE INDEX IF NOT EXISTS idx_permit_status_events_request ON permit_status_events(permit_request_id);
CREATE INDEX IF NOT EXISTS idx_permit_notifications_contractor ON permit_notifications(contractor_id);
CREATE INDEX IF NOT EXISTS idx_permit_messages_request ON permit_messages(permit_request_id);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_rules_lookup ON jurisdiction_rules(jurisdiction_county, permit_type);