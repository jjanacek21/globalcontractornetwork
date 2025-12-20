-- Create window_leads table for Green Home Improvements
CREATE TABLE public.window_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  property_address TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'FL',
  zip_code TEXT,
  window_selections JSONB,
  total_windows INTEGER,
  performance_level TEXT,
  interior_color TEXT,
  exterior_color TEXT,
  glass_type TEXT,
  grid_style TEXT,
  existing_window_type TEXT,
  financing_option TEXT,
  discount_type TEXT,
  estimate_low NUMERIC,
  estimate_high NUMERIC,
  discount_percent INTEGER,
  discounted_price NUMERIC,
  spin_result TEXT,
  appointment_date DATE,
  appointment_time TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  show_as_winner BOOLEAN DEFAULT false,
  testimonial_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create window_admins table
CREATE TABLE public.window_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.window_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.window_admins ENABLE ROW LEVEL SECURITY;

-- Window leads policies
CREATE POLICY "Anyone can submit window leads" ON public.window_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Window admins can view all leads" ON public.window_leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.window_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Window admins can update leads" ON public.window_leads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.window_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Super admins can view all window leads" ON public.window_leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
  );

-- Window admins policies
CREATE POLICY "Window admins can view own record" ON public.window_admins
  FOR SELECT USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER update_window_leads_updated_at
  BEFORE UPDATE ON public.window_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();