-- Storage bucket for product approval documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-approvals', 'product-approvals', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access for product approvals
CREATE POLICY "Public read access for product approvals"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-approvals');

-- Allow authenticated users to upload (admin check in application layer)
CREATE POLICY "Authenticated upload for product approvals"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-approvals' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated update for product approvals"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-approvals' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated delete for product approvals"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-approvals' AND auth.role() = 'authenticated');