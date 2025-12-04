-- Add roofing-specific fields to permit_projects
ALTER TABLE public.permit_projects
ADD COLUMN roof_type text,
ADD COLUMN roof_color text,
ADD COLUMN underlayment_type text,
ADD COLUMN roof_accessories text,
ADD COLUMN hoa_approval boolean DEFAULT false,
ADD COLUMN architectural_approval boolean DEFAULT false,
ADD COLUMN architectural_approval_required boolean DEFAULT false;

-- Add inspection request tracking
ALTER TABLE public.permit_projects
ADD COLUMN inspection_requested text,
ADD COLUMN inspection_requested_at timestamp with time zone,
ADD COLUMN revision_requested boolean DEFAULT false,
ADD COLUMN revision_notes text;