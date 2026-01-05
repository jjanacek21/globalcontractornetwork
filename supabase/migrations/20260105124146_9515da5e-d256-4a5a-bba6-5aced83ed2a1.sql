-- Add referral source columns to coating_leads
ALTER TABLE coating_leads ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE coating_leads ADD COLUMN IF NOT EXISTS referral_contractor_id UUID REFERENCES contractor_profiles(id);

-- Add referral source columns to window_leads
ALTER TABLE window_leads ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE window_leads ADD COLUMN IF NOT EXISTS referral_contractor_id UUID REFERENCES contractor_profiles(id);

-- Add referral source columns to contact_requests
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS referral_contractor_id UUID REFERENCES contractor_profiles(id);

-- Create lead_communication_history table for tracking messages
CREATE TABLE IF NOT EXISTS lead_communication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL CHECK (lead_type IN ('coating', 'window', 'contact', 'project')),
  lead_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'contractor', 'homeowner')),
  sender_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for communication history
ALTER TABLE lead_communication_history ENABLE ROW LEVEL SECURITY;

-- Users can view communications for their leads
CREATE POLICY "Users can view their lead communications"
ON lead_communication_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM coating_leads WHERE id = lead_id AND (user_id = auth.uid() OR email_normalized = lower((SELECT email FROM auth.users WHERE id = auth.uid())))
  ) OR
  EXISTS (
    SELECT 1 FROM window_leads WHERE id = lead_id AND (user_id = auth.uid() OR email_normalized = lower((SELECT email FROM auth.users WHERE id = auth.uid())))
  ) OR
  EXISTS (
    SELECT 1 FROM contact_requests WHERE id = lead_id AND (user_id = auth.uid() OR email_normalized = lower((SELECT email FROM auth.users WHERE id = auth.uid())))
  ) OR
  EXISTS (
    SELECT 1 FROM homeowner_projects WHERE id = lead_id AND user_id = auth.uid()
  )
);

-- Users can insert communications for their leads
CREATE POLICY "Users can add communications to their leads"
ON lead_communication_history FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  (
    EXISTS (
      SELECT 1 FROM coating_leads WHERE id = lead_id AND (user_id = auth.uid() OR email_normalized = lower((SELECT email FROM auth.users WHERE id = auth.uid())))
    ) OR
    EXISTS (
      SELECT 1 FROM window_leads WHERE id = lead_id AND (user_id = auth.uid() OR email_normalized = lower((SELECT email FROM auth.users WHERE id = auth.uid())))
    ) OR
    EXISTS (
      SELECT 1 FROM contact_requests WHERE id = lead_id AND (user_id = auth.uid() OR email_normalized = lower((SELECT email FROM auth.users WHERE id = auth.uid())))
    ) OR
    EXISTS (
      SELECT 1 FROM homeowner_projects WHERE id = lead_id AND user_id = auth.uid()
    )
  )
);

-- Enable realtime for communication history
ALTER PUBLICATION supabase_realtime ADD TABLE lead_communication_history;

-- Create function to track contractor referrals from coating_leads
CREATE OR REPLACE FUNCTION track_coating_lead_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_contractor_id IS NOT NULL THEN
    INSERT INTO contractor_referrals (
      referring_contractor_id,
      referred_customer_name,
      referred_customer_email,
      referred_customer_phone,
      referred_service_type,
      property_address,
      referral_source_context,
      status
    ) VALUES (
      NEW.referral_contractor_id,
      NEW.name,
      NEW.email,
      NEW.phone,
      COALESCE(NEW.coating_type, 'Roof Coating'),
      NEW.property_address,
      'Customer selected as referral source on lead form',
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track contractor referrals from window_leads
CREATE OR REPLACE FUNCTION track_window_lead_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_contractor_id IS NOT NULL THEN
    INSERT INTO contractor_referrals (
      referring_contractor_id,
      referred_customer_name,
      referred_customer_email,
      referred_customer_phone,
      referred_service_type,
      property_address,
      referral_source_context,
      status
    ) VALUES (
      NEW.referral_contractor_id,
      NEW.name,
      NEW.email,
      NEW.phone,
      'Windows & Doors',
      NEW.property_address,
      'Customer selected as referral source on lead form',
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track contractor referrals from contact_requests
CREATE OR REPLACE FUNCTION track_contact_request_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_contractor_id IS NOT NULL THEN
    INSERT INTO contractor_referrals (
      referring_contractor_id,
      referred_customer_name,
      referred_customer_email,
      referred_customer_phone,
      referred_service_type,
      property_address,
      referral_source_context,
      status
    ) VALUES (
      NEW.referral_contractor_id,
      NEW.name,
      NEW.email,
      NEW.phone,
      'Contact Request',
      COALESCE(NEW.message, 'N/A'),
      'Customer selected as referral source on contact form',
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to lead tables
DROP TRIGGER IF EXISTS coating_lead_referral_tracking ON coating_leads;
CREATE TRIGGER coating_lead_referral_tracking
AFTER INSERT ON coating_leads
FOR EACH ROW EXECUTE FUNCTION track_coating_lead_referral();

DROP TRIGGER IF EXISTS window_lead_referral_tracking ON window_leads;
CREATE TRIGGER window_lead_referral_tracking
AFTER INSERT ON window_leads
FOR EACH ROW EXECUTE FUNCTION track_window_lead_referral();

DROP TRIGGER IF EXISTS contact_request_referral_tracking ON contact_requests;
CREATE TRIGGER contact_request_referral_tracking
AFTER INSERT ON contact_requests
FOR EACH ROW EXECUTE FUNCTION track_contact_request_referral();