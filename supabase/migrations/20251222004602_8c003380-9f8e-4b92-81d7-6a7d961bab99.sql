-- Create company_role enum
CREATE TYPE public.company_role AS ENUM (
  'company_admin',
  'manager',
  'project_manager',
  'sales_rep',
  'crew'
);

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create teams table first (referenced by company_members)
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create company_members table
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'sales_rep',
  manager_id UUID REFERENCES public.company_members(id),
  team_id UUID REFERENCES public.teams(id),
  is_active BOOLEAN DEFAULT true,
  job_title TEXT,
  hire_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Add manager_id to teams (after company_members exists)
ALTER TABLE public.teams ADD COLUMN manager_id UUID REFERENCES public.company_members(id);

-- Create work_orders table
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  assigned_crew_id UUID REFERENCES public.company_members(id),
  assigned_rep_id UUID REFERENCES public.company_members(id),
  scheduled_date DATE,
  scheduled_time TEXT,
  status TEXT DEFAULT 'pending',
  job_type TEXT,
  job_details JSONB,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create work_order_photos table
CREATE TABLE public.work_order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.company_members(id),
  file_path TEXT NOT NULL,
  file_name TEXT,
  notes TEXT,
  photo_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create material_requests table
CREATE TABLE public.material_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.company_members(id),
  materials TEXT NOT NULL,
  quantity TEXT,
  urgency TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES public.company_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add company_id to customers table for tenant isolation
ALTER TABLE public.customers ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Enable RLS on all new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is a member of a company
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = auth.uid()
    AND company_id = _company_id
    AND is_active = true
  )
$$;

-- Helper function: Get user's role in a company
CREATE OR REPLACE FUNCTION public.get_company_role(_company_id UUID)
RETURNS public.company_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.company_members
  WHERE user_id = auth.uid()
  AND company_id = _company_id
  AND is_active = true
  LIMIT 1
$$;

-- Helper function: Check if user is company admin or super admin
CREATE OR REPLACE FUNCTION public.is_company_or_super_admin(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = auth.uid()
    AND company_id = _company_id
    AND role = 'company_admin'
    AND is_active = true
  )
$$;

-- Helper function: Check if super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  )
$$;

-- RLS Policies for companies
CREATE POLICY "Super admins can do all on companies"
ON public.companies FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Company members can view their company"
ON public.companies FOR SELECT
USING (public.is_company_member(id));

-- RLS Policies for company_members
CREATE POLICY "Super admins can do all on company_members"
ON public.company_members FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Company admins can manage their company members"
ON public.company_members FOR ALL
USING (public.is_company_or_super_admin(company_id));

CREATE POLICY "Members can view their company colleagues"
ON public.company_members FOR SELECT
USING (public.is_company_member(company_id));

-- RLS Policies for teams
CREATE POLICY "Super admins can do all on teams"
ON public.teams FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Company admins can manage teams"
ON public.teams FOR ALL
USING (public.is_company_or_super_admin(company_id));

CREATE POLICY "Members can view their company teams"
ON public.teams FOR SELECT
USING (public.is_company_member(company_id));

-- RLS Policies for work_orders
CREATE POLICY "Super admins can do all on work_orders"
ON public.work_orders FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Company admins can manage work orders"
ON public.work_orders FOR ALL
USING (public.is_company_or_super_admin(company_id));

CREATE POLICY "Company members can view their company work orders"
ON public.work_orders FOR SELECT
USING (public.is_company_member(company_id));

CREATE POLICY "Crew can update their assigned work orders"
ON public.work_orders FOR UPDATE
USING (
  assigned_crew_id IN (
    SELECT id FROM public.company_members WHERE user_id = auth.uid()
  )
);

-- RLS Policies for work_order_photos
CREATE POLICY "Super admins can do all on work_order_photos"
ON public.work_order_photos FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Company members can view work order photos"
ON public.work_order_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.work_orders wo
    WHERE wo.id = work_order_id
    AND public.is_company_member(wo.company_id)
  )
);

CREATE POLICY "Crew can add photos to assigned work orders"
ON public.work_order_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.work_orders wo
    WHERE wo.id = work_order_id
    AND wo.assigned_crew_id IN (
      SELECT id FROM public.company_members WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for material_requests
CREATE POLICY "Super admins can do all on material_requests"
ON public.material_requests FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Company admins can manage material requests"
ON public.material_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.work_orders wo
    WHERE wo.id = work_order_id
    AND public.is_company_or_super_admin(wo.company_id)
  )
);

CREATE POLICY "Company members can view material requests"
ON public.material_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.work_orders wo
    WHERE wo.id = work_order_id
    AND public.is_company_member(wo.company_id)
  )
);

CREATE POLICY "Crew can create material requests"
ON public.material_requests FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.work_orders wo
    WHERE wo.id = work_order_id
    AND wo.assigned_crew_id IN (
      SELECT id FROM public.company_members WHERE user_id = auth.uid()
    )
  )
);

-- Update customers RLS to include company isolation
CREATE POLICY "Company members can view their company customers"
ON public.customers FOR SELECT
USING (
  company_id IS NULL OR public.is_company_member(company_id)
);

CREATE POLICY "Company admins can manage their company customers"
ON public.customers FOR ALL
USING (
  company_id IS NOT NULL AND public.is_company_or_super_admin(company_id)
);