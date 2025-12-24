-- Drop the existing overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a restrictive policy: users can only view their own profile
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow super admins and company admins to view profiles of their company members
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Company admins can view company member profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm1
    WHERE cm1.user_id = auth.uid()
    AND cm1.role = 'company_admin'
    AND cm1.is_active = true
    AND EXISTS (
      SELECT 1 FROM public.company_members cm2
      WHERE cm2.user_id = profiles.id
      AND cm2.company_id = cm1.company_id
    )
  )
);