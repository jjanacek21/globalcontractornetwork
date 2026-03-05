
ALTER TABLE public.permit_projects
  ADD COLUMN IF NOT EXISTS generated_document_paths text[] NULL;
