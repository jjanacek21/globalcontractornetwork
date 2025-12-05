-- Table for lead notes/activity log
CREATE TABLE public.supplement_lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.supplement_leads(id) ON DELETE CASCADE NOT NULL,
  contractor_id uuid REFERENCES public.supplement_contractors(id) NOT NULL,
  note_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table for lead action requests
CREATE TABLE public.supplement_lead_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.supplement_leads(id) ON DELETE CASCADE NOT NULL,
  request_type text NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.supplement_lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_lead_requests ENABLE ROW LEVEL SECURITY;

-- RLS for supplement_lead_notes
CREATE POLICY "Contractors can view their own lead notes"
ON public.supplement_lead_notes
FOR SELECT
USING (contractor_id IN (SELECT id FROM public.supplement_contractors WHERE user_id = auth.uid()));

CREATE POLICY "Contractors can insert their own lead notes"
ON public.supplement_lead_notes
FOR INSERT
WITH CHECK (contractor_id IN (SELECT id FROM public.supplement_contractors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all lead notes"
ON public.supplement_lead_notes
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.supplement_admins WHERE user_id = auth.uid()));

-- RLS for supplement_lead_requests
CREATE POLICY "Contractors can view their own lead requests"
ON public.supplement_lead_requests
FOR SELECT
USING (lead_id IN (
  SELECT sl.id FROM public.supplement_leads sl
  JOIN public.supplement_contractors sc ON sl.contractor_id = sc.id
  WHERE sc.user_id = auth.uid()
));

CREATE POLICY "Contractors can insert their own lead requests"
ON public.supplement_lead_requests
FOR INSERT
WITH CHECK (lead_id IN (
  SELECT sl.id FROM public.supplement_leads sl
  JOIN public.supplement_contractors sc ON sl.contractor_id = sc.id
  WHERE sc.user_id = auth.uid()
));

CREATE POLICY "Admins can view all lead requests"
ON public.supplement_lead_requests
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.supplement_admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update lead requests"
ON public.supplement_lead_requests
FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.supplement_admins WHERE user_id = auth.uid()));