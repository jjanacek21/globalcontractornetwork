
ALTER TABLE public.permit_form_templates 
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS firecrawl_doc_id UUID REFERENCES public.firecrawl_discovered_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_classification TEXT DEFAULT NULL;

COMMENT ON COLUMN public.permit_form_templates.source IS 'Origin: firecrawl, manual, imported';
COMMENT ON COLUMN public.permit_form_templates.firecrawl_doc_id IS 'Links back to the crawled source document';
COMMENT ON COLUMN public.permit_form_templates.document_classification IS 'permit_application, checklist, affidavit, noa_form, inspection_form, code_form';
