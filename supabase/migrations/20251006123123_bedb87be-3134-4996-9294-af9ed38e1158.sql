-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'sales_rep');

-- Create enum for pipeline stages
CREATE TYPE public.pipeline_stage AS ENUM (
  'lead',
  'inspection',
  'estimate_sent',
  'sold',
  'in_production',
  'complete'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  insurance_company TEXT,
  insurance_policy TEXT,
  lead_source TEXT,
  pipeline_stage pipeline_stage DEFAULT 'lead',
  notes TEXT,
  assigned_rep_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_documents table
CREATE TABLE public.customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create measurements table
CREATE TABLE public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  property_image_url TEXT,
  total_squares DECIMAL(10,2),
  total_square_feet DECIMAL(10,2),
  linear_feet_eave DECIMAL(10,2),
  linear_feet_rake DECIMAL(10,2),
  linear_feet_hip DECIMAL(10,2),
  linear_feet_valley DECIMAL(10,2),
  pitch_multiplier DECIMAL(4,2),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create estimates table
CREATE TABLE public.estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  measurement_id UUID REFERENCES public.measurements(id),
  estimate_number TEXT UNIQUE,
  version INTEGER DEFAULT 1,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create estimate_line_items table
CREATE TABLE public.estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create presentations table
CREATE TABLE public.presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  is_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create presentation_slides table
CREATE TABLE public.presentation_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES public.presentations(id) ON DELETE CASCADE NOT NULL,
  slide_type TEXT NOT NULL,
  title TEXT,
  content JSONB,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_slides ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for customers
CREATE POLICY "Admins can view all customers" ON public.customers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sales reps can view assigned customers" ON public.customers FOR SELECT USING (
  public.has_role(auth.uid(), 'sales_rep') AND assigned_rep_id = auth.uid()
);
CREATE POLICY "Admins can manage all customers" ON public.customers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sales reps can update assigned customers" ON public.customers FOR UPDATE USING (
  public.has_role(auth.uid(), 'sales_rep') AND assigned_rep_id = auth.uid()
);
CREATE POLICY "Sales reps can create customers" ON public.customers FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'sales_rep')
);

-- RLS Policies for customer_documents
CREATE POLICY "Users can view documents for accessible customers" ON public.customer_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = customer_documents.customer_id 
    AND (public.has_role(auth.uid(), 'admin') OR assigned_rep_id = auth.uid())
  )
);
CREATE POLICY "Users can manage documents for accessible customers" ON public.customer_documents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = customer_documents.customer_id 
    AND (public.has_role(auth.uid(), 'admin') OR assigned_rep_id = auth.uid())
  )
);

-- RLS Policies for measurements
CREATE POLICY "Users can view measurements for accessible customers" ON public.measurements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = measurements.customer_id 
    AND (public.has_role(auth.uid(), 'admin') OR assigned_rep_id = auth.uid())
  )
);
CREATE POLICY "Users can manage measurements for accessible customers" ON public.measurements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = measurements.customer_id 
    AND (public.has_role(auth.uid(), 'admin') OR assigned_rep_id = auth.uid())
  )
);

-- RLS Policies for estimates
CREATE POLICY "Users can view estimates for accessible customers" ON public.estimates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = estimates.customer_id 
    AND (public.has_role(auth.uid(), 'admin') OR assigned_rep_id = auth.uid())
  )
);
CREATE POLICY "Users can manage estimates for accessible customers" ON public.estimates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = estimates.customer_id 
    AND (public.has_role(auth.uid(), 'admin') OR assigned_rep_id = auth.uid())
  )
);

-- RLS Policies for estimate_line_items
CREATE POLICY "Users can view line items for accessible estimates" ON public.estimate_line_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.estimates e
    JOIN public.customers c ON e.customer_id = c.id
    WHERE e.id = estimate_line_items.estimate_id
    AND (public.has_role(auth.uid(), 'admin') OR c.assigned_rep_id = auth.uid())
  )
);
CREATE POLICY "Users can manage line items for accessible estimates" ON public.estimate_line_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.estimates e
    JOIN public.customers c ON e.customer_id = c.id
    WHERE e.id = estimate_line_items.estimate_id
    AND (public.has_role(auth.uid(), 'admin') OR c.assigned_rep_id = auth.uid())
  )
);

-- RLS Policies for presentations
CREATE POLICY "Users can view all presentations" ON public.presentations FOR SELECT USING (true);
CREATE POLICY "Admins can manage all presentations" ON public.presentations FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create presentations" ON public.presentations FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for presentation_slides
CREATE POLICY "Users can view all slides" ON public.presentation_slides FOR SELECT USING (true);
CREATE POLICY "Admins can manage all slides" ON public.presentation_slides FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own presentation slides" ON public.presentation_slides FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.presentations
    WHERE id = presentation_slides.presentation_id
    AND created_by = auth.uid()
  )
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON public.measurements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_presentations_updated_at BEFORE UPDATE ON public.presentations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-documents', 'customer-documents', false);

-- Storage policies for customer documents
CREATE POLICY "Users can view documents for accessible customers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'customer-documents' AND
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE (public.has_role(auth.uid(), 'admin') OR c.assigned_rep_id = auth.uid())
  )
);

CREATE POLICY "Users can upload documents for accessible customers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete documents for accessible customers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'customer-documents' AND
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE (public.has_role(auth.uid(), 'admin') OR c.assigned_rep_id = auth.uid())
  )
);