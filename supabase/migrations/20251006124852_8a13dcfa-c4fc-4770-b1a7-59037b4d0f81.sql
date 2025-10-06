-- Create field_properties table for tracking door-to-door sales
CREATE TABLE public.field_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  disposition TEXT CHECK (disposition IN (
    'not_home', 
    'not_interested', 
    'interested', 
    'follow_up', 
    'new_roof', 
    'old_roof', 
    'storm_damage', 
    'inspection_scheduled', 
    'contracted'
  )),
  notes TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  last_contacted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.field_properties ENABLE ROW LEVEL SECURITY;

-- Create policies for field_properties
CREATE POLICY "Users can view all field properties"
  ON public.field_properties
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create field properties"
  ON public.field_properties
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update field properties they created or all if admin"
  ON public.field_properties
  FOR UPDATE
  USING (
    auth.uid() = created_by OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete field properties"
  ON public.field_properties
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_field_properties_updated_at
  BEFORE UPDATE ON public.field_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for geospatial queries
CREATE INDEX idx_field_properties_location ON public.field_properties(latitude, longitude);
CREATE INDEX idx_field_properties_disposition ON public.field_properties(disposition);
CREATE INDEX idx_field_properties_created_by ON public.field_properties(created_by);