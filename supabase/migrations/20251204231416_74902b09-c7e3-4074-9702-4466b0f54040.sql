-- Create permit_projects table for tracking client permit submissions
CREATE TABLE public.permit_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  property_address TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'FL',
  zip_code TEXT,
  service_type TEXT NOT NULL,
  has_hurricane_straps BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permit_projects ENABLE ROW LEVEL SECURITY;

-- Users can view their own projects
CREATE POLICY "Users can view their own permit projects"
ON public.permit_projects
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create their own permit projects"
ON public.permit_projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own permit projects"
ON public.permit_projects
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own permit projects"
ON public.permit_projects
FOR DELETE
USING (auth.uid() = user_id);

-- Create permit_project_documents table for file uploads
CREATE TABLE public.permit_project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.permit_projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'drivers_license', 'project_photo', 'hurricane_straps_photo', 'other'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permit_project_documents ENABLE ROW LEVEL SECURITY;

-- Users can view documents for their projects
CREATE POLICY "Users can view their project documents"
ON public.permit_project_documents
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.permit_projects
  WHERE permit_projects.id = permit_project_documents.project_id
  AND permit_projects.user_id = auth.uid()
));

-- Users can create documents for their projects
CREATE POLICY "Users can create their project documents"
ON public.permit_project_documents
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.permit_projects
  WHERE permit_projects.id = permit_project_documents.project_id
  AND permit_projects.user_id = auth.uid()
));

-- Users can delete documents for their projects
CREATE POLICY "Users can delete their project documents"
ON public.permit_project_documents
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.permit_projects
  WHERE permit_projects.id = permit_project_documents.project_id
  AND permit_projects.user_id = auth.uid()
));

-- Create storage bucket for permit documents
INSERT INTO storage.buckets (id, name, public) VALUES ('permit-documents', 'permit-documents', false);

-- Storage policies for permit documents
CREATE POLICY "Users can upload their permit documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'permit-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their permit documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'permit-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their permit documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'permit-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger for updated_at
CREATE TRIGGER update_permit_projects_updated_at
BEFORE UPDATE ON public.permit_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();