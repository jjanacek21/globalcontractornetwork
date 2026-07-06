
-- =========================
-- equipment_products
-- =========================
CREATE TABLE public.equipment_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('rig','part')),
  bto boolean NOT NULL DEFAULT false,
  cross_ref text,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  blurb text,
  price_cents integer NOT NULL,
  compare_cents integer,
  cost_cents integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.equipment_products TO anon, authenticated;
GRANT ALL ON public.equipment_products TO service_role;

ALTER TABLE public.equipment_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active equipment products"
  ON public.equipment_products FOR SELECT
  USING (active = true);

CREATE POLICY "Admins manage equipment products"
  ON public.equipment_products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public-safe view that hides cost_cents
CREATE OR REPLACE VIEW public.equipment_products_public AS
SELECT id, slug, name, type, bto, cross_ref, specs, blurb, price_cents, compare_cents, active, sort_order, created_at, updated_at
FROM public.equipment_products
WHERE active = true;

GRANT SELECT ON public.equipment_products_public TO anon, authenticated;

-- =========================
-- equipment_orders
-- =========================
CREATE SEQUENCE IF NOT EXISTS public.equipment_order_no_seq START 100000;

CREATE OR REPLACE FUNCTION public.generate_equipment_order_no()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'GCN-' || nextval('public.equipment_order_no_seq')::text;
$$;

CREATE TABLE public.equipment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text UNIQUE NOT NULL DEFAULT public.generate_equipment_order_no(),
  name text NOT NULL,
  company text,
  phone text NOT NULL,
  email text NOT NULL,
  address text,
  zip text,
  pay_mode text NOT NULL CHECK (pay_mode IN ('deposit','full')),
  payment_method text NOT NULL CHECK (payment_method IN ('card','ach_wire','financing')),
  subtotal_cents integer NOT NULL,
  deposit_due_cents integer NOT NULL,
  balance_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.equipment_orders TO anon, authenticated;
GRANT SELECT, UPDATE ON public.equipment_orders TO authenticated;
GRANT ALL ON public.equipment_orders TO service_role;

ALTER TABLE public.equipment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create equipment orders"
  ON public.equipment_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins view all equipment orders"
  ON public.equipment_orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update equipment orders"
  ON public.equipment_orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- equipment_order_items
-- =========================
CREATE TABLE public.equipment_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.equipment_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.equipment_products(id),
  qty integer NOT NULL CHECK (qty > 0),
  unit_price_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX equipment_order_items_order_id_idx ON public.equipment_order_items(order_id);

GRANT INSERT ON public.equipment_order_items TO anon, authenticated;
GRANT SELECT ON public.equipment_order_items TO authenticated;
GRANT ALL ON public.equipment_order_items TO service_role;

ALTER TABLE public.equipment_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert equipment order items"
  ON public.equipment_order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins view all equipment order items"
  ON public.equipment_order_items FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- financing_leads
-- =========================
CREATE TABLE public.financing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  phone text NOT NULL,
  email text NOT NULL,
  time_in_business text,
  amount_cents integer NOT NULL,
  equipment text,
  source text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.financing_leads TO anon, authenticated;
GRANT SELECT, UPDATE ON public.financing_leads TO authenticated;
GRANT ALL ON public.financing_leads TO service_role;

ALTER TABLE public.financing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create financing leads"
  ON public.financing_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins view financing leads"
  ON public.financing_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update financing leads"
  ON public.financing_leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- updated_at triggers
-- =========================
CREATE TRIGGER equipment_products_updated_at
  BEFORE UPDATE ON public.equipment_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER equipment_orders_updated_at
  BEFORE UPDATE ON public.equipment_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Seed catalog
-- =========================
INSERT INTO public.equipment_products (slug, name, type, bto, cross_ref, specs, blurb, price_cents, compare_cents, cost_cents, sort_order) VALUES
('gcn-933','GCN 933 Gas Hydraulic Big Rig','rig',true,'GRACO GH 933 (17B488) — $27,767 street',
  '{"Engine":"Honda GX390 13HP","Flow":"4.0 GPM","Pressure":"7,200 PSI MAX","Max Tip":".067","Best For":"Full-day silicone / high-solids"}'::jsonb,
  'Same architecture as the GH 933. Same Honda GX engine. Wear parts interchange. Half the invoice.',
  943900, 1243900, 239000, 10),
