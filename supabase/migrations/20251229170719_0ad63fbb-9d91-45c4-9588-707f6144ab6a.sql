-- Add columns for user adjustments, mixed roof detection, roof age, and photo uploads
ALTER TABLE public.roof_analysis_cache 
ADD COLUMN IF NOT EXISTS user_adjusted_sqft numeric,
ADD COLUMN IF NOT EXISTS user_adjusted_squares numeric,
ADD COLUMN IF NOT EXISTS has_mixed_roof boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS shingle_section_sqft numeric,
ADD COLUMN IF NOT EXISTS shingle_section_color text,
ADD COLUMN IF NOT EXISTS flat_section_sqft numeric,
ADD COLUMN IF NOT EXISTS flat_section_color text,
ADD COLUMN IF NOT EXISTS estimated_roof_age_years integer,
ADD COLUMN IF NOT EXISTS roof_age_confidence text,
ADD COLUMN IF NOT EXISTS degradation_notes text;

-- Create table for customer photo uploads
CREATE TABLE IF NOT EXISTS public.roof_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_id uuid REFERENCES public.roof_analysis_cache(id) ON DELETE CASCADE,
  address text NOT NULL,
  normalized_address text NOT NULL,
  photo_url text NOT NULL,
  photo_type text DEFAULT 'customer_upload',
  analysis_result jsonb,
  detected_color text,
  detected_condition text,
  detected_material text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on roof_photos
ALTER TABLE public.roof_photos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to upload photos (public feature)
CREATE POLICY "Anyone can upload roof photos"
ON public.roof_photos
FOR INSERT
WITH CHECK (true);

-- Allow anyone to view photos
CREATE POLICY "Anyone can view roof photos"
ON public.roof_photos
FOR SELECT
USING (true);

-- Super admins can manage all photos
CREATE POLICY "Super admins can manage roof photos"
ON public.roof_photos
FOR ALL
USING (is_super_admin());