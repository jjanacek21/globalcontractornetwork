
-- Create contact_documents table
CREATE TABLE public.contact_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contact_documents"
  ON public.contact_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contact_documents"
  ON public.contact_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete contact_documents"
  ON public.contact_documents FOR DELETE TO authenticated USING (true);

-- Create contact_communications table
CREATE TABLE public.contact_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  comm_type TEXT NOT NULL DEFAULT 'call',
  direction TEXT NOT NULL DEFAULT 'outbound',
  subject TEXT,
  content TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contact_communications"
  ON public.contact_communications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contact_communications"
  ON public.contact_communications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete contact_communications"
  ON public.contact_communications FOR DELETE TO authenticated USING (true);

-- Add columns to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS roof_type TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS roof_age INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Create contact-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-documents', 'contact-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload contact documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contact-documents');

CREATE POLICY "Authenticated users can view contact documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contact-documents');

CREATE POLICY "Authenticated users can delete contact documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contact-documents');
