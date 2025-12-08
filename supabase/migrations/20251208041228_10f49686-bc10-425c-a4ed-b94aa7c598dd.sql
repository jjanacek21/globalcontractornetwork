-- Create table for roofing consultation responses and appointments
CREATE TABLE public.roofing_consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roof_type TEXT,
  priority TEXT,
  timeline TEXT,
  budget TEXT,
  zip_code TEXT,
  sqft INTEGER,
  recommended_package TEXT,
  estimated_price NUMERIC,
  appointment_type TEXT, -- 'zoom' or 'in_person'
  appointment_date DATE,
  appointment_time TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roofing_consultations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can submit roofing consultations"
ON public.roofing_consultations
FOR INSERT
WITH CHECK (true);

-- Admins can view all consultations
CREATE POLICY "Admins can view all consultations"
ON public.roofing_consultations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update consultations
CREATE POLICY "Admins can update consultations"
ON public.roofing_consultations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));