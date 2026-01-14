
-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.calculate_user_level(points INTEGER)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN points >= 15000 THEN 'legend'
    WHEN points >= 5000 THEN 'master_referrer'
    WHEN points >= 2000 THEN 'network_pro'
    WHEN points >= 500 THEN 'rising_star'
    ELSE 'new_contractor'
  END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_company_tier(referrals INTEGER)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN referrals >= 500 THEN 'platinum'
    WHEN referrals >= 200 THEN 'gold'
    WHEN referrals >= 50 THEN 'silver'
    ELSE 'bronze'
  END;
$$;

CREATE OR REPLACE FUNCTION public.update_gamification_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
