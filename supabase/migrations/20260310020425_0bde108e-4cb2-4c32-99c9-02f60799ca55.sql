-- Create insurance_carriers table
CREATE TABLE public.insurance_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  portal_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.insurance_carriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own carriers" ON public.insurance_carriers FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Create insurance_adjusters table
CREATE TABLE public.insurance_adjusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  carrier_id uuid REFERENCES public.insurance_carriers(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.insurance_adjusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own adjusters" ON public.insurance_adjusters FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Create insurance_supplements table
CREATE TABLE public.insurance_supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claim_reference text,
  amount_requested numeric DEFAULT 0,
  amount_approved numeric DEFAULT 0,
  status text DEFAULT 'draft',
  date_submitted date,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.insurance_supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own supplements" ON public.insurance_supplements FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());