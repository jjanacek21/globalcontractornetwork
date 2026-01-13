-- Add columns for uploaded measurement reports
ALTER TABLE ai_training_sessions ADD COLUMN IF NOT EXISTS report_url TEXT;
ALTER TABLE ai_training_sessions ADD COLUMN IF NOT EXISTS report_type TEXT;
ALTER TABLE ai_training_sessions ADD COLUMN IF NOT EXISTS report_parsed_data JSONB;
ALTER TABLE ai_training_sessions ADD COLUMN IF NOT EXISTS report_uploaded_at TIMESTAMPTZ;
ALTER TABLE ai_training_sessions ADD COLUMN IF NOT EXISTS report_uploaded_by UUID;

-- Create a private bucket for training reports (PDFs, images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-training-reports', 'ai-training-reports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the storage bucket - super admins only
CREATE POLICY "Super admins can upload training reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ai-training-reports' 
  AND EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Super admins can view training reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ai-training-reports' 
  AND EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Super admins can delete training reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ai-training-reports' 
  AND EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);