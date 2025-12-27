-- Create login_requests table for service access requests with escalation tracking
CREATE TABLE public.login_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  service_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  is_auto_approved BOOLEAN DEFAULT false,
  is_escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalation_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  request_notes TEXT,
  admin_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.login_requests ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all login requests
CREATE POLICY "Super admins can manage all login requests" 
  ON public.login_requests 
  FOR ALL 
  TO authenticated
  USING (public.is_super_admin());

-- Users can view their own login requests
CREATE POLICY "Users can view their own login requests" 
  ON public.login_requests 
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own login requests
CREATE POLICY "Users can create their own login requests" 
  ON public.login_requests 
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Enable realtime for live notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.login_requests;

-- Create index for efficient queries on pending requests
CREATE INDEX idx_login_requests_status ON public.login_requests(status);
CREATE INDEX idx_login_requests_escalated ON public.login_requests(is_escalated) WHERE status = 'pending';