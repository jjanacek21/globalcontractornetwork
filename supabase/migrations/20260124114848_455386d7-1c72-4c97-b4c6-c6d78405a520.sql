-- Add new columns to product_approvals for storing different document types
ALTER TABLE product_approvals 
ADD COLUMN IF NOT EXISTS noa_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS fl_approval_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS ul_listing_url TEXT;

-- Populate FL Approval URLs for products with approval numbers
-- Florida Building Product Approval portal URL pattern
UPDATE product_approvals 
SET fl_approval_pdf_url = CONCAT(
  'https://www.floridabuilding.org/pr/pr_app_dtl.aspx?param=',
  fl_product_approval
)
WHERE fl_product_approval IS NOT NULL 
  AND fl_approval_pdf_url IS NULL;

-- Set file_url from FL approval URL if not already set
UPDATE product_approvals 
SET file_url = fl_approval_pdf_url
WHERE fl_approval_pdf_url IS NOT NULL 
  AND file_url IS NULL;

-- Create storage policies for permit-documents bucket if not exists
-- First check if bucket exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'permit-documents') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('permit-documents', 'permit-documents', true);
  END IF;
END $$;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own permit documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own permit documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload permit documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view permit documents" ON storage.objects;

-- Create INSERT policy for authenticated users uploading to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'permit-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create SELECT policy for viewing own permit documents
CREATE POLICY "Users can view own permit documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'permit-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create DELETE policy for deleting own permit documents
CREATE POLICY "Users can delete own permit documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'permit-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access for product-approvals bucket (NOA documents)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-approvals') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('product-approvals', 'product-approvals', true);
  END IF;
END $$;

DROP POLICY IF EXISTS "Public can view product approvals" ON storage.objects;
CREATE POLICY "Public can view product approvals"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-approvals');

DROP POLICY IF EXISTS "Admins can upload product approvals" ON storage.objects;
CREATE POLICY "Admins can upload product approvals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-approvals');