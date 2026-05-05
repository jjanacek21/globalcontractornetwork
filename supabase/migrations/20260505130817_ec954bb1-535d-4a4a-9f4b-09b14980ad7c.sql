CREATE TABLE public.maintenance_membership_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  property_address TEXT,
  plan_interest TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_membership_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can join waitlist"
  ON public.maintenance_membership_waitlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users view own waitlist entry"
  ON public.maintenance_membership_waitlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin());

CREATE POLICY "Users update own waitlist entry"
  ON public.maintenance_membership_waitlist FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin());

CREATE POLICY "Super admins delete waitlist entries"
  ON public.maintenance_membership_waitlist FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

CREATE TRIGGER update_maintenance_waitlist_updated_at
  BEFORE UPDATE ON public.maintenance_membership_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();