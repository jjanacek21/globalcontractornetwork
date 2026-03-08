
-- CRM Jobs table for job/project tracking
CREATE TABLE public.crm_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  assigned_rep_id UUID REFERENCES public.company_members(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  job_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  stage TEXT NOT NULL DEFAULT 'new_lead',
  priority TEXT DEFAULT 'medium',
  job_type TEXT DEFAULT 'roofing',
  contract_amount NUMERIC(12,2) DEFAULT 0,
  collected_amount NUMERIC(12,2) DEFAULT 0,
  scheduled_date DATE,
  start_date DATE,
  completion_date DATE,
  notes TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Production tracking
CREATE TABLE public.crm_production (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.crm_jobs(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES public.company_members(id) ON DELETE SET NULL,
  scheduled_date DATE,
  completed_date DATE,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_production ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_jobs
CREATE POLICY "Users can view their company jobs" ON public.crm_jobs
  FOR SELECT TO authenticated
  USING (public.is_company_member(company_id) OR created_by = auth.uid());

CREATE POLICY "Users can insert jobs for their company" ON public.crm_jobs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id) OR created_by = auth.uid());

CREATE POLICY "Users can update their company jobs" ON public.crm_jobs
  FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id) OR created_by = auth.uid());

CREATE POLICY "Users can delete their company jobs" ON public.crm_jobs
  FOR DELETE TO authenticated
  USING (public.is_company_member(company_id) OR created_by = auth.uid());

-- RLS policies for crm_production
CREATE POLICY "Users can view their company production" ON public.crm_production
  FOR SELECT TO authenticated
  USING (public.is_company_member(company_id));

CREATE POLICY "Users can manage their company production" ON public.crm_production
  FOR ALL TO authenticated
  USING (public.is_company_member(company_id));

-- Auto-update timestamps
CREATE TRIGGER update_crm_jobs_updated_at
  BEFORE UPDATE ON public.crm_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_production_updated_at
  BEFORE UPDATE ON public.crm_production
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
