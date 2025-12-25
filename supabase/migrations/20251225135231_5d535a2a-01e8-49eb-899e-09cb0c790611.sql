-- Create network_members table for property owners and general network members
CREATE TABLE public.network_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  member_type TEXT NOT NULL DEFAULT 'property_owner',
  status TEXT NOT NULL DEFAULT 'active',
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'FL',
  zip TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.network_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own membership
CREATE POLICY "Users can view own membership" ON public.network_members
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own membership
CREATE POLICY "Users can update own membership" ON public.network_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own membership
CREATE POLICY "Users can insert own membership" ON public.network_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Super admins can manage all members
CREATE POLICY "Super admins can manage network members" ON public.network_members
  FOR ALL USING (is_super_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_network_members_updated_at
  BEFORE UPDATE ON public.network_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();