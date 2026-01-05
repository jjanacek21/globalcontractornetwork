-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.track_coating_lead_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_contractor_id IS NOT NULL THEN
    INSERT INTO public.contractor_referrals (
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.track_window_lead_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_contractor_id IS NOT NULL THEN
    INSERT INTO public.contractor_referrals (
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.track_contact_request_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_contractor_id IS NOT NULL THEN
    INSERT INTO public.contractor_referrals (
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;