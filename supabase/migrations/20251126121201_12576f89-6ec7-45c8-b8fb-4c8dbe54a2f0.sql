-- Drop the existing sales_rep-only insert policy
DROP POLICY IF EXISTS "Sales reps can create customers" ON public.customers;

-- Create a new policy that allows any authenticated user to create customers
-- where they set themselves as the assigned_rep_id
CREATE POLICY "Authenticated users can create their own customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (assigned_rep_id = auth.uid());