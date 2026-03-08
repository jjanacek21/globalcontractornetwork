-- Allow authenticated users to insert properties (even without company_id)
CREATE POLICY "Authenticated users can insert properties"
ON public.properties FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to view properties they created via contacts
CREATE POLICY "Authenticated users can view own contact properties"
ON public.properties FOR SELECT TO authenticated
USING (
  contact_id IN (
    SELECT id FROM public.contacts WHERE created_by_user_id = auth.uid()
  )
  OR is_company_member(company_id)
  OR is_super_admin()
);

-- Allow authenticated users to update properties for their contacts
CREATE POLICY "Authenticated users can update own contact properties"
ON public.properties FOR UPDATE TO authenticated
USING (
  contact_id IN (
    SELECT id FROM public.contacts WHERE created_by_user_id = auth.uid()
  )
  OR is_company_member(company_id)
  OR is_super_admin()
)
WITH CHECK (true);

-- Add leads policies if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Authenticated users can view leads') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT TO authenticated USING (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Authenticated users can insert leads') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;