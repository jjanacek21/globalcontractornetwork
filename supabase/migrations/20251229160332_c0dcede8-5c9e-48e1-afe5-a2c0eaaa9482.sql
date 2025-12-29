-- Create table to cache roof analysis results
CREATE TABLE public.roof_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  normalized_address TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  flat_sqft NUMERIC NOT NULL,
  adjusted_sqft NUMERIC,
  total_squares NUMERIC,
  roof_complexity TEXT DEFAULT 'gable',
  roof_shape TEXT,
  confidence TEXT DEFAULT 'medium',
  methodology TEXT,
  satellite_image_url TEXT,
  pitch_factor NUMERIC DEFAULT 1.1,
  complexity_factor NUMERIC DEFAULT 1.10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '90 days')
);

-- Create index for fast address lookups
CREATE INDEX idx_roof_analysis_normalized_address ON public.roof_analysis_cache (normalized_address);
CREATE INDEX idx_roof_analysis_coords ON public.roof_analysis_cache (latitude, longitude);

-- Enable RLS
ALTER TABLE public.roof_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached measurements (public data for better UX)
CREATE POLICY "Anyone can view cached measurements"
ON public.roof_analysis_cache
FOR SELECT
USING (true);

-- Allow anyone to insert cached measurements (unauthenticated visitors)
CREATE POLICY "Anyone can cache measurements"
ON public.roof_analysis_cache
FOR INSERT
WITH CHECK (true);

-- Super admins can manage all cache entries
CREATE POLICY "Super admins can manage cache"
ON public.roof_analysis_cache
FOR ALL
USING (is_super_admin());

-- Create function to normalize addresses for matching
CREATE OR REPLACE FUNCTION normalize_address(addr TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(addr), '\s+', ' ', 'g'), '[^a-z0-9\s]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to update updated_at
CREATE TRIGGER update_roof_analysis_cache_updated_at
BEFORE UPDATE ON public.roof_analysis_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();