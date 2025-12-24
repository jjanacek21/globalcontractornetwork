-- Security Fix: Complete remaining RLS policies

-- Drop existing policies that may conflict and recreate
DROP POLICY IF EXISTS "Authenticated users can create field properties" ON public.field_properties;
DROP POLICY IF EXISTS "Users can update their own field properties" ON public.field_properties;
DROP POLICY IF EXISTS "Super admins can delete field properties" ON public.field_properties;

CREATE POLICY "Authenticated users can create field properties" 
ON public.field_properties 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their own field properties" 
ON public.field_properties 
FOR UPDATE 
USING (created_by = auth.uid() OR is_super_admin());

CREATE POLICY "Super admins can delete field properties" 
ON public.field_properties 
FOR DELETE 
USING (is_super_admin());

-- 3. Fix user_roles table
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can only insert sales_rep role for themselves" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Super admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (is_super_admin());

-- Prevent users from inserting admin roles for themselves
CREATE POLICY "Users can only insert sales_rep role for themselves" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'sales_rep'::app_role
);

-- 4. Fix customers table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;

CREATE POLICY "Authenticated users can view customers" 
ON public.customers 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR assigned_rep_id = auth.uid()
    OR company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
  )
);