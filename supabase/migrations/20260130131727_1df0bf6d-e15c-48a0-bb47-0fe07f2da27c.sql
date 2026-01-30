-- Add INSERT policy for permit admins to import NOA records
CREATE POLICY "Permit admins can insert product approvals"
ON public.product_approvals FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.permit_admins
    WHERE user_id = auth.uid()
  )
);

-- Also add UPDATE policy for upsert operations
CREATE POLICY "Permit admins can update product approvals"
ON public.product_approvals FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.permit_admins
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.permit_admins
    WHERE user_id = auth.uid()
  )
);