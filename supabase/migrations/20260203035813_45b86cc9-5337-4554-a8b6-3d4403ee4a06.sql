-- Storage policies for door-to-door-videos bucket
-- Allow authenticated users to upload their own videos
CREATE POLICY "Users can upload door to door videos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'door-to-door-videos' 
  AND auth.role() = 'authenticated'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow users to view their own videos
CREATE POLICY "Users can view their door to door videos" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'door-to-door-videos' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow all authenticated users to view videos in the feed (public read for the bucket)
CREATE POLICY "All users can view door to door videos in feed" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'door-to-door-videos');

-- Allow users to delete their own videos
CREATE POLICY "Users can delete their door to door videos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'door-to-door-videos' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);