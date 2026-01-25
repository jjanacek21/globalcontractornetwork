-- Extend permit_packet_training table for full training workflow
ALTER TABLE permit_packet_training
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS training_usage_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS raw_text_content TEXT,
  ADD COLUMN IF NOT EXISTS extracted_documents JSONB;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_permit_training_county_trade 
  ON permit_packet_training(county, trade_type);
CREATE INDEX IF NOT EXISTS idx_permit_training_status 
  ON permit_packet_training(processing_status);
CREATE INDEX IF NOT EXISTS idx_permit_training_uploaded_at 
  ON permit_packet_training(uploaded_at DESC);

-- Create permit_training_files table for multi-file uploads
CREATE TABLE IF NOT EXISTS permit_training_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES permit_packet_training(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes INTEGER,
  page_count INTEGER,
  ocr_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on permit_training_files
ALTER TABLE permit_training_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for permit_packet_training - super admins full access
CREATE POLICY "Super admins can manage permit training data"
  ON permit_packet_training FOR ALL
  USING (public.is_super_admin());

-- RLS policies for permit_packet_training - permit admins can view and insert
CREATE POLICY "Permit admins can view permit training data"
  ON permit_packet_training FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM permit_admins
      WHERE permit_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Permit admins can insert permit training data"
  ON permit_packet_training FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM permit_admins
      WHERE permit_admins.user_id = auth.uid()
    )
  );

-- RLS policies for permit_training_files
CREATE POLICY "Super admins can manage training files"
  ON permit_training_files FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "Permit admins can view training files"
  ON permit_training_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM permit_admins
      WHERE permit_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Permit admins can insert training files"
  ON permit_training_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM permit_admins
      WHERE permit_admins.user_id = auth.uid()
    )
  );

-- Create storage bucket for training packets if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('permit-training-packets', 'permit-training-packets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for permit-training-packets bucket
CREATE POLICY "Super admins can manage training packet files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'permit-training-packets' AND public.is_super_admin());

CREATE POLICY "Permit admins can upload training packet files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'permit-training-packets' 
    AND EXISTS (
      SELECT 1 FROM permit_admins
      WHERE permit_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Permit admins can view training packet files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'permit-training-packets' 
    AND EXISTS (
      SELECT 1 FROM permit_admins
      WHERE permit_admins.user_id = auth.uid()
    )
  );