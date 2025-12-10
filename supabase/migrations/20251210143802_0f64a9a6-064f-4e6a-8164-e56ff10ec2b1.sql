-- Grant INSERT and SELECT permissions on coating_leads table
-- This allows the RLS policies to be evaluated for public lead submissions

GRANT INSERT ON public.coating_leads TO anon;
GRANT INSERT ON public.coating_leads TO authenticated;
GRANT SELECT ON public.coating_leads TO anon;
GRANT SELECT ON public.coating_leads TO authenticated;