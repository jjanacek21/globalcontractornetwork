-- Add missing columns and configure the existing property_cache table
ALTER TABLE property_cache ADD COLUMN IF NOT EXISTS address_normalized TEXT;
ALTER TABLE property_cache ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_property_cache_folio_county ON property_cache (folio, county);
CREATE INDEX IF NOT EXISTS idx_property_cache_address_normalized ON property_cache (address_normalized);

-- Add unique constraint if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'property_cache_unique'
  ) THEN
    ALTER TABLE property_cache ADD CONSTRAINT property_cache_unique UNIQUE (folio, county);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE property_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Allow read access to property cache" ON property_cache;
DROP POLICY IF EXISTS "Allow service role to manage property cache" ON property_cache;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to property cache" 
  ON property_cache FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow service role to manage cache
CREATE POLICY "Allow service role to manage property cache" 
  ON property_cache FOR ALL 
  TO service_role 
  USING (true)
  WITH CHECK (true);

-- Add trigger for updating updated_at timestamp (drop first if exists)
DROP TRIGGER IF EXISTS update_property_cache_updated_at ON property_cache;
CREATE TRIGGER update_property_cache_updated_at
  BEFORE UPDATE ON property_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();