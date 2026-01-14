-- Add DELETE policy for super admins on profiles table
CREATE POLICY "Super admins can delete profiles"
ON public.profiles
FOR DELETE
TO public
USING (is_super_admin());