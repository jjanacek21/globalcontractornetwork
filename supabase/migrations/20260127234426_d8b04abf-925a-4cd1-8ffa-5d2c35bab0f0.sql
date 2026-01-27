-- Add new columns to product_approvals for tracking AI extraction
ALTER TABLE public.product_approvals
ADD COLUMN IF NOT EXISTS ai_extracted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS source_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS specifications JSONB;

-- Create index for faster querying of products needing PDFs
CREATE INDEX IF NOT EXISTS idx_product_approvals_source_status 
ON public.product_approvals(source_status);

CREATE INDEX IF NOT EXISTS idx_product_approvals_file_url_null 
ON public.product_approvals(id) 
WHERE file_url IS NULL;