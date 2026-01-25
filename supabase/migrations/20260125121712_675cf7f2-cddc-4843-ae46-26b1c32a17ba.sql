-- Enable realtime for the messaging system
ALTER PUBLICATION supabase_realtime ADD TABLE public.permit_messages;

-- Add notification tracking fields to permit_projects
ALTER TABLE permit_projects 
  ADD COLUMN IF NOT EXISTS ready_for_payment_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS city_submission_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS city_review_status TEXT DEFAULT 'not_submitted';

-- Create document library table for reusable PDFs (NOAs, licenses, etc.)
CREATE TABLE IF NOT EXISTS permit_document_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES permit_contractors(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'noa', 'ul_listing', 'fl_approval', 'contractor_license', 'insurance', 'workers_comp'
  document_name TEXT NOT NULL,
  manufacturer TEXT, -- For product approvals
  product_name TEXT,
  approval_number TEXT, -- NOA number, FL approval number, etc.
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  expiration_date DATE,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_permit_doc_library_contractor ON permit_document_library(contractor_id);
CREATE INDEX IF NOT EXISTS idx_permit_doc_library_type ON permit_document_library(document_type);
CREATE INDEX IF NOT EXISTS idx_permit_doc_library_approval ON permit_document_library(approval_number);

-- Enable RLS
ALTER TABLE permit_document_library ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all documents
CREATE POLICY "Super admins can manage document library"
  ON permit_document_library FOR ALL
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid())
  );

-- Contractors can view and insert their own documents
CREATE POLICY "Contractors can view own documents"
  ON permit_document_library FOR SELECT
  USING (contractor_id IN (
    SELECT id FROM permit_contractors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Contractors can insert own documents"
  ON permit_document_library FOR INSERT
  WITH CHECK (contractor_id IN (
    SELECT id FROM permit_contractors WHERE user_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_permit_document_library_updated_at
  BEFORE UPDATE ON permit_document_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();