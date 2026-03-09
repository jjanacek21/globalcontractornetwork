-- Storm events table for canvassing sessions
CREATE TABLE public.storm_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  storm_date DATE NOT NULL,
  affected_area TEXT NOT NULL,
  severity TEXT DEFAULT 'moderate',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  company_id UUID REFERENCES public.companies(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.storm_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read storm_events" ON public.storm_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert storm_events" ON public.storm_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update storm_events" ON public.storm_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete storm_events" ON public.storm_events FOR DELETE TO authenticated USING (true);

-- Add storm_event_id to field_sessions
ALTER TABLE public.field_sessions ADD COLUMN IF NOT EXISTS storm_event_id UUID REFERENCES public.storm_events(id);

-- Seed some sample storm events
INSERT INTO public.storm_events (name, storm_date, affected_area, severity) VALUES
  ('Hurricane Milton', '2025-10-09', 'Tampa Bay, Sarasota, Fort Myers', 'severe'),
  ('Tropical Storm Helene', '2025-09-26', 'Big Bend, Tallahassee, Perry', 'severe'),
  ('Hailstorm - Orlando Metro', '2026-02-15', 'Orlando, Kissimmee, Sanford', 'moderate'),
  ('Tornado - Broward County', '2026-01-22', 'Fort Lauderdale, Pembroke Pines, Miramar', 'severe'),
  ('Wind Event - Jacksonville', '2026-03-01', 'Jacksonville, St. Augustine, Palm Coast', 'moderate');