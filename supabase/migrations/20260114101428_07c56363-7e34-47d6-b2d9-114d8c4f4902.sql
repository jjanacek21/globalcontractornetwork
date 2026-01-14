-- Add super admin UPDATE/DELETE policies for all lead tables (using DROP IF EXISTS first)

-- Coating Leads
DROP POLICY IF EXISTS "Super admins can update coating_leads" ON coating_leads;
DROP POLICY IF EXISTS "Super admins can delete coating_leads" ON coating_leads;
CREATE POLICY "Super admins can update coating_leads" ON coating_leads FOR UPDATE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can delete coating_leads" ON coating_leads FOR DELETE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Window Leads
DROP POLICY IF EXISTS "Super admins can update window_leads" ON window_leads;
DROP POLICY IF EXISTS "Super admins can delete window_leads" ON window_leads;
CREATE POLICY "Super admins can update window_leads" ON window_leads FOR UPDATE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can delete window_leads" ON window_leads FOR DELETE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Supplement Leads
DROP POLICY IF EXISTS "Super admins can update supplement_leads" ON supplement_leads;
DROP POLICY IF EXISTS "Super admins can delete supplement_leads" ON supplement_leads;
CREATE POLICY "Super admins can update supplement_leads" ON supplement_leads FOR UPDATE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can delete supplement_leads" ON supplement_leads FOR DELETE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Permit Projects
DROP POLICY IF EXISTS "Super admins can update permit_projects" ON permit_projects;
DROP POLICY IF EXISTS "Super admins can delete permit_projects" ON permit_projects;
CREATE POLICY "Super admins can update permit_projects" ON permit_projects FOR UPDATE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can delete permit_projects" ON permit_projects FOR DELETE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Roofing Consultations
DROP POLICY IF EXISTS "Super admins can update roofing_consultations" ON roofing_consultations;
DROP POLICY IF EXISTS "Super admins can delete roofing_consultations" ON roofing_consultations;
CREATE POLICY "Super admins can update roofing_consultations" ON roofing_consultations FOR UPDATE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can delete roofing_consultations" ON roofing_consultations FOR DELETE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Contact Requests
DROP POLICY IF EXISTS "Super admins can update contact_requests" ON contact_requests;
DROP POLICY IF EXISTS "Super admins can delete contact_requests" ON contact_requests;
CREATE POLICY "Super admins can update contact_requests" ON contact_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can delete contact_requests" ON contact_requests FOR DELETE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Service Requests
DROP POLICY IF EXISTS "Super admins can update service_requests" ON service_requests;
DROP POLICY IF EXISTS "Super admins can delete service_requests" ON service_requests;
CREATE POLICY "Super admins can update service_requests" ON service_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can delete service_requests" ON service_requests FOR DELETE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Companies
DROP POLICY IF EXISTS "Super admins can update companies" ON companies;
DROP POLICY IF EXISTS "Super admins can delete companies" ON companies;
CREATE POLICY "Super admins can update companies" ON companies FOR UPDATE USING (is_super_admin());
CREATE POLICY "Super admins can delete companies" ON companies FOR DELETE USING (is_super_admin());

-- Contractor Profiles
DROP POLICY IF EXISTS "Super admins can update contractor_profiles" ON contractor_profiles;
DROP POLICY IF EXISTS "Super admins can delete contractor_profiles" ON contractor_profiles;
CREATE POLICY "Super admins can update contractor_profiles" ON contractor_profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can delete contractor_profiles" ON contractor_profiles FOR DELETE USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- User Gamification
DROP POLICY IF EXISTS "Super admins can manage user_gamification" ON user_gamification;
CREATE POLICY "Super admins can manage user_gamification" ON user_gamification FOR ALL USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Badges (don't need to create if already exists)
DROP POLICY IF EXISTS "Super admins can manage badges" ON badges;
CREATE POLICY "Super admins can manage badges" ON badges FOR ALL USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));