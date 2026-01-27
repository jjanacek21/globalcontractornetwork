-- 1. Add new columns to permit_form_templates for smart document management
ALTER TABLE permit_form_templates 
ADD COLUMN IF NOT EXISTS building_dept_id UUID REFERENCES permit_building_departments(id);

ALTER TABLE permit_form_templates
ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending';

ALTER TABLE permit_form_templates
ADD COLUMN IF NOT EXISTS field_count INTEGER DEFAULT 0;

ALTER TABLE permit_form_templates
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ;

-- 2. Create index for efficient department lookups
CREATE INDEX IF NOT EXISTS idx_templates_building_dept ON permit_form_templates(building_dept_id);

-- 3. Create index for analysis status filtering
CREATE INDEX IF NOT EXISTS idx_templates_analysis_status ON permit_form_templates(analysis_status);