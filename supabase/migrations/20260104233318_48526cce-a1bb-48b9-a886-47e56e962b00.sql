-- Create contractor referrals table for the referral economy
CREATE TABLE public.contractor_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referring_contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  referred_customer_name TEXT NOT NULL,
  referred_customer_email TEXT,
  referred_customer_phone TEXT,
  referred_service_type TEXT NOT NULL,
  property_address TEXT NOT NULL,
  referral_source_context TEXT, -- "Observed during HVAC service", "Customer asked about roof", etc.
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'contacted', 'scheduled', 'in_progress', 'completed', 'paid')),
  assigned_contractor_id UUID REFERENCES public.contractor_profiles(id),
  job_amount NUMERIC,
  referral_fee_percentage NUMERIC DEFAULT 10,
  payout_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.contractor_referrals ENABLE ROW LEVEL SECURITY;

-- Contractors can view their own referrals (sent or received)
CREATE POLICY "Contractors can view their own referrals"
ON public.contractor_referrals
FOR SELECT
USING (
  referring_contractor_id IN (
    SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
  )
  OR
  assigned_contractor_id IN (
    SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
  )
);

-- Contractors can create referrals
CREATE POLICY "Contractors can create referrals"
ON public.contractor_referrals
FOR INSERT
WITH CHECK (
  referring_contractor_id IN (
    SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
  )
);

-- Super admins can do everything (check super_admins table)
CREATE POLICY "Super admins have full access to referrals"
ON public.contractor_referrals
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
);

-- Create updated_at trigger
CREATE TRIGGER update_contractor_referrals_updated_at
BEFORE UPDATE ON public.contractor_referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.contractor_referrals;

-- Add index for faster lookups
CREATE INDEX idx_referrals_referring_contractor ON public.contractor_referrals(referring_contractor_id);
CREATE INDEX idx_referrals_assigned_contractor ON public.contractor_referrals(assigned_contractor_id);
CREATE INDEX idx_referrals_status ON public.contractor_referrals(status);