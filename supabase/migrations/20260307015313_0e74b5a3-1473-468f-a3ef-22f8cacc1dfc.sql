
-- Table 1: firecrawl_crawl_jobs
CREATE TABLE public.firecrawl_crawl_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL CHECK (job_type IN ('noa_search', 'permit_docs_crawl', 'building_dept_map')),
  firecrawl_job_id text,
  target_url text,
  target_department text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  config jsonb DEFAULT '{}'::jsonb,
  results_summary jsonb DEFAULT '{}'::jsonb,
  documents_found integer DEFAULT 0,
  documents_downloaded integer DEFAULT 0,
  documents_converted integer DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table 2: firecrawl_discovered_documents
CREATE TABLE public.firecrawl_discovered_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_job_id uuid REFERENCES public.firecrawl_crawl_jobs(id) ON DELETE CASCADE NOT NULL,
  source_url text,
  document_type text,
  title text,
  description text,
  department text,
  county text,
  file_url text,
  storage_path text,
  file_size integer,
  content_markdown text,
  smart_doc_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_downloaded boolean DEFAULT false,
  is_converted_to_smart_doc boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.firecrawl_crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firecrawl_discovered_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies - permit admins and super admins can manage
CREATE POLICY "Permit admins can manage crawl jobs" ON public.firecrawl_crawl_jobs
  FOR ALL TO authenticated USING (public.is_permit_admin() OR public.is_super_admin());

CREATE POLICY "Permit admins can manage discovered docs" ON public.firecrawl_discovered_documents
  FOR ALL TO authenticated USING (public.is_permit_admin() OR public.is_super_admin());

-- Updated_at trigger
CREATE TRIGGER update_firecrawl_crawl_jobs_updated_at
  BEFORE UPDATE ON public.firecrawl_crawl_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
