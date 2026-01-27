-- Create permit_training_books table for educational materials
CREATE TABLE IF NOT EXISTS permit_training_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  target_county TEXT DEFAULT 'all',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  page_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  processing_status TEXT DEFAULT 'pending',
  extracted_text TEXT,
  extracted_chapters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE permit_training_books ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read books
CREATE POLICY "Allow read access to permit books" 
  ON permit_training_books FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow permit admins to manage books (using existing permit_admins table structure)
CREATE POLICY "Allow admin management of permit books" 
  ON permit_training_books FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM permit_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Update trigger for updated_at
CREATE TRIGGER update_permit_training_books_updated_at
  BEFORE UPDATE ON permit_training_books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for books (via insert if not exists pattern)
INSERT INTO storage.buckets (id, name, public)
VALUES ('permit-training-books', 'permit-training-books', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for permit-training-books bucket
CREATE POLICY "Allow authenticated read on permit-training-books"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'permit-training-books');

CREATE POLICY "Allow admin upload on permit-training-books"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'permit-training-books' AND
    EXISTS (
      SELECT 1 FROM permit_admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow admin delete on permit-training-books"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'permit-training-books' AND
    EXISTS (
      SELECT 1 FROM permit_admins 
      WHERE user_id = auth.uid()
    )
  );