-- Drop the problematic policy that allows NULL company_id bypass
DROP POLICY IF EXISTS "Company members can view their company customers" ON public.customers;

-- Ensure the secure policy exists with explicit NULL check
DROP POLICY IF EXISTS "Company members can view their company customers securely" ON public.customers;

CREATE POLICY "Company members can view their company customers securely"
ON public.customers
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR assigned_rep_id = auth.uid()
    OR (company_id IS NOT NULL AND is_company_member(company_id))
    OR is_super_admin()
  )
);