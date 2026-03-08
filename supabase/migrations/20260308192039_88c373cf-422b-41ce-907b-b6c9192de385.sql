-- Allow authenticated users to insert contacts even without company_id
CREATE POLICY "Authenticated users can insert contacts"
ON public.contacts FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update contacts they created
CREATE POLICY "Authenticated users can update own contacts"
ON public.contacts FOR UPDATE TO authenticated
USING (created_by_user_id = auth.uid() OR is_super_admin())
WITH CHECK (true);

-- Allow authenticated users to view contacts they created
CREATE POLICY "Users can view own contacts"
ON public.contacts FOR SELECT TO authenticated
USING (created_by_user_id = auth.uid());