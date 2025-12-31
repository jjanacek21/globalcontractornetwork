-- Create homeowner_projects table to track homeowner's quotes and projects
CREATE TABLE public.homeowner_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  property_address TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'FL',
  zip_code TEXT,
  lat NUMERIC,
  lng NUMERIC,
  status TEXT NOT NULL DEFAULT 'quote_requested' CHECK (status IN ('quote_requested', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  ai_estimate_low NUMERIC,
  ai_estimate_high NUMERIC,
  official_quote NUMERIC,
  assigned_contractor_id UUID REFERENCES public.contractor_profiles(id),
  project_details JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_messages table for project-specific chat
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.homeowner_projects(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('homeowner', 'contractor')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contractor_leads table to track leads assigned to contractors
CREATE TABLE public.contractor_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id),
  project_id UUID NOT NULL REFERENCES public.homeowner_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'accepted', 'declined', 'completed')),
  quoted_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contractor_id, project_id)
);

-- Create contractor_jobs table for job pipeline management
CREATE TABLE public.contractor_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id),
  project_id UUID REFERENCES public.homeowner_projects(id),
  homeowner_name TEXT NOT NULL,
  homeowner_phone TEXT,
  homeowner_email TEXT,
  property_address TEXT NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_date DATE,
  scheduled_time TEXT,
  quoted_amount NUMERIC,
  collected_amount NUMERIC DEFAULT 0,
  job_details JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.homeowner_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homeowner_projects
CREATE POLICY "Homeowners can view their own projects"
ON public.homeowner_projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Homeowners can create their own projects"
ON public.homeowner_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Homeowners can update their own projects"
ON public.homeowner_projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Assigned contractors can view projects"
ON public.homeowner_projects FOR SELECT
USING (assigned_contractor_id IN (
  SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Super admins can manage all projects"
ON public.homeowner_projects FOR ALL
USING (is_super_admin());

-- RLS Policies for project_messages
CREATE POLICY "Homeowners can view messages for their projects"
ON public.project_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.homeowner_projects
  WHERE id = project_messages.project_id AND user_id = auth.uid()
));

CREATE POLICY "Contractors can view messages for assigned projects"
ON public.project_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.homeowner_projects hp
  JOIN public.contractor_profiles cp ON hp.assigned_contractor_id = cp.id
  WHERE hp.id = project_messages.project_id AND cp.user_id = auth.uid()
));

CREATE POLICY "Homeowners can send messages to their projects"
ON public.project_messages FOR INSERT
WITH CHECK (
  sender_type = 'homeowner' AND
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.homeowner_projects
    WHERE id = project_messages.project_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Contractors can send messages to assigned projects"
ON public.project_messages FOR INSERT
WITH CHECK (
  sender_type = 'contractor' AND
  EXISTS (
    SELECT 1 FROM public.homeowner_projects hp
    JOIN public.contractor_profiles cp ON hp.assigned_contractor_id = cp.id
    WHERE hp.id = project_messages.project_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all messages"
ON public.project_messages FOR ALL
USING (is_super_admin());

-- RLS Policies for contractor_leads
CREATE POLICY "Contractors can view their own leads"
ON public.contractor_leads FOR SELECT
USING (contractor_id IN (
  SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Contractors can update their own leads"
ON public.contractor_leads FOR UPDATE
USING (contractor_id IN (
  SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "System can create leads for contractors"
ON public.contractor_leads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Super admins can manage all leads"
ON public.contractor_leads FOR ALL
USING (is_super_admin());

-- RLS Policies for contractor_jobs
CREATE POLICY "Contractors can view their own jobs"
ON public.contractor_jobs FOR SELECT
USING (contractor_id IN (
  SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Contractors can create their own jobs"
ON public.contractor_jobs FOR INSERT
WITH CHECK (contractor_id IN (
  SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Contractors can update their own jobs"
ON public.contractor_jobs FOR UPDATE
USING (contractor_id IN (
  SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Contractors can delete their own jobs"
ON public.contractor_jobs FOR DELETE
USING (contractor_id IN (
  SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Super admins can manage all jobs"
ON public.contractor_jobs FOR ALL
USING (is_super_admin());

-- Create updated_at triggers
CREATE TRIGGER update_homeowner_projects_updated_at
BEFORE UPDATE ON public.homeowner_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contractor_leads_updated_at
BEFORE UPDATE ON public.contractor_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contractor_jobs_updated_at
BEFORE UPDATE ON public.contractor_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for project_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;