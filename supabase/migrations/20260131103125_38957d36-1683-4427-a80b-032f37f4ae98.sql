-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Permit admins can insert product approvals" ON public.product_approvals;
DROP POLICY IF EXISTS "Permit admins can update product approvals" ON public.product_approvals;

-- Create a security definer function to check permit admin status
CREATE OR REPLACE FUNCTION public.is_permit_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.permit_admins
    WHERE user_id = auth.uid()
  )
$$;

-- Allow permit admins to insert product approvals
CREATE POLICY "Permit admins can insert product approvals"
ON public.product_approvals FOR INSERT
TO authenticated
WITH CHECK (public.is_permit_admin());

-- Allow permit admins to update product approvals
CREATE POLICY "Permit admins can update product approvals"
ON public.product_approvals FOR UPDATE
TO authenticated
USING (public.is_permit_admin())
WITH CHECK (public.is_permit_admin());