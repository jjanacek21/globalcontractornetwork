-- Fix the normalize_address function search_path
CREATE OR REPLACE FUNCTION normalize_address(addr TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(addr), '\s+', ' ', 'g'), '[^a-z0-9\s]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;