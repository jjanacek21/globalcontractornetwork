-- Create homeowner_estimates table for storing user estimate history
CREATE TABLE public.homeowner_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_normalized TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'roofing',
  estimate_name TEXT NOT NULL,
  property_address TEXT,
  estimate_low NUMERIC(12,2),
  estimate_high NUMERIC(12,2),
  line_items JSONB,
  estimate_data JSONB,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft',
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  signed_ip TEXT,
  terms_agreed BOOLEAN DEFAULT FALSE,
  estimate_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX idx_homeowner_estimates_user_id ON homeowner_estimates(user_id);
CREATE INDEX idx_homeowner_estimates_email ON homeowner_estimates(email_normalized);
CREATE INDEX idx_homeowner_estimates_created ON homeowner_estimates(created_at DESC);

-- Enable RLS
ALTER TABLE homeowner_estimates ENABLE ROW LEVEL SECURITY;

-- Users can view estimates linked to their account or email
CREATE POLICY "Users can view own estimates" ON homeowner_estimates
  FOR SELECT USING (
    user_id = auth.uid() OR 
    email_normalized = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
  );

-- Allow inserting estimates (authenticated or anonymous for lead capture)
CREATE POLICY "Anyone can create estimates" ON homeowner_estimates
  FOR INSERT WITH CHECK (true);

-- Users can update their own estimates
CREATE POLICY "Users can update own estimates" ON homeowner_estimates
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    email_normalized = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
  );