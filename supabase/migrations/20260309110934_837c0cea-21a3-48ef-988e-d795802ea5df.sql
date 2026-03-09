CREATE TABLE public.roofing_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  unit_of_measure TEXT NOT NULL DEFAULT 'EA',
  cost_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.roofing_materials ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all materials
CREATE POLICY "Authenticated users can read materials"
  ON public.roofing_materials FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert materials
CREATE POLICY "Authenticated users can insert materials"
  ON public.roofing_materials FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update materials
CREATE POLICY "Authenticated users can update materials"
  ON public.roofing_materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete materials
CREATE POLICY "Authenticated users can delete materials"
  ON public.roofing_materials FOR DELETE
  TO authenticated
  USING (true);

-- Seed common roofing materials
INSERT INTO public.roofing_materials (name, category, unit_of_measure, cost_per_unit, supplier, description) VALUES
  ('GAF Timberline HDZ', 'Shingles', 'SQ', 95.00, 'ABC Supply', 'Architectural shingle with LayerLock technology'),
  ('CertainTeed Landmark', 'Shingles', 'SQ', 89.00, 'Beacon Roofing', 'Max Def colors, algae-resistant architectural shingle'),
  ('Owens Corning Duration', 'Shingles', 'SQ', 92.00, 'ABC Supply', 'SureNail technology patented fastening strip'),
  ('Synthetic Underlayment', 'Underlayment', 'ROLL', 65.00, 'ABC Supply', 'High-performance synthetic felt alternative'),
  ('30# Felt Underlayment', 'Underlayment', 'ROLL', 28.00, 'Home Depot Pro', 'Standard organic felt underlayment'),
  ('Pro-Start Starter Strip', 'Starter Strip', 'BD', 42.00, 'ABC Supply', 'Universal pre-cut starter shingle'),
  ('Seal-A-Ridge Cap', 'Ridge Cap', 'BD', 55.00, 'Beacon Roofing', 'Hip and ridge cap shingles'),
  ('Step Flashing 4x4', 'Flashing', 'PC', 1.50, 'ABC Supply', 'Aluminum step flashing for wall-to-roof transitions'),
  ('Pipe Boot 2"', 'Flashing', 'EA', 15.00, 'Home Depot Pro', 'Neoprene pipe boot flashing'),
  ('Ice & Water Shield', 'Ice & Water Shield', 'ROLL', 85.00, 'ABC Supply', 'Self-adhering waterproofing membrane'),
  ('Drip Edge 10ft White', 'Drip Edge', 'PC', 8.50, 'ABC Supply', 'Aluminum drip edge for eaves and rakes'),
  ('Drip Edge 10ft Brown', 'Drip Edge', 'PC', 8.50, 'Beacon Roofing', 'Aluminum drip edge for eaves and rakes'),
  ('1-1/4" Coil Nails', 'Nails', 'BOX', 45.00, 'ABC Supply', 'Galvanized coil roofing nails (7200ct)'),
  ('1-3/4" Hand Nails', 'Nails', 'BOX', 32.00, 'Home Depot Pro', 'Galvanized hand-drive roofing nails (5lb)'),
  ('Ridge Vent 4ft', 'Ventilation', 'PC', 12.00, 'ABC Supply', 'Filtered ridge vent for attic ventilation'),
  ('Roof Cement 1gal', 'Sealants', 'EA', 14.00, 'Home Depot Pro', 'Plastic roof cement for repairs and sealing');
