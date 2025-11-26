-- Create store members table for rewards program
CREATE TABLE public.store_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  points_balance INTEGER DEFAULT 100 NOT NULL,
  total_points_earned INTEGER DEFAULT 100 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create points transactions table
CREATE TYPE public.transaction_type AS ENUM ('purchase', 'reward', 'referral', 'redemption', 'welcome_bonus');

CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.store_members(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  transaction_type transaction_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_members
CREATE POLICY "Members can view their own profile"
  ON public.store_members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can insert their own profile"
  ON public.store_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update their own profile"
  ON public.store_members
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for points_transactions
CREATE POLICY "Members can view their own transactions"
  ON public.points_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members
      WHERE id = points_transactions.member_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert their own transactions"
  ON public.points_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_members
      WHERE id = points_transactions.member_id
      AND user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_store_members_updated_at
  BEFORE UPDATE ON public.store_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();