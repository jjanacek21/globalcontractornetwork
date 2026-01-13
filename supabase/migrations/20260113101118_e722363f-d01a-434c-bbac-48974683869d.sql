-- Add referral fields to marketing_leads
ALTER TABLE marketing_leads 
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS referral_contractor_id UUID REFERENCES contractor_profiles(id);

-- Add referral fields to supplement_leads  
ALTER TABLE supplement_leads
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS referral_contractor_id UUID REFERENCES contractor_profiles(id);

-- Add referral fields to service_requests
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS referral_contractor_id UUID REFERENCES contractor_profiles(id);