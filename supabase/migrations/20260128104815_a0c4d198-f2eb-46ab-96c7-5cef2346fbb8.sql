-- Add last_analyzed_at column if not exists
ALTER TABLE permit_form_templates 
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ;

-- Reset stuck documents so they can be re-analyzed
UPDATE permit_form_templates 
SET analysis_status = 'pending'
WHERE analysis_status = 'analyzing'
AND created_at < NOW() - INTERVAL '10 minutes';