-- Create building department rules table for city-specific requirements and "gotchas"
CREATE TABLE public.building_department_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_department_id uuid REFERENCES public.permit_building_departments(id),
  county text NOT NULL,
  city text,
  rule_type text NOT NULL CHECK (rule_type IN ('gotcha', 'requirement', 'exception', 'warning')),
  permit_types text[] DEFAULT ARRAY['*'],
  rule_description text NOT NULL,
  rule_action text CHECK (rule_action IN ('require_document', 'block_product', 'show_warning', 'add_form', 'require_signature')),
  document_required text,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add packet_status column to permit_projects
ALTER TABLE public.permit_projects 
ADD COLUMN IF NOT EXISTS packet_status text DEFAULT 'draft' 
CHECK (packet_status IN ('draft', 'missing_items', 'ready_for_submission', 'under_review', 'ready_to_pay', 'approved', 'rejected'));

-- Add generated_forms to permit_projects to store AI-generated form data
ALTER TABLE public.permit_projects
ADD COLUMN IF NOT EXISTS generated_forms jsonb DEFAULT '{}'::jsonb;

-- Add trade_data to permit_projects for storing trade-specific answers
ALTER TABLE public.permit_projects
ADD COLUMN IF NOT EXISTS trade_data jsonb DEFAULT '{}'::jsonb;

-- Enable RLS on new table
ALTER TABLE public.building_department_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for building_department_rules (read-only for everyone)
CREATE POLICY "Anyone can read building department rules"
ON public.building_department_rules FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_building_dept_rules_county ON public.building_department_rules(county);
CREATE INDEX idx_building_dept_rules_city ON public.building_department_rules(city);
CREATE INDEX idx_building_dept_rules_permit_types ON public.building_department_rules USING GIN(permit_types);

-- Update trigger for updated_at
CREATE TRIGGER update_building_dept_rules_updated_at
BEFORE UPDATE ON public.building_department_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();