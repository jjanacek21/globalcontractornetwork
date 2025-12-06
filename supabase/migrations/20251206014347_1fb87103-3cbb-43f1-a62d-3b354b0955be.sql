-- Create permit_admins table for admin access
CREATE TABLE public.permit_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  role text DEFAULT 'admin'
);

ALTER TABLE public.permit_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin records" ON public.permit_admins
FOR SELECT USING (auth.uid() = user_id);

-- Create permit_contractors table
CREATE TABLE public.permit_contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  license_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.permit_contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view their own profile" ON public.permit_contractors
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Contractors can insert their own profile" ON public.permit_contractors
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Contractors can update their own profile" ON public.permit_contractors
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all contractor profiles" ON public.permit_contractors
FOR SELECT USING (EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid()));

-- Add contractor_id to permit_projects
ALTER TABLE public.permit_projects ADD COLUMN contractor_id uuid REFERENCES public.permit_contractors(id);

-- Create admin policy for permit_projects
CREATE POLICY "Admins can view all permit projects" ON public.permit_projects
FOR SELECT USING (EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update all permit projects" ON public.permit_projects
FOR UPDATE USING (EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid()));

-- Add rating columns to contractor_profiles
ALTER TABLE public.contractor_profiles 
ADD COLUMN average_rating numeric DEFAULT 0,
ADD COLUMN review_count integer DEFAULT 0;

-- Create contractor_reviews table
CREATE TABLE public.contractor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid REFERENCES public.contractor_profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_email text,
  rating integer NOT NULL,
  review_text text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contractor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews are viewable by everyone" ON public.contractor_reviews
FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can submit reviews" ON public.contractor_reviews
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage reviews" ON public.contractor_reviews
FOR ALL USING (has_role(auth.uid(), 'admin'));