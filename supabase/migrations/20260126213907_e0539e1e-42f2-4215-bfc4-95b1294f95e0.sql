-- Create property_cache table for caching property appraiser lookups
CREATE TABLE IF NOT EXISTS public.property_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT NOT NULL,
  county TEXT NOT NULL,
  property_data JSONB NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(folio, county)
);

-- Enable RLS
ALTER TABLE public.property_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access to property cache"
ON public.property_cache FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert for property cache"
ON public.property_cache FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_property_cache_folio ON public.property_cache(folio);
CREATE INDEX idx_property_cache_county ON public.property_cache(county);

-- Create license_verifications table for caching DBPR lookups
CREATE TABLE IF NOT EXISTS public.license_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_number TEXT NOT NULL UNIQUE,
  license_type TEXT,
  license_data JSONB NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  concerns TEXT[],
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.license_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access to license verifications"
ON public.license_verifications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert for license verifications"
ON public.license_verifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update for license verifications"
ON public.license_verifications FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_license_verifications_number ON public.license_verifications(license_number);
CREATE INDEX idx_license_verifications_valid ON public.license_verifications(is_valid);

-- Create trigger for updated_at
CREATE TRIGGER update_license_verifications_timestamp
BEFORE UPDATE ON public.license_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();