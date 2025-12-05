-- Supplement Kings tables for contractor lead management

-- supplement_contractors table (contractor profiles for Supplement Kings)
CREATE TABLE public.supplement_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- supplement_leads table (contractor-submitted leads)
CREATE TABLE public.supplement_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.supplement_contractors(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  property_address TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_state TEXT DEFAULT 'FL',
  property_zip TEXT,
  claim_type TEXT NOT NULL,
  insurance_company TEXT,
  claim_number TEXT,
  date_of_loss DATE,
  urgency TEXT DEFAULT 'standard',
  notes TEXT,
  status TEXT DEFAULT 'submitted',
  assigned_amount DECIMAL(10,2),
  settled_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- supplement_lead_documents table
CREATE TABLE public.supplement_lead_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.supplement_leads(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- supplement_admins table (admin users)
CREATE TABLE public.supplement_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.supplement_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_lead_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_admins ENABLE ROW LEVEL SECURITY;

-- Contractor policies
CREATE POLICY "Contractors can view their own profile"
ON public.supplement_contractors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Contractors can insert their own profile"
ON public.supplement_contractors FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Contractors can update their own profile"
ON public.supplement_contractors FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all contractor profiles"
ON public.supplement_contractors FOR SELECT
USING (EXISTS (SELECT 1 FROM public.supplement_admins WHERE user_id = auth.uid()));

-- Lead policies for contractors
CREATE POLICY "Contractors can view their own leads"
ON public.supplement_leads FOR SELECT
USING (EXISTS (SELECT 1 FROM public.supplement_contractors WHERE id = supplement_leads.contractor_id AND user_id = auth.uid()));

CREATE POLICY "Contractors can insert their own leads"
ON public.supplement_leads FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.supplement_contractors WHERE id = supplement_leads.contractor_id AND user_id = auth.uid()));

CREATE POLICY "Contractors can update their own leads"
ON public.supplement_leads FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.supplement_contractors WHERE id = supplement_leads.contractor_id AND user_id = auth.uid()));

-- Lead policies for admins
CREATE POLICY "Admins can view all leads"
ON public.supplement_leads FOR SELECT
USING (EXISTS (SELECT 1 FROM public.supplement_admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update all leads"
ON public.supplement_leads FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.supplement_admins WHERE user_id = auth.uid()));

-- Document policies
CREATE POLICY "Contractors can view their lead documents"
ON public.supplement_lead_documents FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.supplement_leads l
  JOIN public.supplement_contractors c ON l.contractor_id = c.id
  WHERE l.id = supplement_lead_documents.lead_id AND c.user_id = auth.uid()
));

CREATE POLICY "Contractors can insert their lead documents"
ON public.supplement_lead_documents FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.supplement_leads l
  JOIN public.supplement_contractors c ON l.contractor_id = c.id
  WHERE l.id = supplement_lead_documents.lead_id AND c.user_id = auth.uid()
));

CREATE POLICY "Contractors can delete their lead documents"
ON public.supplement_lead_documents FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.supplement_leads l
  JOIN public.supplement_contractors c ON l.contractor_id = c.id
  WHERE l.id = supplement_lead_documents.lead_id AND c.user_id = auth.uid()
));

CREATE POLICY "Admins can view all lead documents"
ON public.supplement_lead_documents FOR SELECT
USING (EXISTS (SELECT 1 FROM public.supplement_admins WHERE user_id = auth.uid()));

-- Admin policies
CREATE POLICY "Admins can view admin records"
ON public.supplement_admins FOR SELECT
USING (auth.uid() = user_id);

-- Storage bucket for supplement documents
INSERT INTO storage.buckets (id, name, public) VALUES ('supplement-documents', 'supplement-documents', false);

-- Storage policies
CREATE POLICY "Contractors can upload supplement documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'supplement-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Contractors can view their supplement documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'supplement-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all supplement documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'supplement-documents' AND EXISTS (SELECT 1 FROM public.supplement_admins WHERE user_id = auth.uid()));