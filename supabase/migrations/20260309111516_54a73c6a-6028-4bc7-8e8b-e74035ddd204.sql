-- Inspection checklist templates
CREATE TABLE public.inspection_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  company_id UUID REFERENCES public.companies(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read inspection_checklists" ON public.inspection_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert inspection_checklists" ON public.inspection_checklists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update inspection_checklists" ON public.inspection_checklists FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete inspection_checklists" ON public.inspection_checklists FOR DELETE TO authenticated USING (true);

-- Automation rules
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  trigger_label TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_runs INTEGER NOT NULL DEFAULT 0,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read automation_rules" ON public.automation_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert automation_rules" ON public.automation_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update automation_rules" ON public.automation_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete automation_rules" ON public.automation_rules FOR DELETE TO authenticated USING (true);

-- Seed inspection checklists
INSERT INTO public.inspection_checklists (name, category, items) VALUES
  ('Standard Roof Inspection', 'Roofing', '["Roof Condition","Shingle Integrity","Flashing Condition","Gutter Assessment","Ventilation Check","Soffit & Fascia","Ridge Cap","Drip Edge","Ice & Water Shield","Pipe Boots & Penetrations","Chimney Flashing","Valley Condition","Decking Condition","Attic Ventilation","Debris & Moss","Ponding Water","Overall Rating","Photo Documentation"]'::jsonb),
  ('Pre-Install Roof Check', 'Roofing', '["Decking Condition","Existing Material Removal","Underlayment Status","Flashing Inventory","Ventilation Plan","Drip Edge Condition","Valley Metal","Pipe Boot Sizing","Ridge Vent Prep","Material Staging","Safety Setup","Permit Verification"]'::jsonb),
  ('Final Walk-Through', 'General', '["Exterior Cleanup","Material Debris Removed","Gutter Cleared","Flashing Sealed","Ridge Cap Aligned","Nail Pops Checked","Caulking Complete","Paint Touch-Up","Landscaping Restored","Customer Walk-Through","Sign-Off Sheet","Before/After Photos","Warranty Docs Delivered","Final Invoice","Customer Satisfaction"]'::jsonb),
  ('Mold Assessment', 'Remediation', '["Visual Inspection","Moisture Meter Readings","Air Quality Sampling","Surface Sampling","HVAC Inspection","Attic Inspection","Crawl Space Check","Bathroom Areas","Kitchen Areas","Basement/Foundation","Window Frames","Wall Cavities","Ceiling Stains","Plumbing Leaks","Water Intrusion Points","Humidity Levels","Containment Plan","Remediation Scope","Lab Results Pending","Photo Documentation","Report Generation","Clearance Testing"]'::jsonb),
  ('Window/Door Inspection', 'Windows', '["Frame Condition","Seal Integrity","Glass Condition","Hardware Function","Weather Stripping","Caulking Exterior","Caulking Interior","Lock Mechanism","Screen Condition","Drainage Weep Holes"]'::jsonb);

-- Seed automation rules
INSERT INTO public.automation_rules (name, trigger_event, trigger_label, action_type, action_label, is_active, total_runs) VALUES
  ('New Lead → Welcome Email', 'lead_created', 'Lead created', 'send_email', 'Send welcome email', true, 0),
  ('Estimate Viewed → Notify Rep', 'estimate_viewed', 'Estimate opened by customer', 'push_notification', 'Push notification to assigned rep', true, 0),
  ('No Response 48hr → Follow Up', 'estimate_no_response_48h', '48 hours after estimate sent', 'send_email', 'Send follow-up email', true, 0),
  ('Job Complete → Review Request', 'job_completed', 'Job status → Complete', 'send_email', 'Send review request after 7 days', false, 0),
  ('Appointment Set → Calendar Event', 'appointment_scheduled', 'Appointment scheduled', 'create_calendar_event', 'Create Google Calendar event', true, 0);