-- Create contractor_feature_access table for granular feature permissions
CREATE TABLE public.contractor_feature_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contractor_id, feature_name)
);

-- Enable Row Level Security
ALTER TABLE public.contractor_feature_access ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all feature access
CREATE POLICY "Super admins can manage feature access" 
ON public.contractor_feature_access
FOR ALL 
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Contractors can view their own feature access
CREATE POLICY "Contractors can view their own feature access" 
ON public.contractor_feature_access
FOR SELECT 
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM public.contractor_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contractor_feature_access_updated_at
BEFORE UPDATE ON public.contractor_feature_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();