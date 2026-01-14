-- Add contractor_type and is_directory_eligible columns to contractor_profiles
ALTER TABLE public.contractor_profiles 
ADD COLUMN IF NOT EXISTS contractor_type text DEFAULT 'independent',
ADD COLUMN IF NOT EXISTS is_directory_eligible boolean DEFAULT false;

-- Update existing contractors based on company association
UPDATE public.contractor_profiles 
SET contractor_type = CASE 
  WHEN company_id IS NOT NULL THEN 'subcontractor'
  ELSE 'independent'
END
WHERE contractor_type IS NULL OR contractor_type = 'independent';

-- Update directory eligibility for existing verified contractors with companies
UPDATE public.contractor_profiles 
SET is_directory_eligible = true
WHERE company_id IS NOT NULL 
  AND verification_status = 'verified';

-- Create function to calculate directory eligibility
CREATE OR REPLACE FUNCTION public.calculate_directory_eligibility()
RETURNS TRIGGER AS $$
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
  -- Independent contractors are NOT directory eligible
  ELSE
    NEW.is_directory_eligible := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for directory eligibility calculation
DROP TRIGGER IF EXISTS trigger_calculate_directory_eligibility ON public.contractor_profiles;
CREATE TRIGGER trigger_calculate_directory_eligibility
  BEFORE INSERT OR UPDATE ON public.contractor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_directory_eligibility();