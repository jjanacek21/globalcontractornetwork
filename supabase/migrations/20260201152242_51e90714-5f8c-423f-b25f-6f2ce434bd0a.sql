-- Create property_dispositions table for persisting property status
CREATE TABLE public.property_dispositions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  lat_lng_hash TEXT NOT NULL,
  address TEXT,
  disposition TEXT NOT NULL DEFAULT 'not_contacted',
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_disposition CHECK (disposition IN ('not_contacted', 'not_home', 'not_interested', 'go_back', 'interested', 'needs_inspection', 'appointment_set', 'contract_signed'))
);

-- Create unique constraint on user_id + lat_lng_hash
CREATE UNIQUE INDEX idx_property_dispositions_user_hash ON public.property_dispositions(user_id, lat_lng_hash);

-- Create index for bounds queries
CREATE INDEX idx_property_dispositions_bounds ON public.property_dispositions(user_id, lat, lng);

-- Enable RLS
ALTER TABLE public.property_dispositions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own property dispositions"
ON public.property_dispositions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own property dispositions"
ON public.property_dispositions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own property dispositions"
ON public.property_dispositions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own property dispositions"
ON public.property_dispositions FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_property_dispositions_updated_at
BEFORE UPDATE ON public.property_dispositions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();