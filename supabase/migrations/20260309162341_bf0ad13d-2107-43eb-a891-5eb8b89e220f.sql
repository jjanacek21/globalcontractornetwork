
CREATE TABLE public.material_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.crm_jobs(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id),
  material_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text DEFAULT 'units',
  supplier text,
  status text NOT NULL DEFAULT 'ordered',
  expected_date date,
  actual_delivery_date date,
  cost numeric,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.material_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view material orders"
  ON public.material_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert material orders"
  ON public.material_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update material orders"
  ON public.material_orders FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete material orders"
  ON public.material_orders FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_material_orders_updated_at
  BEFORE UPDATE ON public.material_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
