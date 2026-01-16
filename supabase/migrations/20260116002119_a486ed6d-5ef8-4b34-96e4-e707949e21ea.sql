-- Populate product_approvals with common roofing products
INSERT INTO public.product_approvals (manufacturer, product_name, product_category, product_line, noa_number, expiration_date, hvhz_approved, is_active) VALUES
-- Polyglass Underlayments
('Polyglass', 'Polystick TU Plus', 'underlayment', 'Self-Adhered', '25-0121.12', '2026-12-31', true, true),
('Polyglass', 'Polystick TU Max', 'underlayment', 'Self-Adhered', '25-0121.12', '2026-12-31', true, true),
('Polyglass', 'Polystick MTS Plus', 'underlayment', 'Self-Adhered', '25-0121.12', '2026-12-31', true, true),
('Polyglass', 'HydraGuard Dual Pro', 'underlayment', 'Self-Adhered', '25-0118.05', '2026-12-31', true, true),
-- GAF Underlayments
('GAF', 'Deck-Armor Premium', 'underlayment', 'Synthetic', '21-0602.10', '2026-06-30', true, true),
('GAF', 'Tiger Paw', 'underlayment', 'Synthetic', '21-0602.10', '2026-06-30', true, true),
('GAF', 'FeltBuster', 'underlayment', 'Synthetic', '21-0602.10', '2026-06-30', true, true),
-- CertainTeed Underlayments
('CertainTeed', 'DiamondDeck', 'underlayment', 'Synthetic', '20-0318.06', '2025-12-31', true, true),
('CertainTeed', 'RoofRunner', 'underlayment', 'Synthetic', '20-0318.06', '2025-12-31', true, true),
-- Eagle Tiles
('Eagle Roofing Products', 'Low Profile Concrete Tile', 'roof_covering', 'Concrete Tile', '24-1008.08', '2029-10-31', true, true),
('Eagle Roofing Products', 'High Profile Concrete Tile', 'roof_covering', 'Concrete Tile', '24-1008.08', '2029-10-31', true, true),
('Eagle Roofing Products', 'Flat Concrete Tile', 'roof_covering', 'Concrete Tile', '24-1008.08', '2029-10-31', true, true),
('Eagle Roofing Products', 'Capistrano Concrete Tile', 'roof_covering', 'Concrete Tile', '24-1008.08', '2029-10-31', true, true),
-- Boral Tiles
('Boral Roofing', 'Barcelona 900 Tile', 'roof_covering', 'Concrete Tile', '23-0912.04', '2028-09-30', true, true),
('Boral Roofing', 'Saxony 900 Tile', 'roof_covering', 'Concrete Tile', '23-0912.04', '2028-09-30', true, true),
-- GAF Shingles
('GAF', 'Timberline HDZ', 'roof_covering', 'Asphalt Shingle', '21-0602.10', '2026-06-30', true, true),
('GAF', 'Timberline UHDZ', 'roof_covering', 'Asphalt Shingle', '21-0602.10', '2026-06-30', true, true),
('GAF', 'Camelot II', 'roof_covering', 'Asphalt Shingle', '21-0602.10', '2026-06-30', true, true),
-- CertainTeed Shingles
('CertainTeed', 'Landmark', 'roof_covering', 'Asphalt Shingle', '20-0318.06', '2025-12-31', true, true),
('CertainTeed', 'Landmark Pro', 'roof_covering', 'Asphalt Shingle', '20-0318.06', '2025-12-31', true, true),
('CertainTeed', 'Presidential Shake', 'roof_covering', 'Asphalt Shingle', '20-0318.06', '2025-12-31', true, true),
-- Metal Roofing
('ATAS International', 'Standing Seam Panel', 'roof_covering', 'Metal Panel', '22-0456.03', '2027-04-30', true, true),
('McElroy Metal', 'Medallion-Lok', 'roof_covering', 'Metal Panel', '21-0789.02', '2026-08-31', true, true)
ON CONFLICT DO NOTHING;

-- Create roofr_reports table for measurement integration
CREATE TABLE IF NOT EXISTS public.roofr_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_project_id uuid REFERENCES public.permit_projects(id) ON DELETE CASCADE,
  roofr_project_id text,
  total_area_sqft numeric,
  facets integer,
  predominant_pitch text,
  eaves_length numeric,
  valleys_length numeric,
  hips_length numeric,
  ridges_length numeric,
  raw_data jsonb,
  pdf_path text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roofr_reports ENABLE ROW LEVEL SECURITY;

-- Contractors can read their own Roofr reports
CREATE POLICY "Contractors can manage their Roofr reports"
  ON public.roofr_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.permit_projects pp
      WHERE pp.id = roofr_reports.permit_project_id
      AND pp.contractor_id = public.get_contractor_profile_id()
    )
  );

-- Add selected_products column to permit_projects for product tracking
ALTER TABLE public.permit_projects 
ADD COLUMN IF NOT EXISTS selected_products jsonb DEFAULT '[]'::jsonb;