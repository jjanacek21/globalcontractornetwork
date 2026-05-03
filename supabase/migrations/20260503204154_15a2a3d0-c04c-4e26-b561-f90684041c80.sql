
-- ============ marketing_leads ============
DROP POLICY IF EXISTS "Authenticated users can view marketing leads" ON public.marketing_leads;
CREATE POLICY "Submitters and admins can view marketing leads"
ON public.marketing_leads FOR SELECT TO authenticated
USING (
  is_super_admin()
  OR (user_id IS NOT NULL AND user_id = auth.uid())
  OR (email_normalized IS NOT NULL AND email_normalized = lower(trim((auth.jwt() ->> 'email'))))
);

-- ============ piq_owners ============
DROP POLICY IF EXISTS "Authenticated can read piq_owners" ON public.piq_owners;
CREATE POLICY "Super admins can read piq_owners"
ON public.piq_owners FOR SELECT TO authenticated
USING (is_super_admin());

-- ============ piq_saved_properties ============
DROP POLICY IF EXISTS "Authenticated can read piq_saved_properties" ON public.piq_saved_properties;
CREATE POLICY "Users can view own saved properties"
ON public.piq_saved_properties FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- ============ user_roles ============
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- ============ contacts ============
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON public.contacts;

-- ============ leads ============
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;

-- ============ properties ============
DROP POLICY IF EXISTS "Authenticated users can view properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON public.properties;

