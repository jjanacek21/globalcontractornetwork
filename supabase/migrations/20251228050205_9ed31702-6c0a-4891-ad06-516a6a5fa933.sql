-- Create marketing_leads table for lead capture
CREATE TABLE public.marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  service_interest TEXT,
  budget_range TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public lead form)
CREATE POLICY "Anyone can submit marketing leads"
ON public.marketing_leads
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view leads
CREATE POLICY "Authenticated users can view marketing leads"
ON public.marketing_leads
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger
CREATE TRIGGER update_marketing_leads_updated_at
BEFORE UPDATE ON public.marketing_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();