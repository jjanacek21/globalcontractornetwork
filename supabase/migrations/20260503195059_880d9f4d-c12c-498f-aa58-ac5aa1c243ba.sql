-- Fix function search_path mutable warnings
ALTER FUNCTION public.calculate_directory_eligibility() SET search_path = public;
ALTER FUNCTION public.track_coating_lead_referral() SET search_path = public;
ALTER FUNCTION public.update_permit_department_documents_updated_at() SET search_path = public;
ALTER FUNCTION public.update_fastener_patterns_updated_at() SET search_path = public;
ALTER FUNCTION public.track_contact_request_referral() SET search_path = public;
ALTER FUNCTION public.cleanup_stuck_form_templates() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.cleanup_stuck_training_books() SET search_path = public;
ALTER FUNCTION public.track_window_lead_referral() SET search_path = public;