-- Create storage bucket for job photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload job photos
CREATE POLICY "Users can upload job photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-photos');

-- Allow public read access to job photos
CREATE POLICY "Job photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-photos');

-- Allow users to delete their own job photos
CREATE POLICY "Users can delete their job photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'job-photos');