-- ============ contact_communications ============
DROP POLICY IF EXISTS "Authenticated users can view contact_communications" ON public.contact_communications;
DROP POLICY IF EXISTS "Authenticated users can insert contact_communications" ON public.contact_communications;
DROP POLICY IF EXISTS "Authenticated users can delete contact_communications" ON public.contact_communications;
CREATE POLICY "Company members can view contact_communications"
ON public.contact_communications FOR SELECT TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can insert contact_communications"
ON public.contact_communications FOR INSERT TO authenticated
WITH CHECK (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can update contact_communications"
ON public.contact_communications FOR UPDATE TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company admins can delete contact_communications"
ON public.contact_communications FOR DELETE TO authenticated
USING (is_company_or_super_admin(company_id));

-- ============ contact_documents ============
DROP POLICY IF EXISTS "Authenticated users can view contact_documents" ON public.contact_documents;
DROP POLICY IF EXISTS "Authenticated users can insert contact_documents" ON public.contact_documents;
DROP POLICY IF EXISTS "Authenticated users can delete contact_documents" ON public.contact_documents;
CREATE POLICY "Company members can view contact_documents"
ON public.contact_documents FOR SELECT TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can insert contact_documents"
ON public.contact_documents FOR INSERT TO authenticated
WITH CHECK (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company admins can delete contact_documents"
ON public.contact_documents FOR DELETE TO authenticated
USING (is_company_or_super_admin(company_id));

-- ============ commission_rules ============
DROP POLICY IF EXISTS "Authenticated users can read commission_rules" ON public.commission_rules;
DROP POLICY IF EXISTS "Authenticated users can insert commission_rules" ON public.commission_rules;
DROP POLICY IF EXISTS "Authenticated users can update commission_rules" ON public.commission_rules;
DROP POLICY IF EXISTS "Authenticated users can delete commission_rules" ON public.commission_rules;
CREATE POLICY "Company members can view commission_rules"
ON public.commission_rules FOR SELECT TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company admins can insert commission_rules"
ON public.commission_rules FOR INSERT TO authenticated
WITH CHECK (is_company_or_super_admin(company_id));
CREATE POLICY "Company admins can update commission_rules"
ON public.commission_rules FOR UPDATE TO authenticated
USING (is_company_or_super_admin(company_id));
CREATE POLICY "Company admins can delete commission_rules"
ON public.commission_rules FOR DELETE TO authenticated
USING (is_company_or_super_admin(company_id));

-- ============ storm_events ============
DROP POLICY IF EXISTS "Auth users can read storm_events" ON public.storm_events;
DROP POLICY IF EXISTS "Auth users can insert storm_events" ON public.storm_events;
DROP POLICY IF EXISTS "Auth users can update storm_events" ON public.storm_events;
DROP POLICY IF EXISTS "Auth users can delete storm_events" ON public.storm_events;
CREATE POLICY "Company members can view storm_events"
ON public.storm_events FOR SELECT TO authenticated
USING (company_id IS NULL OR is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can insert storm_events"
ON public.storm_events FOR INSERT TO authenticated
WITH CHECK (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can update storm_events"
ON public.storm_events FOR UPDATE TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company admins can delete storm_events"
ON public.storm_events FOR DELETE TO authenticated
USING (is_company_or_super_admin(company_id));

-- ============ estimate_templates ============
DROP POLICY IF EXISTS "Authenticated users can view estimate_templates" ON public.estimate_templates;
DROP POLICY IF EXISTS "Authenticated users can insert estimate_templates" ON public.estimate_templates;
DROP POLICY IF EXISTS "Authenticated users can update estimate_templates" ON public.estimate_templates;
CREATE POLICY "Company members can view estimate_templates"
ON public.estimate_templates FOR SELECT TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can insert estimate_templates"
ON public.estimate_templates FOR INSERT TO authenticated
WITH CHECK (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can update estimate_templates"
ON public.estimate_templates FOR UPDATE TO authenticated
USING (is_company_member(company_id) OR is_super_admin());

-- ============ suppliers ============
DROP POLICY IF EXISTS "Authenticated users can read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;
CREATE POLICY "Company members can view suppliers"
ON public.suppliers FOR SELECT TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can insert suppliers"
ON public.suppliers FOR INSERT TO authenticated
WITH CHECK (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can update suppliers"
ON public.suppliers FOR UPDATE TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company admins can delete suppliers"
ON public.suppliers FOR DELETE TO authenticated
USING (is_company_or_super_admin(company_id));

-- ============ inspection_checklists ============
DROP POLICY IF EXISTS "Auth users can read inspection_checklists" ON public.inspection_checklists;
DROP POLICY IF EXISTS "Auth users can insert inspection_checklists" ON public.inspection_checklists;
DROP POLICY IF EXISTS "Auth users can update inspection_checklists" ON public.inspection_checklists;
DROP POLICY IF EXISTS "Auth users can delete inspection_checklists" ON public.inspection_checklists;
CREATE POLICY "Company members can view inspection_checklists"
ON public.inspection_checklists FOR SELECT TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can insert inspection_checklists"
ON public.inspection_checklists FOR INSERT TO authenticated
WITH CHECK (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can update inspection_checklists"
ON public.inspection_checklists FOR UPDATE TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company admins can delete inspection_checklists"
ON public.inspection_checklists FOR DELETE TO authenticated
USING (is_company_or_super_admin(company_id));

-- ============ automation_rules ============
DROP POLICY IF EXISTS "Auth users can read automation_rules" ON public.automation_rules;
DROP POLICY IF EXISTS "Auth users can insert automation_rules" ON public.automation_rules;
DROP POLICY IF EXISTS "Auth users can update automation_rules" ON public.automation_rules;
DROP POLICY IF EXISTS "Auth users can delete automation_rules" ON public.automation_rules;
CREATE POLICY "Company members can view automation_rules"
ON public.automation_rules FOR SELECT TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can insert automation_rules"
ON public.automation_rules FOR INSERT TO authenticated
WITH CHECK (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company members can update automation_rules"
ON public.automation_rules FOR UPDATE TO authenticated
USING (is_company_member(company_id) OR is_super_admin());
CREATE POLICY "Company admins can delete automation_rules"
ON public.automation_rules FOR DELETE TO authenticated
USING (is_company_or_super_admin(company_id));

-- ============ measurement_reports ============
DROP POLICY IF EXISTS "Public can view active reports" ON public.measurement_reports;

-- ============ field_properties ============
DROP POLICY IF EXISTS "Users can view all field properties" ON public.field_properties;

-- ============ storage: door-to-door-videos ============
DROP POLICY IF EXISTS "All users can view door to door videos in feed" ON storage.objects;

-- ============ storage: customer-documents (path-scoped) ============
DROP POLICY IF EXISTS "Users can view documents for accessible customers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents for accessible customers" ON storage.objects;
CREATE POLICY "Users can view docs for their accessible customers"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'customer-documents'
  AND EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (has_role(auth.uid(), 'admin'::app_role) OR c.assigned_rep_id = auth.uid())
  )
);
CREATE POLICY "Users can delete docs for their accessible customers"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'customer-documents'
  AND EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (has_role(auth.uid(), 'admin'::app_role) OR c.assigned_rep_id = auth.uid())
  )
);
