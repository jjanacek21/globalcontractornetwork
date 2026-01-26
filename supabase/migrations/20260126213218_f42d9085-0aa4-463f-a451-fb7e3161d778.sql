-- Create fastener_patterns table for nail/screw pattern storage
CREATE TABLE public.fastener_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_approval_id UUID REFERENCES public.product_approvals(id) ON DELETE SET NULL,
  training_session_id UUID REFERENCES public.permit_packet_training(id) ON DELETE SET NULL,
  jurisdiction_county TEXT NOT NULL,
  jurisdiction_city TEXT,
  is_hvhz BOOLEAN DEFAULT false,
  zone_type TEXT CHECK (zone_type IN ('field', 'perimeter', 'corner', 'hip_ridge', 'eave', 'rake', 'general')),
  nail_type TEXT, -- "ring shank", "coil", "cap nail", "roofing nail"
  nail_length TEXT, -- "1.25 inch", "2 inch"
  nail_gauge TEXT, -- "12 gauge", "11 gauge"
  spacing_inches NUMERIC(4,2), -- 6.00 for 6" o.c.
  spacing_description TEXT, -- "6 inches on center"
  nails_per_square INTEGER, -- nails per roofing square
  fastener_for TEXT, -- "underlayment", "shingle", "metal panel", "tile"
  roof_material TEXT, -- "asphalt shingle", "metal", "tile", "modified bitumen"
  deck_type TEXT, -- "plywood", "OSB", "wood plank", "concrete"
  source_document TEXT, -- NOA number or document name
  source_page INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fastener_patterns ENABLE ROW LEVEL SECURITY;

-- Allow authenticated read access
CREATE POLICY "Allow authenticated read access to fastener patterns"
ON public.fastener_patterns FOR SELECT TO authenticated USING (true);

-- Allow authenticated insert
CREATE POLICY "Allow authenticated insert for fastener patterns"
ON public.fastener_patterns FOR INSERT TO authenticated WITH CHECK (true);

-- Create index for lookups
CREATE INDEX idx_fastener_patterns_county ON public.fastener_patterns(jurisdiction_county);
CREATE INDEX idx_fastener_patterns_material ON public.fastener_patterns(roof_material);
CREATE INDEX idx_fastener_patterns_hvhz ON public.fastener_patterns(is_hvhz);
CREATE INDEX idx_fastener_patterns_product ON public.fastener_patterns(product_approval_id);

-- Create permit_inspections table for tracking inspection schedules
CREATE TABLE public.permit_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_project_id UUID REFERENCES public.permit_projects(id) ON DELETE CASCADE,
  training_session_id UUID REFERENCES public.permit_packet_training(id) ON DELETE SET NULL,
  seq_id INTEGER NOT NULL,
  inspection_type TEXT NOT NULL, -- 'anchor_sheet', 'fire_barrier', 'roof_in_progress', 'final', 'tie_beam', 'tie_down'
  inspection_code TEXT, -- Code used by building dept (e.g., "8", "9", "10")
  category TEXT CHECK (category IN ('building', 'electrical', 'plumbing', 'mechanical', 'fire', 'structural', 'roofing')),
  description TEXT, -- Full description like "Anchor Sheet (Tin Cap)"
  scheduled_date DATE,
  scheduled_time TIME,
  completed_date DATE,
  inspector_name TEXT,
  inspector_id TEXT,
  result TEXT CHECK (result IN ('passed', 'failed', 'pending', 'scheduled', 'not_ready', 'partial')),
  result_notes TEXT,
  is_required BOOLEAN DEFAULT true,
  order_in_sequence INTEGER, -- Order this inspection should happen
  prerequisites TEXT[], -- Array of inspection types that must pass first
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permit_inspections ENABLE ROW LEVEL SECURITY;

-- Allow authenticated read access
CREATE POLICY "Allow authenticated read access to permit inspections"
ON public.permit_inspections FOR SELECT TO authenticated USING (true);

-- Allow authenticated insert/update
CREATE POLICY "Allow authenticated insert for permit inspections"
ON public.permit_inspections FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update for permit inspections"
ON public.permit_inspections FOR UPDATE TO authenticated USING (true);

-- Create indexes
CREATE INDEX idx_permit_inspections_project ON public.permit_inspections(permit_project_id);
CREATE INDEX idx_permit_inspections_type ON public.permit_inspections(inspection_type);
CREATE INDEX idx_permit_inspections_result ON public.permit_inspections(result);
CREATE INDEX idx_permit_inspections_training ON public.permit_inspections(training_session_id);

-- Add notarization columns to permit_project_documents for RON tracking
ALTER TABLE public.permit_project_documents 
ADD COLUMN IF NOT EXISTS notarization_status TEXT CHECK (notarization_status IN ('not_required', 'required', 'scheduled', 'completed', 'waived')),
ADD COLUMN IF NOT EXISTS notarized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notary_name TEXT,
ADD COLUMN IF NOT EXISTS notarization_session_url TEXT,
ADD COLUMN IF NOT EXISTS notarization_type TEXT CHECK (notarization_type IN ('in_person', 'ron', 'ipen'));

-- Create permit_packet_versions table for resubmittal tracking
CREATE TABLE public.permit_packet_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_project_id UUID REFERENCES public.permit_projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  packet_url TEXT NOT NULL,
  packet_size_bytes INTEGER,
  document_count INTEGER,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID,
  change_notes TEXT,
  changes_from_previous JSONB, -- Details of what changed
  submission_date DATE,
  submission_method TEXT, -- 'online', 'in_person', 'email'
  result TEXT CHECK (result IN ('pending', 'approved', 'approved_with_conditions', 'rejected', 'revision_requested', 'withdrawn')),
  result_date DATE,
  result_notes TEXT,
  reviewer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permit_packet_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access to packet versions"
ON public.permit_packet_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert for packet versions"
ON public.permit_packet_versions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update for packet versions"
ON public.permit_packet_versions FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_packet_versions_project ON public.permit_packet_versions(permit_project_id);
CREATE INDEX idx_packet_versions_result ON public.permit_packet_versions(result);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION public.update_fastener_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fastener_patterns_timestamp
BEFORE UPDATE ON public.fastener_patterns
FOR EACH ROW EXECUTE FUNCTION public.update_fastener_patterns_updated_at();

CREATE TRIGGER update_permit_inspections_timestamp
BEFORE UPDATE ON public.permit_inspections
FOR EACH ROW EXECUTE FUNCTION public.update_fastener_patterns_updated_at();