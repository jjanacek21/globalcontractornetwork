-- Create storage bucket for company photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-photos',
  'company-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for company photos
CREATE POLICY "Company photos are publicly viewable" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'company-photos');

CREATE POLICY "Authenticated users can upload company photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'company-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own company photos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'company-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own company photos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'company-photos' AND auth.uid()::text = (storage.foldername(name))[1]);