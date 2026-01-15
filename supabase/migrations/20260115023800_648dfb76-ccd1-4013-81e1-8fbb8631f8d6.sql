-- Create job_requests table
CREATE TABLE public.job_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job Details
  title TEXT NOT NULL,
  description TEXT,
  service_category TEXT NOT NULL,
  urgency TEXT DEFAULT 'standard' CHECK (urgency IN ('emergency', 'urgent', 'standard', 'flexible')),
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  timeline TEXT CHECK (timeline IN ('asap', 'this_week', 'this_month', 'flexible')),
  
  -- Location
  property_address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  
  -- Media
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  max_responses INTEGER DEFAULT 5,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days')
);

-- Create job_responses table
CREATE TABLE public.job_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_requests(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  
  -- Response Details
  message TEXT,
  proposed_amount NUMERIC(10,2),
  estimated_duration TEXT,
  available_start_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(job_id, contractor_id)
);

-- Enable RLS
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_requests
CREATE POLICY "homeowners_crud_own_jobs" ON public.job_requests
  FOR ALL USING (auth.uid() = homeowner_id);

CREATE POLICY "contractors_view_open_jobs" ON public.job_requests
  FOR SELECT USING (status = 'open');

-- RLS Policies for job_responses
CREATE POLICY "contractors_crud_own_responses" ON public.job_responses
  FOR ALL USING (
    contractor_id IN (SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "homeowners_view_job_responses" ON public.job_responses
  FOR SELECT USING (
    job_id IN (SELECT id FROM public.job_requests WHERE homeowner_id = auth.uid())
  );

CREATE POLICY "homeowners_update_response_status" ON public.job_responses
  FOR UPDATE USING (
    job_id IN (SELECT id FROM public.job_requests WHERE homeowner_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX idx_job_requests_location ON public.job_requests(lat, lng);
CREATE INDEX idx_job_requests_category ON public.job_requests(service_category);
CREATE INDEX idx_job_requests_status ON public.job_requests(status);
CREATE INDEX idx_job_requests_homeowner ON public.job_requests(homeowner_id);
CREATE INDEX idx_job_responses_job ON public.job_responses(job_id);
CREATE INDEX idx_job_responses_contractor ON public.job_responses(contractor_id);

-- Enable realtime for job_responses
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_responses;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_job_requests_updated_at
  BEFORE UPDATE ON public.job_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_responses_updated_at
  BEFORE UPDATE ON public.job_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();