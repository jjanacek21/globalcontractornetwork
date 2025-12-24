-- Fix contractor_profiles: Restrict to authenticated users and owners
DROP POLICY IF EXISTS "Anyone can view contractor profiles" ON public.contractor_profiles;
DROP POLICY IF EXISTS "Public can view verified contractors" ON public.contractor_profiles;
DROP POLICY IF EXISTS "Contractor profiles are publicly viewable" ON public.contractor_profiles;

-- Allow contractors to manage their own profile
CREATE POLICY "Contractors can view own profile"
ON public.contractor_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Contractors can update own profile"
ON public.contractor_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Contractors can insert own profile"
ON public.contractor_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view verified contractors only (for directory)
CREATE POLICY "Authenticated users can view verified contractors"
ON public.contractor_profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_verified = true);

-- Super admins can view all
CREATE POLICY "Super admins can view all contractor profiles"
ON public.contractor_profiles
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can manage all contractor profiles"
ON public.contractor_profiles
FOR ALL
USING (is_super_admin());

-- Fix field_properties: Restrict to company members only
DROP POLICY IF EXISTS "Anyone can view field properties" ON public.field_properties;
DROP POLICY IF EXISTS "Field properties are publicly viewable" ON public.field_properties;
DROP POLICY IF EXISTS "Public can view field properties" ON public.field_properties;

-- Only authenticated users who created the property can view it
CREATE POLICY "Users can view own field properties"
ON public.field_properties
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own field properties"
ON public.field_properties
FOR ALL
USING (auth.uid() = created_by);

-- Super admins can view all
CREATE POLICY "Super admins can view all field properties"
ON public.field_properties
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can manage all field properties"
ON public.field_properties
FOR ALL
USING (is_super_admin());