-- Create coating_leads table for lead capture
CREATE TABLE IF NOT EXISTS public.coating_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  property_address TEXT NOT NULL,
  roof_type TEXT NOT NULL,
  coating_type TEXT NOT NULL,
  estimated_sqft NUMERIC,
  estimate_low NUMERIC,
  estimate_high NUMERIC,
  property_type TEXT,
  urgency TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coating_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit leads
CREATE POLICY "Anyone can submit coating leads"
  ON public.coating_leads
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can view all leads
CREATE POLICY "Admins can view all coating leads"
  ON public.coating_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update leads
CREATE POLICY "Admins can update coating leads"
  ON public.coating_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_coating_leads_updated_at
  BEFORE UPDATE ON public.coating_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();