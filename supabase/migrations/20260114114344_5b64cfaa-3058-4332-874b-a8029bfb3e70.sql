-- Fix foreign key constraints for contractor_profiles to allow deletion
-- Drop and recreate constraints with ON DELETE SET NULL or CASCADE

-- coating_leads
ALTER TABLE public.coating_leads DROP CONSTRAINT IF EXISTS coating_leads_referral_contractor_id_fkey;
ALTER TABLE public.coating_leads ADD CONSTRAINT coating_leads_referral_contractor_id_fkey 
  FOREIGN KEY (referral_contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- window_leads
ALTER TABLE public.window_leads DROP CONSTRAINT IF EXISTS window_leads_referral_contractor_id_fkey;
ALTER TABLE public.window_leads ADD CONSTRAINT window_leads_referral_contractor_id_fkey 
  FOREIGN KEY (referral_contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- contact_requests
ALTER TABLE public.contact_requests DROP CONSTRAINT IF EXISTS contact_requests_referral_contractor_id_fkey;
ALTER TABLE public.contact_requests ADD CONSTRAINT contact_requests_referral_contractor_id_fkey 
  FOREIGN KEY (referral_contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- service_requests
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_referral_contractor_id_fkey;
ALTER TABLE public.service_requests ADD CONSTRAINT service_requests_referral_contractor_id_fkey 
  FOREIGN KEY (referral_contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- marketing_leads
ALTER TABLE public.marketing_leads DROP CONSTRAINT IF EXISTS marketing_leads_referral_contractor_id_fkey;
ALTER TABLE public.marketing_leads ADD CONSTRAINT marketing_leads_referral_contractor_id_fkey 
  FOREIGN KEY (referral_contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- supplement_leads
ALTER TABLE public.supplement_leads DROP CONSTRAINT IF EXISTS supplement_leads_referral_contractor_id_fkey;
ALTER TABLE public.supplement_leads ADD CONSTRAINT supplement_leads_referral_contractor_id_fkey 
  FOREIGN KEY (referral_contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- contractor_referrals - assigned_contractor_id
ALTER TABLE public.contractor_referrals DROP CONSTRAINT IF EXISTS contractor_referrals_assigned_contractor_id_fkey;
ALTER TABLE public.contractor_referrals ADD CONSTRAINT contractor_referrals_assigned_contractor_id_fkey 
  FOREIGN KEY (assigned_contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- contractor_referrals - referring_contractor_id
ALTER TABLE public.contractor_referrals DROP CONSTRAINT IF EXISTS contractor_referrals_referring_contractor_id_fkey;
ALTER TABLE public.contractor_referrals ADD CONSTRAINT contractor_referrals_referring_contractor_id_fkey 
  FOREIGN KEY (referring_contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- homeowner_projects
ALTER TABLE public.homeowner_projects DROP CONSTRAINT IF EXISTS homeowner_projects_assigned_contractor_id_fkey;
ALTER TABLE public.homeowner_projects ADD CONSTRAINT homeowner_projects_assigned_contractor_id_fkey 
  FOREIGN KEY (assigned_contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- homeowner_appointments
ALTER TABLE public.homeowner_appointments DROP CONSTRAINT IF EXISTS homeowner_appointments_contractor_id_fkey;
ALTER TABLE public.homeowner_appointments ADD CONSTRAINT homeowner_appointments_contractor_id_fkey 
  FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- contractor_leads - CASCADE delete since these are directly tied to contractor
ALTER TABLE public.contractor_leads DROP CONSTRAINT IF EXISTS contractor_leads_contractor_id_fkey;
ALTER TABLE public.contractor_leads ADD CONSTRAINT contractor_leads_contractor_id_fkey 
  FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE CASCADE;

-- contractor_jobs - CASCADE delete
ALTER TABLE public.contractor_jobs DROP CONSTRAINT IF EXISTS contractor_jobs_contractor_id_fkey;
ALTER TABLE public.contractor_jobs ADD CONSTRAINT contractor_jobs_contractor_id_fkey 
  FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE CASCADE;

-- contractor_reviews - CASCADE delete
ALTER TABLE public.contractor_reviews DROP CONSTRAINT IF EXISTS contractor_reviews_contractor_id_fkey;
ALTER TABLE public.contractor_reviews ADD CONSTRAINT contractor_reviews_contractor_id_fkey 
  FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE CASCADE;

-- contractor_feature_access - CASCADE delete
ALTER TABLE public.contractor_feature_access DROP CONSTRAINT IF EXISTS contractor_feature_access_contractor_id_fkey;
ALTER TABLE public.contractor_feature_access ADD CONSTRAINT contractor_feature_access_contractor_id_fkey 
  FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE CASCADE;

-- admin_notifications
ALTER TABLE public.admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_contractor_id_fkey;
ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_contractor_id_fkey 
  FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE SET NULL;

-- favorite_contractors
ALTER TABLE public.favorite_contractors DROP CONSTRAINT IF EXISTS favorite_contractors_contractor_id_fkey;
ALTER TABLE public.favorite_contractors ADD CONSTRAINT favorite_contractors_contractor_id_fkey 
  FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id) ON DELETE CASCADE;

-- contractor_profiles - company_id
ALTER TABLE public.contractor_profiles DROP CONSTRAINT IF EXISTS contractor_profiles_company_id_fkey;
ALTER TABLE public.contractor_profiles ADD CONSTRAINT contractor_profiles_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- Fix foreign key constraints for companies to allow deletion

-- customers
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_company_id_fkey;
ALTER TABLE public.customers ADD CONSTRAINT customers_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- contacts
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_company_id_fkey;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- properties
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_company_id_fkey;
ALTER TABLE public.properties ADD CONSTRAINT properties_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- leads
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_company_id_fkey;
ALTER TABLE public.leads ADD CONSTRAINT leads_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- trades
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_company_id_fkey;
ALTER TABLE public.trades ADD CONSTRAINT trades_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- catalog_items
ALTER TABLE public.catalog_items DROP CONSTRAINT IF EXISTS catalog_items_company_id_fkey;
ALTER TABLE public.catalog_items ADD CONSTRAINT catalog_items_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- activities
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_company_id_fkey;
ALTER TABLE public.activities ADD CONSTRAINT activities_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- files
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_company_id_fkey;
ALTER TABLE public.files ADD CONSTRAINT files_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- contractor_referrals - company_id
ALTER TABLE public.contractor_referrals DROP CONSTRAINT IF EXISTS contractor_referrals_company_id_fkey;
ALTER TABLE public.contractor_referrals ADD CONSTRAINT contractor_referrals_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- company_members
ALTER TABLE public.company_members DROP CONSTRAINT IF EXISTS company_members_company_id_fkey;
ALTER TABLE public.company_members ADD CONSTRAINT company_members_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- company_admins
ALTER TABLE public.company_admins DROP CONSTRAINT IF EXISTS company_admins_company_id_fkey;
ALTER TABLE public.company_admins ADD CONSTRAINT company_admins_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- company_gamification
ALTER TABLE public.company_gamification DROP CONSTRAINT IF EXISTS company_gamification_company_id_fkey;
ALTER TABLE public.company_gamification ADD CONSTRAINT company_gamification_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- company_resources
ALTER TABLE public.company_resources DROP CONSTRAINT IF EXISTS company_resources_company_id_fkey;
ALTER TABLE public.company_resources ADD CONSTRAINT company_resources_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- canvassing_logs
ALTER TABLE public.canvassing_logs DROP CONSTRAINT IF EXISTS canvassing_logs_company_id_fkey;
ALTER TABLE public.canvassing_logs ADD CONSTRAINT canvassing_logs_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- challenge_participants
ALTER TABLE public.challenge_participants DROP CONSTRAINT IF EXISTS challenge_participants_company_id_fkey;
ALTER TABLE public.challenge_participants ADD CONSTRAINT challenge_participants_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- teams
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_company_id_fkey;
ALTER TABLE public.teams ADD CONSTRAINT teams_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;