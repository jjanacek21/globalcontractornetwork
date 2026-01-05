-- Create homeowner_photos table for photo uploads
CREATE TABLE public.homeowner_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.homeowner_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for homeowner_photos
CREATE POLICY "Users can view their own photos"
ON public.homeowner_photos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own photos"
ON public.homeowner_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
ON public.homeowner_photos FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for homeowner uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('homeowner-uploads', 'homeowner-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for homeowner-uploads bucket
CREATE POLICY "Users can view their own uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'homeowner-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'homeowner-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'homeowner-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add price_tier and availability_days to contractor_profiles
ALTER TABLE public.contractor_profiles 
ADD COLUMN IF NOT EXISTS price_tier TEXT,
ADD COLUMN IF NOT EXISTS availability_days INTEGER;