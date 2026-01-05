-- Add new columns to contractor_profiles for enhanced profile editing
ALTER TABLE contractor_profiles
ADD COLUMN IF NOT EXISTS google_business_url TEXT,
ADD COLUMN IF NOT EXISTS services_offered TEXT[],
ADD COLUMN IF NOT EXISTS client_references JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS profile_gallery JSONB DEFAULT '[]'::jsonb;

-- Create appointments table for homeowner-contractor bookings
CREATE TABLE homeowner_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL,
  contractor_id UUID REFERENCES contractor_profiles(id) NOT NULL,
  conversation_id UUID REFERENCES homeowner_conversations(id),
  appointment_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  property_address TEXT,
  service_type TEXT,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for appointments
ALTER TABLE homeowner_appointments ENABLE ROW LEVEL SECURITY;

-- Homeowners can view their own appointments
CREATE POLICY "homeowner_view_own_appointments" ON homeowner_appointments
  FOR SELECT USING (auth.uid() = homeowner_id);

-- Homeowners can create appointments
CREATE POLICY "homeowner_create_appointments" ON homeowner_appointments
  FOR INSERT WITH CHECK (auth.uid() = homeowner_id);

-- Homeowners can update their own appointments
CREATE POLICY "homeowner_update_own_appointments" ON homeowner_appointments
  FOR UPDATE USING (auth.uid() = homeowner_id);

-- Contractors can view appointments for them
CREATE POLICY "contractor_view_appointments" ON homeowner_appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles 
      WHERE id = homeowner_appointments.contractor_id 
      AND user_id = auth.uid()
    )
  );

-- Contractors can update appointments for them (confirm/cancel)
CREATE POLICY "contractor_update_appointments" ON homeowner_appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles 
      WHERE id = homeowner_appointments.contractor_id 
      AND user_id = auth.uid()
    )
  );

-- Enable realtime for appointment updates
ALTER PUBLICATION supabase_realtime ADD TABLE homeowner_appointments;

-- Create trigger for updated_at
CREATE TRIGGER update_homeowner_appointments_updated_at
  BEFORE UPDATE ON homeowner_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();