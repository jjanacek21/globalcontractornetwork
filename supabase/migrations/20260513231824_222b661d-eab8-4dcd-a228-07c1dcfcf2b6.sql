CREATE OR REPLACE FUNCTION public.calculate_directory_eligibility()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Sub-contractors with verified companies are eligible
  IF NEW.contractor_type = 'subcontractor' AND NEW.company_id IS NOT NULL THEN
    SELECT CASE WHEN c.verification_status = 'verified' THEN true ELSE false END
    INTO NEW.is_directory_eligible
    FROM public.companies c
    WHERE c.id = NEW.company_id;
  -- Independent sub-contractors need license AND insurance
  ELSIF NEW.contractor_type = 'subcontractor' AND NEW.company_id IS NULL THEN
    NEW.is_directory_eligible := (
      NEW.license_number IS NOT NULL 
      AND NEW.license_state IS NOT NULL 
      AND NEW.insurance_info IS NOT NULL
      AND NEW.verification_status = 'verified'
    );
  -- Handymen are eligible if verified
  ELSIF NEW.contractor_type = 'handyman' THEN
    NEW.is_directory_eligible := (NEW.verification_status = 'verified');
  -- Building consultants and skilled labor: eligible when verified (no license required)
  ELSIF NEW.profile_type IN ('building_consultant', 'skilled_labor') THEN
    NEW.is_directory_eligible := (NEW.verification_status = 'verified');
  -- Independent contractors are NOT directory eligible
  ELSE
    NEW.is_directory_eligible := false;
  END IF;
  
  RETURN NEW;
END;
$function$;