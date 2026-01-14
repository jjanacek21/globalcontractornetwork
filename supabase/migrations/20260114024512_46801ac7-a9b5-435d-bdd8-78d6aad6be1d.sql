-- Allow authenticated users to create a company during registration
-- They must set themselves as the created_by
CREATE POLICY "Authenticated users can create a company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Allow company creators to update their own company
CREATE POLICY "Company creators can update their company"
ON public.companies
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());