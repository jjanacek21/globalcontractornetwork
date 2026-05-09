
-- =====================================================
-- GCN Referral Dashboard - Initial schema
-- =====================================================

-- Enums
CREATE TYPE public.bounty_type AS ENUM ('flat', 'percent');
CREATE TYPE public.tier_status AS ENUM ('active', 'paused');
CREATE TYPE public.referral_status AS ENUM ('in_progress', 'won', 'lost', 'expired');
CREATE TYPE public.client_invitation_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE public.payout_type AS ENUM ('outbound_bounty', 'residual', 'gcn_fee', 'withdrawal');
CREATE TYPE public.payout_direction AS ENUM ('credit', 'debit');
CREATE TYPE public.payout_status AS ENUM ('pending', 'in_escrow', 'available', 'withdrawn', 'disputed');
CREATE TYPE public.score_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE public.activity_icon_token AS ENUM ('check', 'dollar', 'star', 'arrow', 'alert', 'plus');
CREATE TYPE public.activity_color_token AS ENUM ('green', 'gold', 'amber');

CREATE EXTENSION IF NOT EXISTS citext;

-- =====================================================
-- gcn_customers
-- =====================================================
CREATE TABLE public.gcn_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  property_address JSONB,
  property_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gcn_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view customers" ON public.gcn_customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert customers" ON public.gcn_customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Super admin can update customers" ON public.gcn_customers FOR UPDATE TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admin can delete customers" ON public.gcn_customers FOR DELETE TO authenticated USING (public.is_super_admin());

-- =====================================================
-- gcn_reviews
-- =====================================================
CREATE TABLE public.gcn_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.gcn_customers(id) ON DELETE CASCADE,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  on_time BOOLEAN,
  nps INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gcn_reviews_contractor ON public.gcn_reviews(contractor_id, created_at DESC);
ALTER TABLE public.gcn_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contractor can view own reviews" ON public.gcn_reviews FOR SELECT TO authenticated
  USING (contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());
CREATE POLICY "Super admin manages reviews" ON public.gcn_reviews FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =====================================================
-- referral_partner_tiers
-- =====================================================
CREATE TABLE public.referral_partner_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  tier_name TEXT NOT NULL,
  min_contract_value NUMERIC NOT NULL DEFAULT 0,
  max_contract_value NUMERIC,
  bounty_type public.bounty_type NOT NULL DEFAULT 'flat',
  bounty_amount NUMERIC NOT NULL DEFAULT 0,
  status public.tier_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_partner_tiers_contractor ON public.referral_partner_tiers(contractor_id, trade);
ALTER TABLE public.referral_partner_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active tiers" ON public.referral_partner_tiers FOR SELECT TO authenticated
  USING (status = 'active' OR contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());
CREATE POLICY "Owner can manage own tiers" ON public.referral_partner_tiers FOR ALL TO authenticated
  USING (contractor_id = public.get_contractor_profile_id() OR public.is_super_admin())
  WITH CHECK (contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());
CREATE TRIGGER trg_partner_tiers_updated BEFORE UPDATE ON public.referral_partner_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- referrals
-- =====================================================
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referring_contractor_id UUID REFERENCES public.contractor_profiles(id) ON DELETE SET NULL,
  receiving_contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.gcn_customers(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  service_description TEXT,
  contract_value NUMERIC,
  bounty_amount NUMERIC,
  referrer_share NUMERIC,
  gcn_share NUMERIC,
  status public.referral_status NOT NULL DEFAULT 'in_progress',
  escrow_release_at TIMESTAMPTZ,
  paid_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_referrals_referring ON public.referrals(referring_contractor_id, created_at DESC);
CREATE INDEX idx_referrals_receiving ON public.referrals(receiving_contractor_id, created_at DESC);
CREATE INDEX idx_referrals_customer ON public.referrals(customer_id);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties can view referrals" ON public.referrals FOR SELECT TO authenticated USING (
  referring_contractor_id = public.get_contractor_profile_id()
  OR receiving_contractor_id = public.get_contractor_profile_id()
  OR public.is_super_admin()
);
CREATE POLICY "Referrer can insert" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (referring_contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());
CREATE POLICY "Super admin can update referrals" ON public.referrals FOR UPDATE TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin can delete referrals" ON public.referrals FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- =====================================================
-- client_pool
-- =====================================================
CREATE TABLE public.client_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES public.gcn_customers(id) ON DELETE CASCADE,
  introducing_contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  invitation_status public.client_invitation_status NOT NULL DEFAULT 'pending',
  invitation_sent_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  churned_at TIMESTAMPTZ
);
CREATE INDEX idx_client_pool_introducer ON public.client_pool(introducing_contractor_id);
ALTER TABLE public.client_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Introducer manages own pool" ON public.client_pool FOR ALL TO authenticated
  USING (introducing_contractor_id = public.get_contractor_profile_id() OR public.is_super_admin())
  WITH CHECK (introducing_contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());

