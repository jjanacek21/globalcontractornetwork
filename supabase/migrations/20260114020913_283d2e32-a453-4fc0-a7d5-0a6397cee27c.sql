-- Add new columns to companies table for enhanced credentials
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS licenses JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS insurance_document_url TEXT,
ADD COLUMN IF NOT EXISTS workers_comp_document_url TEXT,
ADD COLUMN IF NOT EXISTS has_crew BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credential_warnings JSONB DEFAULT '{}'::jsonb;

-- Create admin_notifications table for super admin alerts
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  read_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Super admins can view all notifications
CREATE POLICY "Super admins can view all notifications"
ON public.admin_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  )
);

-- Super admins can update notifications (mark as read)
CREATE POLICY "Super admins can update notifications"
ON public.admin_notifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  )
);

-- System can insert notifications (for edge functions)
CREATE POLICY "System can insert notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (true);

-- Create company-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company-documents bucket
CREATE POLICY "Authenticated users can upload company documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their company documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'company-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Super admins can view all company documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'company-documents'
  AND EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  )
);

-- Create index for faster queries on admin notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_severity ON public.admin_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- Add index for credential expiration queries on companies
CREATE INDEX IF NOT EXISTS idx_companies_insurance_expiration ON public.companies(insurance_expiration);
CREATE INDEX IF NOT EXISTS idx_companies_workers_comp_expiration ON public.companies(workers_comp_expiration);