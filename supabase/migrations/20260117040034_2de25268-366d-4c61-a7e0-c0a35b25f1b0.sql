-- Add new columns to permit_building_departments for ZIP codes and enhanced info
ALTER TABLE public.permit_building_departments
ADD COLUMN IF NOT EXISTS zip_codes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_hvhz BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS fax TEXT,
ADD COLUMN IF NOT EXISTS submission_method TEXT DEFAULT 'online',
ADD COLUMN IF NOT EXISTS processing_time TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for ZIP code lookups
CREATE INDEX IF NOT EXISTS idx_permit_building_departments_zip_codes 
ON public.permit_building_departments USING GIN(zip_codes);

-- Create table for department-to-document relationships
CREATE TABLE IF NOT EXISTS public.permit_department_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_dept_id UUID NOT NULL REFERENCES public.permit_building_departments(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.permit_form_templates(id) ON DELETE CASCADE,
  trade_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT,
  is_required BOOLEAN DEFAULT true,
  is_smart_doc BOOLEAN DEFAULT false,
  field_mapping JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for required information checklist per department/trade
CREATE TABLE IF NOT EXISTS public.permit_required_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_dept_id UUID NOT NULL REFERENCES public.permit_building_departments(id) ON DELETE CASCADE,
  trade_type TEXT NOT NULL,
  info_type TEXT NOT NULL CHECK (info_type IN ('measurement', 'document', 'product_spec', 'contractor_info', 'property_info', 'other')),
  info_name TEXT NOT NULL,
  info_description TEXT,
  is_required BOOLEAN DEFAULT true,
  ai_extractable BOOLEAN DEFAULT false,
  field_key TEXT,
  example_value TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.permit_department_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_required_info ENABLE ROW LEVEL SECURITY;

-- RLS policies for permit_department_documents
CREATE POLICY "Anyone can view department documents"
ON public.permit_department_documents FOR SELECT
USING (true);

CREATE POLICY "Admins can manage department documents"
ON public.permit_department_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.permit_admins 
    WHERE user_id = auth.uid()
  )
);

-- RLS policies for permit_required_info
CREATE POLICY "Anyone can view required info"
ON public.permit_required_info FOR SELECT
USING (true);

CREATE POLICY "Admins can manage required info"
ON public.permit_required_info FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.permit_admins 
    WHERE user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permit_dept_docs_building_dept 
ON public.permit_department_documents(building_dept_id);

CREATE INDEX IF NOT EXISTS idx_permit_dept_docs_trade 
ON public.permit_department_documents(trade_type);

CREATE INDEX IF NOT EXISTS idx_permit_required_info_building_dept 
ON public.permit_required_info(building_dept_id);

CREATE INDEX IF NOT EXISTS idx_permit_required_info_trade 
ON public.permit_required_info(trade_type);

-- Trigger for updated_at on permit_department_documents
CREATE OR REPLACE FUNCTION public.update_permit_department_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_permit_department_documents_updated_at ON public.permit_department_documents;
CREATE TRIGGER update_permit_department_documents_updated_at
BEFORE UPDATE ON public.permit_department_documents
FOR EACH ROW EXECUTE FUNCTION public.update_permit_department_documents_updated_at();