('hydra-7h','GCN HYDRA-7H Heated Hydraulic Rig','rig',true,'No US brand equivalent under $20k — inline heater',
  '{"Engine":"13HP Gas Hydraulic","Flow":"8 L/min","Pressure":"3,600 PSI","Heater":"Inline material heater"}'::jsonb,
  'Inline heater built into the rig. Nothing in this class from a US brand under $20k.',
  699500, 2150000, 210000, 20),
('gcn-833','GCN 833 Gas Hydraulic Sprayer','rig',true,'GRACO DutyMax GH 675/833',
  '{"Engine":"Honda-powered","Flow":"4.0 GPM","Pressure":"3,300 PSI","Start":"Electric start"}'::jsonb,
  'DutyMax-class output. Electric start. Interchange wear parts.',
  749500, 1662900, 239000, 30),
('air-851','GCN AIR 85:1 Pneumatic Sprayer','rig',true,'GRACO King / E-Max XT class',
  '{"Ratio":"85:1 Air Motor","Fluid Pressure":"7,250 PSI","Best For":"High-solids epoxy / steel / marine"}'::jsonb,
  'King-class pneumatic for high-solids protective coatings.',
  849500, 2947000, 262500, 40),
('foam-pro','GCN FOAM PRO Proportioner Package','rig',true,'GRACO Reactor 2 E-30 class',
  '{"Heat":"10 kW","Hose":"200 ft heated","Application":"Closed-cell SPF","Controls":"Touchscreen"}'::jsonb,
  'Reactor 2 E-30 class SPF proportioner with heated hose and touchscreen controls.',
  1299500, 4964000, 290000, 50);

INSERT INTO public.equipment_products (slug, name, type, bto, cross_ref, specs, blurb, price_cents, compare_cents, cost_cents, sort_order) VALUES
('silver-flex-gun','Silver Flex 5000 PSI Airless Gun','part',false,'GRACO Silver Plus 248157',
  '{"Max Pressure":"5,000 PSI","Fit":"Standard airless","Interchange":"Graco 248157"}'::jsonb,
  'OEM-grade equivalent to the Silver Plus. Interchange part numbers.',
  12900, 35000, 5600, 100),
('fx-foam-gun','FX Spray Foam Gun (3 chambers)','part',false,'GRACO Fusion FX (.037/.042/.047)',
  '{"Chambers":".037 / .042 / .047","Fit":"Fusion FX","Interchange":"Graco Fusion FX"}'::jsonb,
  'Three chambers included. Direct Fusion FX interchange.',
  149500, 415000, 62000, 110),
('rac-tip-10','Reversible Tip 10-Pack .031–.055','part',false,'RAC-fit',
  '{"Sizes":".031 - .055","Count":"10 pack","Fit":"RAC guard"}'::jsonb,
  'RAC-fit reversible tips in a ten-pack.',
  18900, 52000, 7100, 120),
('pump-repack-gh','Pump Repack Kit — GH/833 series','part',false,'Interchange Graco 249123-series',
  '{"Fits":"GH / 833 series","Interchange":"Graco 249123-series"}'::jsonb,
  'Repack kit that drops into GH / 833 series pumps.',
  24900, 61000, 9400, 130),
('airless-hose-50','3/8" × 50 ft Airless Hose 6,000 PSI','part',false,NULL,
  '{"Length":"50 ft","Diameter":"3/8 in","Max Pressure":"6,000 PSI"}'::jsonb,
  'Rated 6,000 PSI. 50 ft × 3/8 in.',
  11900, 26000, 4800, 140),
('mix-chamber-042','Mix Chamber 2-Pack .042','part',false,'Fusion-fit',
  '{"Size":".042","Count":"2 pack","Fit":"Fusion"}'::jsonb,
  'Two Fusion-fit .042 mix chambers.',
  22900, 56000, 8800, 150);
