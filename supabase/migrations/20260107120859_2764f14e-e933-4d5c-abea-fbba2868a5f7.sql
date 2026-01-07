-- Create table for tracking roofing quiz responses and analytics
CREATE TABLE public.roofing_quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- User info (optional if not logged in)
  user_id UUID REFERENCES auth.users(id),
  
  -- Property info from measurement
  address TEXT NOT NULL,
  city_state TEXT,
  roof_squares NUMERIC,
  
  -- Quiz answers (stored as JSONB for flexibility)
  answers JSONB NOT NULL,
  
  -- Recommendations shown
  recommendations JSONB,
  
  -- Package selection
  selected_package TEXT,
  selected_tier TEXT,
  selected_estimate_low NUMERIC,
  selected_estimate_high NUMERIC,
  
  -- Scheduling info
  appointment_type TEXT,
  appointment_scheduled BOOLEAN DEFAULT false,
  
  -- Contact info (captured at scheduling)
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  email_normalized TEXT
);

-- Enable RLS
ALTER TABLE public.roofing_quiz_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for lead capture)
CREATE POLICY "Anyone can create quiz responses" ON public.roofing_quiz_responses
  FOR INSERT WITH CHECK (true);

-- Policy: Users can view their own responses
CREATE POLICY "Users can view own quiz responses" ON public.roofing_quiz_responses
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all quiz responses
CREATE POLICY "Admins can view all quiz responses" ON public.roofing_quiz_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.roofing_admins WHERE user_id = auth.uid())
  );

-- Policy: Users can update their own responses (for adding contact info later)
CREATE POLICY "Users can update own quiz responses" ON public.roofing_quiz_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_roofing_quiz_responses_email ON public.roofing_quiz_responses(email_normalized);
CREATE INDEX idx_roofing_quiz_responses_created_at ON public.roofing_quiz_responses(created_at DESC);