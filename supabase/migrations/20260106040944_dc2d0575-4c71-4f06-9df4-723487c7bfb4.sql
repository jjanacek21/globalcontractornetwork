-- Create job_stage enum for the One Pipeline CRM
CREATE TYPE job_stage AS ENUM (
  'new_lead',
  'contacted',
  'inspection_scheduled',
  'inspection_completed',
  'estimate_sent',
  'presented',
  'won',
  'permitting',
  'material_ordered',
  'scheduled',
  'in_production',
  'final_walkthrough',
  'invoice_sent',
  'paid',
  'closed_out',
  'lost'
);

-- Create canvassing_disposition enum
CREATE TYPE canvassing_disposition AS ENUM (
  'not_home',
  'not_interested',
  'follow_up',
  'appointment_set',
  'sold',
  'bad_data'
);

-- Create jobs table (central One Pipeline record)
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  stage job_stage NOT NULL DEFAULT 'new_lead',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  service_type TEXT,
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  assigned_rep_id UUID REFERENCES public.company_members(id) ON DELETE SET NULL,
  assigned_pm_id UUID REFERENCES public.company_members(id) ON DELETE SET NULL,
  assigned_crew_id UUID REFERENCES public.company_members(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'manual',
  rep_card_data JSONB DEFAULT '{}',
  measurement_data JSONB DEFAULT '{}',
  appointment_at TIMESTAMPTZ,
  contract_signed_at TIMESTAMPTZ,
  contract_amount NUMERIC(12,2) DEFAULT 0,
  cogs_budget JSONB DEFAULT '{"materials": 0, "labor": 0, "subcontractors": 0, "permits": 0, "dump": 0}',
  gross_profit_estimate NUMERIC(12,2) DEFAULT 0,
  commission_forecast JSONB DEFAULT '{"rep": 0, "manager": 0, "bonus": 0}',
  lost_reason TEXT,
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create job_tasks table
CREATE TABLE public.job_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.company_members(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create job_invoices table
CREATE TABLE public.job_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT DEFAULT 'final' CHECK (invoice_type IN ('deposit', 'progress', 'final')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  sent_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create canvassing_logs table
CREATE TABLE public.canvassing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  address TEXT,
  rep_id UUID REFERENCES public.company_members(id) ON DELETE SET NULL,
  disposition canvassing_disposition NOT NULL,
  follow_up_at TIMESTAMPTZ,
  notes TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvassing_logs ENABLE ROW LEVEL SECURITY;

-- Jobs RLS policies
CREATE POLICY "Company members can view their jobs"
  ON public.jobs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update their jobs"
  ON public.jobs FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete their jobs"
  ON public.jobs FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid()
    )
  );

-- Job tasks RLS policies
CREATE POLICY "Users can view tasks for their company jobs"
  ON public.job_tasks FOR SELECT
  USING (
    job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.company_members cm ON cm.company_id = j.company_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tasks for their company jobs"
  ON public.job_tasks FOR ALL
  USING (
    job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.company_members cm ON cm.company_id = j.company_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Job invoices RLS policies
CREATE POLICY "Users can view invoices for their company jobs"
  ON public.job_invoices FOR SELECT
  USING (
    job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.company_members cm ON cm.company_id = j.company_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage invoices for their company jobs"
  ON public.job_invoices FOR ALL
  USING (
    job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.company_members cm ON cm.company_id = j.company_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Canvassing logs RLS policies
CREATE POLICY "Company members can view their canvassing logs"
  ON public.canvassing_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can manage their canvassing logs"
  ON public.canvassing_logs FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger to auto-update updated_at on jobs
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create initial task when job is created as new_lead
CREATE OR REPLACE FUNCTION public.create_initial_job_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage = 'new_lead' THEN
    INSERT INTO public.job_tasks (job_id, title, due_at, priority)
    VALUES (NEW.id, 'Call new lead within 5 minutes', NOW() + INTERVAL '5 minutes', 'high');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create initial task on job insert
CREATE TRIGGER create_initial_job_task_trigger
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_initial_job_task();

-- Create indexes for performance
CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_stage ON public.jobs(stage);
CREATE INDEX idx_jobs_contact_id ON public.jobs(contact_id);
CREATE INDEX idx_jobs_property_id ON public.jobs(property_id);
CREATE INDEX idx_job_tasks_job_id ON public.job_tasks(job_id);
CREATE INDEX idx_job_tasks_status ON public.job_tasks(status);
CREATE INDEX idx_job_invoices_job_id ON public.job_invoices(job_id);
CREATE INDEX idx_canvassing_logs_company_id ON public.canvassing_logs(company_id);