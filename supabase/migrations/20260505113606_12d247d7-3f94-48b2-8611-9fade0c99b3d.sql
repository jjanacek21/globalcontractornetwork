CREATE TABLE IF NOT EXISTS public.field_extraction_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  total_templates int NOT NULL DEFAULT 0,
  processed int NOT NULL DEFAULT 0,
  succeeded int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0,
  current_template_id uuid,
  current_template_name text,
  template_ids uuid[] NOT NULL DEFAULT '{}',
  scope_template_id uuid,
  error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  triggered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_extraction_jobs_status ON public.field_extraction_jobs(status, created_at DESC);

ALTER TABLE public.field_extraction_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view extraction jobs"
ON public.field_extraction_jobs FOR SELECT
USING (public.is_super_admin() OR public.is_permit_admin());

CREATE POLICY "Admins can insert extraction jobs"
ON public.field_extraction_jobs FOR INSERT
WITH CHECK (public.is_super_admin() OR public.is_permit_admin());

CREATE TRIGGER update_field_extraction_jobs_updated_at
BEFORE UPDATE ON public.field_extraction_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();