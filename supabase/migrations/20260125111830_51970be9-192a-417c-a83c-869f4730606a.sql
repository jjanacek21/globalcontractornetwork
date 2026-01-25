-- Add processing columns to permit_project_documents for AI extraction
ALTER TABLE permit_project_documents
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS extracted_data JSONB,
ADD COLUMN IF NOT EXISTS fields_populated TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN permit_project_documents.processing_status IS 'AI processing status: pending, processing, complete, failed';
COMMENT ON COLUMN permit_project_documents.extracted_data IS 'JSON data extracted by AI from uploaded documents';
COMMENT ON COLUMN permit_project_documents.fields_populated IS 'Array of permit form field names populated from this document';