
CREATE TABLE public.consultation_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  best_time_to_call text NULL,
  property_address text NOT NULL,
  property_lat double precision NULL,
  property_lng double precision NULL,
  property_type text NULL,
  is_primary_residence boolean NULL,
  services text[] NOT NULL DEFAULT '{}',
  project_description text NULL,
  timeline text NULL,
  payment_method text NULL,
  insurance_carrier text NULL,
  insurance_claim_number text NULL,
  financing_interest boolean NULL,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'Schedule Consultation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a consultation lead"
ON public.consultation_leads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Super admins can view consultation leads"
ON public.consultation_leads FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admins can update consultation leads"
ON public.consultation_leads FOR UPDATE
USING (public.is_super_admin());

CREATE POLICY "Super admins can delete consultation leads"
ON public.consultation_leads FOR DELETE
USING (public.is_super_admin());

CREATE TRIGGER update_consultation_leads_updated_at
BEFORE UPDATE ON public.consultation_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_consultation_leads_created_at ON public.consultation_leads (created_at DESC);
CREATE INDEX idx_consultation_leads_status ON public.consultation_leads (status);
