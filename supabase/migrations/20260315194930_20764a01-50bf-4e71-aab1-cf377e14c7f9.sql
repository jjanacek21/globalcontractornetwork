
-- Add detailed roof component columns to roof_measurements
ALTER TABLE public.roof_measurements
  ADD COLUMN IF NOT EXISTS rake_ft numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS step_flashing_ft numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS headwall_ft numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pipe_boots_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skylights_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chimney_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS drip_edge_ft numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flashing_ft numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS material_takeoff jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS share_token text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS facets_count integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stories integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS predominant_pitch text DEFAULT NULL;

-- Create unique index on share_token for shareable links
CREATE UNIQUE INDEX IF NOT EXISTS idx_roof_measurements_share_token 
  ON public.roof_measurements (share_token) WHERE share_token IS NOT NULL;

-- Create measurement_reports table for shareable links
CREATE TABLE IF NOT EXISTS public.measurement_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid REFERENCES public.roof_measurements(id) ON DELETE CASCADE NOT NULL,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  report_data jsonb DEFAULT NULL
);

ALTER TABLE public.measurement_reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create reports for their measurements
CREATE POLICY "Users can create reports" ON public.measurement_reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to view their own reports
CREATE POLICY "Users can view own reports" ON public.measurement_reports
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Allow anonymous access to active reports via share_token (for public sharing)
CREATE POLICY "Public can view active reports" ON public.measurement_reports
  FOR SELECT TO anon
  USING (is_active = true);
