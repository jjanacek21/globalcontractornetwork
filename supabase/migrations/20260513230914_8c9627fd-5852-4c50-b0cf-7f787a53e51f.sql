
ALTER TABLE public.contractor_profiles
  ADD COLUMN IF NOT EXISTS profile_type text DEFAULT 'company';

ALTER TABLE public.contractor_profiles
  DROP CONSTRAINT IF EXISTS contractor_profiles_profile_type_check;

ALTER TABLE public.contractor_profiles
  ADD CONSTRAINT contractor_profiles_profile_type_check
  CHECK (profile_type IN ('company','building_consultant','handyman','skilled_labor'));

CREATE INDEX IF NOT EXISTS idx_contractor_profiles_profile_type
  ON public.contractor_profiles(profile_type);

DROP POLICY IF EXISTS "Active companies are viewable by everyone" ON public.companies;
CREATE POLICY "Active companies are viewable by everyone"
  ON public.companies
  FOR SELECT
  USING (is_active = true);