-- =====================================================
-- residuals
-- =====================================================
CREATE TABLE public.residuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  introducing_contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.gcn_customers(id) ON DELETE CASCADE,
  triggering_contractor_id UUID REFERENCES public.contractor_profiles(id) ON DELETE SET NULL,
  triggering_referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  contract_value NUMERIC,
  residual_rate NUMERIC,
  residual_amount NUMERIC,
  status TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_residuals_introducer ON public.residuals(introducing_contractor_id, created_at DESC);
CREATE INDEX idx_residuals_customer ON public.residuals(customer_id);
ALTER TABLE public.residuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Introducer can view residuals" ON public.residuals FOR SELECT TO authenticated
  USING (introducing_contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());
CREATE POLICY "Super admin manages residuals" ON public.residuals FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =====================================================
-- payouts
-- =====================================================
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  type public.payout_type NOT NULL,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  residual_id UUID REFERENCES public.residuals(id) ON DELETE SET NULL,
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  gcn_fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  direction public.payout_direction NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pending',
  method TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);
CREATE INDEX idx_payouts_contractor ON public.payouts(contractor_id, created_at DESC);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contractor can view own payouts" ON public.payouts FOR SELECT TO authenticated
  USING (contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());
CREATE POLICY "Super admin manages payouts" ON public.payouts FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =====================================================
-- contractor_scores
-- =====================================================
CREATE TABLE public.contractor_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  tier public.score_tier NOT NULL DEFAULT 'bronze',
  residual_rate NUMERIC NOT NULL DEFAULT 1.5,
  quality INT NOT NULL DEFAULT 0,
  refs_given INT NOT NULL DEFAULT 0,
  refs_completed INT NOT NULL DEFAULT 0,
  ontime_nps INT NOT NULL DEFAULT 0,
  is_provisional BOOLEAN NOT NULL DEFAULT true,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contractor_scores_contractor ON public.contractor_scores(contractor_id, computed_at DESC);
ALTER TABLE public.contractor_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view scores" ON public.contractor_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages scores" ON public.contractor_scores FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =====================================================
-- activity_log
-- =====================================================
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  icon_token public.activity_icon_token NOT NULL DEFAULT 'check',
  color_token public.activity_color_token NOT NULL DEFAULT 'green',
  message_html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_log_contractor ON public.activity_log(contractor_id, created_at DESC);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contractor can view own activity" ON public.activity_log FOR SELECT TO authenticated
  USING (contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());
CREATE POLICY "Super admin writes activity" ON public.activity_log FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- =====================================================
-- Public helper view: contractor_scores_public
-- =====================================================
CREATE OR REPLACE VIEW public.contractor_scores_public
WITH (security_invoker = on)
AS
SELECT DISTINCT ON (cs.contractor_id)
  cs.contractor_id,
  cs.score,
  cs.tier,
  cs.residual_rate,
  cp.company_name,
  cp.category AS trade,
  cp.service_area
FROM public.contractor_scores cs
JOIN public.contractor_profiles cp ON cp.id = cs.contractor_id
ORDER BY cs.contractor_id, cs.computed_at DESC;
