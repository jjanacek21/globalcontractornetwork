-- =====================================================
-- Phase 1: Company Registration & Admin Portal Schema
-- =====================================================

-- 1. Extend companies table with verification and profile fields
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS services_offered TEXT[],
ADD COLUMN IF NOT EXISTS primary_category TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS bio_short TEXT,
ADD COLUMN IF NOT EXISTS bio_long TEXT,
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS yearly_revenue_range TEXT,
ADD COLUMN IF NOT EXISTS years_in_business INTEGER,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS license_state TEXT,
ADD COLUMN IF NOT EXISTS license_expiration DATE,
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
ADD COLUMN IF NOT EXISTS insurance_expiration DATE,
ADD COLUMN IF NOT EXISTS workers_comp_provider TEXT,
ADD COLUMN IF NOT EXISTS workers_comp_expiration DATE,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS job_photos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS client_references JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID,
ADD COLUMN IF NOT EXISTS min_contract_value_out_of_area NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS payout_rules JSONB DEFAULT '{"deposit_percent": 50, "completion_percent": 50}';

-- 2. Extend teams table for territories
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS service_zip_codes TEXT[],
ADD COLUMN IF NOT EXISTS service_counties TEXT[];

-- 3. Link contractor_profiles to companies and teams
ALTER TABLE public.contractor_profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- 4. Extend contractor_referrals for team tracking and customer invitation
ALTER TABLE public.contractor_referrals
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id),
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
ADD COLUMN IF NOT EXISTS accepted_by_customer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_user_id UUID,
ADD COLUMN IF NOT EXISTS invitation_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS final_amount NUMERIC,
ADD COLUMN IF NOT EXISTS final_paid_at TIMESTAMPTZ;

-- 5. Create company_resources table for company-specific academy content
CREATE TABLE IF NOT EXISTS public.company_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT DEFAULT 'document',
  file_url TEXT,
  external_url TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on company_resources
ALTER TABLE public.company_resources ENABLE ROW LEVEL SECURITY;

-- RLS policy: Company admins and managers can view their company's resources
CREATE POLICY "Company members can view their company resources"
ON public.company_resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.company_id = company_resources.company_id
  )
);

-- RLS policy: Company admins can manage resources
CREATE POLICY "Company admins can manage resources"
ON public.company_resources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.company_id = company_resources.company_id
    AND cm.role = 'company_admin'
  )
);

-- 6. Create company_admins table to track company super admins
CREATE TABLE IF NOT EXISTS public.company_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  is_super_admin BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Enable RLS on company_admins
ALTER TABLE public.company_admins ENABLE ROW LEVEL SECURITY;

-- Company admins can view their company's admin list
CREATE POLICY "Company admins can view their company admins"
ON public.company_admins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_admins ca
    WHERE ca.user_id = auth.uid()
    AND ca.company_id = company_admins.company_id
  )
);

-- Super admins can manage company admins
CREATE POLICY "Super admins can manage company admins"
ON public.company_admins
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid()
  )
);

-- 7. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON public.companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_company_id ON public.contractor_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_team_id ON public.contractor_profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_contractor_referrals_team_id ON public.contractor_referrals(team_id);
CREATE INDEX IF NOT EXISTS idx_contractor_referrals_company_id ON public.contractor_referrals(company_id);
CREATE INDEX IF NOT EXISTS idx_company_resources_company_id ON public.company_resources(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_service_zip_codes ON public.teams USING GIN(service_zip_codes);

-- 8. Function to calculate verification score
CREATE OR REPLACE FUNCTION public.calculate_company_verification_score(company_row public.companies)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Complete company info (name, address, phone, email) = 10 points
  IF company_row.name IS NOT NULL AND company_row.address IS NOT NULL 
     AND company_row.phone IS NOT NULL AND company_row.email IS NOT NULL THEN
    score := score + 10;
  END IF;
  
  -- License provided = 20 points
  IF company_row.license_number IS NOT NULL AND company_row.license_state IS NOT NULL THEN
    score := score + 20;
  END IF;
  
  -- Insurance provided = 15 points
  IF company_row.insurance_provider IS NOT NULL AND company_row.insurance_policy_number IS NOT NULL THEN
    score := score + 15;
  END IF;
  
  -- Workers comp provided = 10 points
  IF company_row.workers_comp_provider IS NOT NULL THEN
    score := score + 10;
  END IF;
  
  -- 3+ references = 20 points
  IF jsonb_array_length(COALESCE(company_row.client_references, '[]'::jsonb)) >= 3 THEN
    score := score + 20;
  END IF;
  
  -- 5+ job photos = 15 points
  IF jsonb_array_length(COALESCE(company_row.job_photos, '[]'::jsonb)) >= 5 THEN
    score := score + 15;
  END IF;
  
  -- 5+ years in business = 5 points
  IF company_row.years_in_business >= 5 THEN
    score := score + 5;
  END IF;
  
  -- Revenue > $500K = 5 points
  IF company_row.yearly_revenue_range IN ('500k-1m', '1m-5m', '5m+') THEN
    score := score + 5;
  END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 9. Trigger to auto-update verification score on company update
CREATE OR REPLACE FUNCTION public.update_company_verification_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.verification_score := public.calculate_company_verification_score(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_company_verification_score ON public.companies;
CREATE TRIGGER trigger_update_company_verification_score
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_verification_score();