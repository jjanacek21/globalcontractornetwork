
-- Broadcast referrals (1-to-many "first 3 to claim wins")
CREATE TABLE public.referral_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.gcn_customers(id) ON DELETE CASCADE,
  referring_contractor_id uuid NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  trade text NOT NULL,
  service_area text,
  contract_value numeric,
  estimated_bounty numeric,
  notes text,
  max_claims integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'open',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_broadcasts_open ON public.referral_broadcasts(status, trade, created_at DESC);

CREATE TABLE public.referral_broadcast_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.referral_broadcasts(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  message_sent_at timestamptz,
  UNIQUE(broadcast_id, contractor_id)
);
CREATE INDEX idx_claims_broadcast ON public.referral_broadcast_claims(broadcast_id);
CREATE INDEX idx_claims_contractor ON public.referral_broadcast_claims(contractor_id);

ALTER TABLE public.referral_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_broadcast_claims ENABLE ROW LEVEL SECURITY;

-- Any contractor can browse open broadcasts; referrer always sees own; admins see all
CREATE POLICY "Contractors view open broadcasts" ON public.referral_broadcasts
  FOR SELECT TO authenticated
  USING (
    status = 'open'
    OR referring_contractor_id = public.get_contractor_profile_id()
    OR public.is_super_admin()
  );

CREATE POLICY "Referrer creates broadcast" ON public.referral_broadcasts
  FOR INSERT TO authenticated
  WITH CHECK (referring_contractor_id = public.get_contractor_profile_id());

CREATE POLICY "Referrer or admin updates broadcast" ON public.referral_broadcasts
  FOR UPDATE TO authenticated
  USING (referring_contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());

CREATE POLICY "Admin deletes broadcast" ON public.referral_broadcasts
  FOR DELETE TO authenticated USING (public.is_super_admin());

-- Claims: contractor sees own; broadcast referrer sees all on their broadcasts
CREATE POLICY "View claims" ON public.referral_broadcast_claims
  FOR SELECT TO authenticated
  USING (
    contractor_id = public.get_contractor_profile_id()
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.referral_broadcasts b
      WHERE b.id = broadcast_id
        AND b.referring_contractor_id = public.get_contractor_profile_id()
    )
  );

CREATE POLICY "Contractor claims own" ON public.referral_broadcast_claims
  FOR INSERT TO authenticated
  WITH CHECK (contractor_id = public.get_contractor_profile_id());

CREATE POLICY "Contractor updates own claim" ON public.referral_broadcast_claims
  FOR UPDATE TO authenticated
  USING (contractor_id = public.get_contractor_profile_id());

-- Race-safe claim cap: reject when broadcast is full or expired
CREATE OR REPLACE FUNCTION public.enforce_broadcast_claim_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bc public.referral_broadcasts;
  claim_count int;
BEGIN
  SELECT * INTO bc FROM public.referral_broadcasts WHERE id = NEW.broadcast_id FOR UPDATE;
  IF bc.status <> 'open' THEN
    RAISE EXCEPTION 'Broadcast is no longer open';
  END IF;
  IF bc.expires_at < now() THEN
    UPDATE public.referral_broadcasts SET status = 'expired' WHERE id = bc.id;
    RAISE EXCEPTION 'Broadcast has expired';
  END IF;
  IF bc.referring_contractor_id = NEW.contractor_id THEN
    RAISE EXCEPTION 'Cannot claim your own broadcast';
  END IF;
  SELECT count(*) INTO claim_count FROM public.referral_broadcast_claims WHERE broadcast_id = bc.id;
  IF claim_count >= bc.max_claims THEN
    UPDATE public.referral_broadcasts SET status = 'filled' WHERE id = bc.id;
    RAISE EXCEPTION 'Broadcast already has the maximum number of claims';
  END IF;
  IF claim_count + 1 >= bc.max_claims THEN
    UPDATE public.referral_broadcasts SET status = 'filled' WHERE id = bc.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_broadcast_claim_cap
BEFORE INSERT ON public.referral_broadcast_claims
FOR EACH ROW EXECUTE FUNCTION public.enforce_broadcast_claim_cap();

-- Lifetime client binding: when a referral is created, lock the customer
-- to the original referring contractor. Never overwritten.
CREATE OR REPLACE FUNCTION public.bind_customer_to_introducer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referring_contractor_id IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.client_pool (customer_id, introducing_contractor_id, invitation_status, last_activity_at)
  VALUES (NEW.customer_id, NEW.referring_contractor_id, 'pending', now())
  ON CONFLICT (customer_id) DO UPDATE SET last_activity_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bind_customer_to_introducer
AFTER INSERT ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.bind_customer_to_introducer();

-- When any future referral is won, pay the original introducer a residual
-- (10% of contract value, capped at the bounty if smaller). GCN keeps 30%.
CREATE OR REPLACE FUNCTION public.pay_introducer_residual()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  introducer_id uuid;
  rate numeric := 0.10;
  base numeric;
  amount numeric;
BEGIN
  IF NEW.status = 'won' AND (OLD.status IS DISTINCT FROM 'won') THEN
    SELECT introducing_contractor_id INTO introducer_id
      FROM public.client_pool WHERE customer_id = NEW.customer_id;
    IF introducer_id IS NULL THEN
      RETURN NEW;
    END IF;
    base := COALESCE(NEW.contract_value, 0);
    amount := round(base * rate, 2);
    INSERT INTO public.residuals (
      introducing_contractor_id, customer_id, triggering_contractor_id,
      triggering_referral_id, contract_value, residual_rate, residual_amount, status
    ) VALUES (
      introducer_id, NEW.customer_id, NEW.receiving_contractor_id,
      NEW.id, base, rate, amount, 'pending'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pay_introducer_residual
AFTER UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.pay_introducer_residual();
