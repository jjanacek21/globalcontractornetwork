-- Add storage policies for door-to-door-videos bucket

-- Policy: Users can upload their own videos (path must start with their user ID)
CREATE POLICY "Users can upload door-to-door videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'door-to-door-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own videos
CREATE POLICY "Users can view own door-to-door videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'door-to-door-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own videos
CREATE POLICY "Users can update own door-to-door videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'door-to-door-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own videos
CREATE POLICY "Users can delete own door-to-door videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'door-to-door-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);