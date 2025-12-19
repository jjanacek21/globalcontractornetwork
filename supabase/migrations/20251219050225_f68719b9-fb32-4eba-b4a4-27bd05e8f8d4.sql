-- Create super_admins table for Master Admin Hub
CREATE TABLE public.super_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins to view their own record
CREATE POLICY "Super admins can view own record"
ON public.super_admins
FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS policies on lead tables for super admin access

-- coating_leads: Allow super admins to view all
CREATE POLICY "Super admins can view all coating leads"
ON public.coating_leads
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));

-- roofing_consultations: Allow super admins to view all
CREATE POLICY "Super admins can view all roofing consultations"
ON public.roofing_consultations
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));

-- supplement_leads: Allow super admins to view all
CREATE POLICY "Super admins can view all supplement leads"
ON public.supplement_leads
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));

-- permit_projects: Super admins already have access via permit_admins, but adding explicit policy
CREATE POLICY "Super admins can view all permit projects"
ON public.permit_projects
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));

-- contact_requests: Allow super admins to view all
CREATE POLICY "Super admins can view all contact requests"
ON public.contact_requests
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));

-- service_requests: Allow super admins to view all
CREATE POLICY "Super admins can view all service requests"
ON public.service_requests
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));

-- course_enrollments: Allow super admins to view all
CREATE POLICY "Super admins can view all course enrollments"
ON public.course_enrollments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));

-- store_members: Allow super admins to view all
CREATE POLICY "Super admins can view all store members"
ON public.store_members
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));

-- contractor_profiles: Already public, no change needed

-- supplement_contractors: Allow super admins to view all (in addition to existing policies)
CREATE POLICY "Super admins can view all supplement contractors"
ON public.supplement_contractors
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));

-- permit_contractors: Allow super admins to view all (in addition to existing policies)
CREATE POLICY "Super admins can view all permit contractors"
ON public.permit_contractors
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM super_admins WHERE user_id = auth.uid()
));