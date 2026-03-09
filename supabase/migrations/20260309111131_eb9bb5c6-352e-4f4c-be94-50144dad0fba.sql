-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  account_number TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (true);

-- Commission rules table
CREATE TABLE public.commission_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rep_name TEXT NOT NULL,
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  bonus_threshold NUMERIC(12,2),
  bonus_percent NUMERIC(5,2),
  payment_schedule TEXT NOT NULL DEFAULT 'bi-weekly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read commission_rules" ON public.commission_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert commission_rules" ON public.commission_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update commission_rules" ON public.commission_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete commission_rules" ON public.commission_rules FOR DELETE TO authenticated USING (true);

-- Seed suppliers
INSERT INTO public.suppliers (name, contact_name, phone, email, account_number, notes) VALUES
  ('ABC Supply Co.', 'Mike Thompson', '(555) 111-2222', 'mike@abcsupply.com', 'ABC-90012', 'Primary shingle and metals supplier'),
  ('Beacon Roofing Supply', 'Linda Park', '(555) 333-4444', 'linda@beacon.com', 'BRS-44521', 'Good pricing on ridge cap and ventilation'),
  ('Home Depot Pro', 'James Wilson', '(555) 555-6666', 'jwilson@hdpro.com', 'HDP-78345', 'Backup supplier for misc accessories'),
  ('SRS Distribution', 'Carol Davis', '(555) 777-8888', 'carol@srs.com', 'SRS-11098', 'Coatings and sealant specialist');

-- Seed commission rules
INSERT INTO public.commission_rules (rep_name, commission_percent, bonus_threshold, bonus_percent, payment_schedule) VALUES
  ('Default - New Rep', 8.00, 50000, 2.00, 'bi-weekly'),
  ('Default - Senior Rep', 10.00, 100000, 3.00, 'bi-weekly'),
  ('Default - Top Performer', 12.00, 150000, 4.00, 'monthly');