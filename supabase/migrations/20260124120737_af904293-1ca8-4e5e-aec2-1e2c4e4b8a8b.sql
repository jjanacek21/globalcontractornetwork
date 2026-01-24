-- Add source status tracking columns
ALTER TABLE product_approvals 
ADD COLUMN IF NOT EXISTS source_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS source_website TEXT,
ADD COLUMN IF NOT EXISTS last_source_attempt TIMESTAMPTZ;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_product_approvals_source_status 
ON product_approvals(source_status);

-- Clear broken Miami-Dade URLs that don't work anymore
UPDATE product_approvals 
SET file_url = NULL, noa_pdf_url = NULL 
WHERE file_url LIKE '%miamidade.gov%';