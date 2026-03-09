
-- Create estimate_templates table
CREATE TABLE public.estimate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade TEXT NOT NULL DEFAULT 'roofing',
  material_cost_per_sq NUMERIC(10,2) NOT NULL DEFAULT 0,
  labor_cost_per_sq NUMERIC(10,2) NOT NULL DEFAULT 0,
  waste_factor NUMERIC(5,2) NOT NULL DEFAULT 10,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.estimate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view estimate_templates"
  ON public.estimate_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert estimate_templates"
  ON public.estimate_templates FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update estimate_templates"
  ON public.estimate_templates FOR UPDATE TO authenticated
  USING (true);

-- Add columns to estimates table
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.estimate_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS materials_cost NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overhead_cost NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overhead_percent NUMERIC(5,2) DEFAULT 10,
  ADD COLUMN IF NOT EXISTS profit_percent NUMERIC(5,2) DEFAULT 30,
  ADD COLUMN IF NOT EXISTS quick_price_adjust_percent NUMERIC(5,2) DEFAULT 0;

-- Add columns to estimate_line_items table
ALTER TABLE public.estimate_line_items
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'EA',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'material';

-- Seed default roofing templates (no company_id = global defaults)
INSERT INTO public.estimate_templates (name, trade, material_cost_per_sq, labor_cost_per_sq, waste_factor, is_default)
VALUES
  ('GAF Timberline HDZ', 'roofing', 85.00, 65.00, 10, true),
  ('CertainTeed Landmark', 'roofing', 80.00, 65.00, 10, false),
  ('Owens Corning Duration', 'roofing', 90.00, 70.00, 10, false),
  ('Owens Corning Oakridge', 'roofing', 75.00, 60.00, 10, false);
