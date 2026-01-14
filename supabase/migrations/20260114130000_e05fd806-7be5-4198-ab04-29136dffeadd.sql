-- Fix customers table (the main blocking issue!)
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_assigned_rep_id_fkey;
ALTER TABLE customers 
ADD CONSTRAINT customers_assigned_rep_id_fkey 
FOREIGN KEY (assigned_rep_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix activities table
ALTER TABLE activities 
DROP CONSTRAINT IF EXISTS activities_user_id_fkey;
ALTER TABLE activities 
ADD CONSTRAINT activities_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix job_tasks table
ALTER TABLE job_tasks 
DROP CONSTRAINT IF EXISTS job_tasks_completed_by_fkey;
ALTER TABLE job_tasks 
ADD CONSTRAINT job_tasks_completed_by_fkey 
FOREIGN KEY (completed_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Re-apply fixes for tables that may not have been updated correctly
ALTER TABLE coating_leads DROP CONSTRAINT IF EXISTS coating_leads_user_id_fkey;
ALTER TABLE coating_leads ADD CONSTRAINT coating_leads_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE contact_requests DROP CONSTRAINT IF EXISTS contact_requests_user_id_fkey;
ALTER TABLE contact_requests ADD CONSTRAINT contact_requests_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE marketing_leads DROP CONSTRAINT IF EXISTS marketing_leads_user_id_fkey;
ALTER TABLE marketing_leads ADD CONSTRAINT marketing_leads_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE roofing_consultations DROP CONSTRAINT IF EXISTS roofing_consultations_user_id_fkey;
ALTER TABLE roofing_consultations ADD CONSTRAINT roofing_consultations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;
ALTER TABLE service_requests ADD CONSTRAINT service_requests_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE window_leads DROP CONSTRAINT IF EXISTS window_leads_user_id_fkey;
ALTER TABLE window_leads ADD CONSTRAINT window_leads_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;