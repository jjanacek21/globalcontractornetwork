-- Add new columns to property_dispositions
ALTER TABLE property_dispositions 
ADD COLUMN IF NOT EXISTS roof_type TEXT,
ADD COLUMN IF NOT EXISTS roof_condition TEXT,
ADD COLUMN IF NOT EXISTS insurance_claim BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS storm_date DATE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create property_residents table for multiple residents per property
CREATE TABLE IF NOT EXISTS property_residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES property_dispositions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for property_residents
ALTER TABLE property_residents ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_residents
CREATE POLICY "Users can view their own property residents"
ON property_residents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own property residents"
ON property_residents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own property residents"
ON property_residents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own property residents"
ON property_residents FOR DELETE
USING (auth.uid() = user_id);

-- Create property_photos table for damage photos
CREATE TABLE IF NOT EXISTS property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES property_dispositions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for property_photos
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_photos
CREATE POLICY "Users can view their own property photos"
ON property_photos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own property photos"
ON property_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own property photos"
ON property_photos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own property photos"
ON property_photos FOR DELETE
USING (auth.uid() = user_id);

-- Create property_notes table for timestamped notes history
CREATE TABLE IF NOT EXISTS property_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES property_dispositions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for property_notes
ALTER TABLE property_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_notes
CREATE POLICY "Users can view their own property notes"
ON property_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own property notes"
ON property_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own property notes"
ON property_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own property notes"
ON property_notes FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_residents_property_id ON property_residents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON property_photos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_notes_property_id ON property_notes(property_id);