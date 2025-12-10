
-- Create roofing_admins table for admin access control
CREATE TABLE IF NOT EXISTS public.roofing_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on roofing_admins
ALTER TABLE public.roofing_admins ENABLE ROW LEVEL SECURITY;

-- Admins can view their own admin record
CREATE POLICY "Roofing admins can view own record"
ON public.roofing_admins
FOR SELECT
USING (auth.uid() = user_id);

-- Add RLS policy for roofing_consultations so admins can view all
CREATE POLICY "Roofing admins can view all consultations"
ON public.roofing_consultations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.roofing_admins
    WHERE roofing_admins.user_id = auth.uid()
  )
);

-- Admins can update consultations
CREATE POLICY "Roofing admins can update consultations"
ON public.roofing_consultations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.roofing_admins
    WHERE roofing_admins.user_id = auth.uid()
  )
);

-- Add new columns to coating_leads for spin wheel feature
ALTER TABLE public.coating_leads
ADD COLUMN IF NOT EXISTS discount_percent integer,
ADD COLUMN IF NOT EXISTS discounted_price numeric,
ADD COLUMN IF NOT EXISTS roof_age text,
ADD COLUMN IF NOT EXISTS roof_condition text,
ADD COLUMN IF NOT EXISTS appointment_date date,
ADD COLUMN IF NOT EXISTS appointment_time text,
ADD COLUMN IF NOT EXISTS show_as_winner boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS testimonial_text text;

-- Create policy for public to view winners
CREATE POLICY "Anyone can view coating winners"
ON public.coating_leads
FOR SELECT
USING (show_as_winner = true);

-- Create coating_admins table for Coating Kings admin access
CREATE TABLE IF NOT EXISTS public.coating_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on coating_admins
ALTER TABLE public.coating_admins ENABLE ROW LEVEL SECURITY;

-- Coating admins can view their own admin record
CREATE POLICY "Coating admins can view own record"
ON public.coating_admins
FOR SELECT
USING (auth.uid() = user_id);

-- Coating admins can view all coating leads
CREATE POLICY "Coating admins can view all leads"
ON public.coating_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coating_admins
    WHERE coating_admins.user_id = auth.uid()
  )
);

-- Coating admins can update leads
CREATE POLICY "Coating admins can update leads"
ON public.coating_leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.coating_admins
    WHERE coating_admins.user_id = auth.uid()
  )
);
