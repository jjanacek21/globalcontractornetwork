-- Fix coating_leads foreign key to SET NULL on delete
ALTER TABLE coating_leads 
DROP CONSTRAINT IF EXISTS coating_leads_user_id_fkey;

ALTER TABLE coating_leads 
ADD CONSTRAINT coating_leads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix contact_requests foreign key  
ALTER TABLE contact_requests 
DROP CONSTRAINT IF EXISTS contact_requests_user_id_fkey;

ALTER TABLE contact_requests 
ADD CONSTRAINT contact_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix window_leads foreign key
ALTER TABLE window_leads 
DROP CONSTRAINT IF EXISTS window_leads_user_id_fkey;

ALTER TABLE window_leads 
ADD CONSTRAINT window_leads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix roofing_quiz_responses foreign key (references auth.users)
ALTER TABLE roofing_quiz_responses 
DROP CONSTRAINT IF EXISTS roofing_quiz_responses_user_id_fkey;

ALTER TABLE roofing_quiz_responses 
ADD CONSTRAINT roofing_quiz_responses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix activities foreign key
ALTER TABLE activities 
DROP CONSTRAINT IF EXISTS activities_user_id_fkey;

ALTER TABLE activities 
ADD CONSTRAINT activities_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix service_requests foreign key
ALTER TABLE service_requests 
DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;

ALTER TABLE service_requests 
ADD CONSTRAINT service_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix marketing_leads foreign key
ALTER TABLE marketing_leads 
DROP CONSTRAINT IF EXISTS marketing_leads_user_id_fkey;

ALTER TABLE marketing_leads 
ADD CONSTRAINT marketing_leads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix roofing_consultations foreign key
ALTER TABLE roofing_consultations 
DROP CONSTRAINT IF EXISTS roofing_consultations_user_id_fkey;

ALTER TABLE roofing_consultations 
ADD CONSTRAINT roofing_consultations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;