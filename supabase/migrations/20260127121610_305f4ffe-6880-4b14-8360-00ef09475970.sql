-- Create custom_source_websites table for managing crawl sources
CREATE TABLE public.custom_source_websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  url_pattern TEXT,
  target_category TEXT NOT NULL DEFAULT 'all',
  document_types TEXT[] NOT NULL DEFAULT ARRAY['noa', 'fl_approval'],
  crawl_depth INTEGER NOT NULL DEFAULT 1 CHECK (crawl_depth BETWEEN 1 AND 3),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_crawl_at TIMESTAMP WITH TIME ZONE,
  documents_found INTEGER NOT NULL DEFAULT 0,
  crawl_status TEXT NOT NULL DEFAULT 'pending' CHECK (crawl_status IN ('pending', 'crawling', 'completed', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.custom_source_websites ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can manage source websites"
ON public.custom_source_websites
FOR ALL
USING (public.is_super_admin());

-- Add updated_at trigger
CREATE TRIGGER update_custom_source_websites_updated_at
  BEFORE UPDATE ON public.custom_source_websites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sources
INSERT INTO public.custom_source_websites (name, url, target_category, document_types, crawl_depth) VALUES
  ('Miami-Dade NOA Database - Roofing', 'https://www.miamidade.gov/building/pc-result_app.asp?categorylist=13', 'Roofing', ARRAY['noa'], 2),
  ('Florida Building Product Approval', 'https://floridabuilding.org/pr/pr_app_srch.aspx', 'all', ARRAY['fl_approval'], 2),
  ('FL Building Code Product Search', 'https://bcap.floridabuilding.org', 'all', ARRAY['fl_approval', 'noa'], 1);