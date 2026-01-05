-- Phase 2: Database Schema Enhancements

-- 2.1: Add email_normalized and role to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_normalized text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'homeowner';

-- Create unique index for email_normalized (partial to handle nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_normalized 
ON profiles(email_normalized) WHERE email_normalized IS NOT NULL;

-- Backfill existing records
UPDATE profiles 
SET email_normalized = LOWER(TRIM(email)) 
WHERE email IS NOT NULL AND email_normalized IS NULL;

-- Create trigger function to auto-normalize email on insert/update
CREATE OR REPLACE FUNCTION normalize_profile_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email_normalized := LOWER(TRIM(NEW.email));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS tr_profiles_normalize_email ON profiles;
CREATE TRIGGER tr_profiles_normalize_email
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION normalize_profile_email();

-- 2.2: Add linking columns to submission tables

-- coating_leads
ALTER TABLE coating_leads 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS email_normalized text;

UPDATE coating_leads 
SET email_normalized = LOWER(TRIM(email)) 
WHERE email IS NOT NULL AND email_normalized IS NULL;

CREATE INDEX IF NOT EXISTS idx_coating_leads_user_id ON coating_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_coating_leads_email_normalized ON coating_leads(email_normalized);

-- window_leads
ALTER TABLE window_leads 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS email_normalized text;

UPDATE window_leads 
SET email_normalized = LOWER(TRIM(email)) 
WHERE email IS NOT NULL AND email_normalized IS NULL;

CREATE INDEX IF NOT EXISTS idx_window_leads_user_id ON window_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_window_leads_email_normalized ON window_leads(email_normalized);

-- roofing_consultations
ALTER TABLE roofing_consultations 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS email_normalized text;

UPDATE roofing_consultations 
SET email_normalized = LOWER(TRIM(customer_email)) 
WHERE customer_email IS NOT NULL AND email_normalized IS NULL;

CREATE INDEX IF NOT EXISTS idx_roofing_consultations_user_id ON roofing_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_roofing_consultations_email_normalized ON roofing_consultations(email_normalized);

-- contact_requests
ALTER TABLE contact_requests 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS email_normalized text;

UPDATE contact_requests 
SET email_normalized = LOWER(TRIM(email)) 
WHERE email IS NOT NULL AND email_normalized IS NULL;

CREATE INDEX IF NOT EXISTS idx_contact_requests_user_id ON contact_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_email_normalized ON contact_requests(email_normalized);

-- service_requests
ALTER TABLE service_requests 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS email_normalized text;

UPDATE service_requests 
SET email_normalized = LOWER(TRIM(email)) 
WHERE email IS NOT NULL AND email_normalized IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_email_normalized ON service_requests(email_normalized);

-- marketing_leads
ALTER TABLE marketing_leads 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS email_normalized text;

UPDATE marketing_leads 
SET email_normalized = LOWER(TRIM(email)) 
WHERE email IS NOT NULL AND email_normalized IS NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_leads_user_id ON marketing_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_email_normalized ON marketing_leads(email_normalized);

-- 2.3: Create trigger to auto-link submissions on signup
CREATE OR REPLACE FUNCTION link_submissions_on_signup()
RETURNS trigger AS $$
DECLARE
  normalized_email text;
BEGIN
  normalized_email := LOWER(TRIM(NEW.email));
  
  -- Auto-link submissions when user signs up with matching email
  UPDATE coating_leads 
  SET user_id = NEW.id 
  WHERE email_normalized = normalized_email AND user_id IS NULL;
  
  UPDATE window_leads 
  SET user_id = NEW.id 
  WHERE email_normalized = normalized_email AND user_id IS NULL;
  
  UPDATE roofing_consultations 
  SET user_id = NEW.id 
  WHERE email_normalized = normalized_email AND user_id IS NULL;
  
  UPDATE contact_requests 
  SET user_id = NEW.id 
  WHERE email_normalized = normalized_email AND user_id IS NULL;
  
  UPDATE service_requests 
  SET user_id = NEW.id 
  WHERE email_normalized = normalized_email AND user_id IS NULL;
  
  UPDATE marketing_leads 
  SET user_id = NEW.id 
  WHERE email_normalized = normalized_email AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_auto_link_on_profile_create ON profiles;
CREATE TRIGGER tr_auto_link_on_profile_create
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION link_submissions_on_signup();