-- Extend user_roles enum to support new user types
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'contractor';

-- Contractor profiles for directory
CREATE TABLE IF NOT EXISTS public.contractor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  service_area TEXT[],
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'pending',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher profiles for learning platform
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  expertise TEXT[],
  avatar_url TEXT,
  social_links JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Service categories (Pre-Storm Certification, Maintenance)
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service tiers (pricing levels)
CREATE TABLE IF NOT EXISTS public.service_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC,
  features TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service requests from customers
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_tier_id UUID REFERENCES public.service_tiers(id),
  property_address TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product categories for merchandise store
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products for merchandise store
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  images JSONB,
  available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contact requests for products
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blog posts (AI-generated daily + manual)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  tags TEXT[],
  published_at TIMESTAMPTZ DEFAULT now(),
  is_ai_generated BOOLEAN DEFAULT false,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Courses for learning platform
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Course modules
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Course lessons
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  pdf_url TEXT,
  duration_minutes INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Course quizzes
CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id, student_id)
);

-- Lesson progress tracking
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(enrollment_id, lesson_id)
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_profiles
CREATE POLICY "Contractor profiles are viewable by everyone"
  ON public.contractor_profiles FOR SELECT
  USING (true);

CREATE POLICY "Contractors can update their own profile"
  ON public.contractor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Contractors can insert their own profile"
  ON public.contractor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for teacher_profiles
CREATE POLICY "Teacher profiles are viewable by everyone"
  ON public.teacher_profiles FOR SELECT
  USING (true);

CREATE POLICY "Teachers can update their own profile"
  ON public.teacher_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can insert their own profile"
  ON public.teacher_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for service categories and tiers (public read)
CREATE POLICY "Service categories are viewable by everyone"
  ON public.service_categories FOR SELECT
  USING (true);

CREATE POLICY "Service tiers are viewable by everyone"
  ON public.service_tiers FOR SELECT
  USING (true);

-- RLS Policies for service requests (anyone can submit)
CREATE POLICY "Anyone can submit service requests"
  ON public.service_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all service requests"
  ON public.service_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for product categories and products (public read)
CREATE POLICY "Product categories are viewable by everyone"
  ON public.product_categories FOR SELECT
  USING (true);

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

-- RLS Policies for contact requests (anyone can submit)
CREATE POLICY "Anyone can submit contact requests"
  ON public.contact_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all contact requests"
  ON public.contact_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for blog posts (public read)
CREATE POLICY "Blog posts are viewable by everyone"
  ON public.blog_posts FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for courses (public read for published)
CREATE POLICY "Published courses are viewable by everyone"
  ON public.courses FOR SELECT
  USING (is_published = true OR auth.uid() IN (
    SELECT user_id FROM public.teacher_profiles WHERE id = teacher_id
  ));

CREATE POLICY "Teachers can manage their own courses"
  ON public.courses FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM public.teacher_profiles WHERE id = teacher_id
  ));

-- RLS Policies for course modules
CREATE POLICY "Course modules are viewable with course access"
  ON public.course_modules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id AND (is_published = true OR auth.uid() IN (
      SELECT user_id FROM public.teacher_profiles WHERE id = courses.teacher_id
    ))
  ));

CREATE POLICY "Teachers can manage their course modules"
  ON public.course_modules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.teacher_profiles t ON c.teacher_id = t.id
    WHERE c.id = course_id AND t.user_id = auth.uid()
  ));

-- RLS Policies for course lessons
CREATE POLICY "Course lessons are viewable with course access"
  ON public.course_lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON m.course_id = c.id
    WHERE m.id = module_id AND (c.is_published = true OR auth.uid() IN (
      SELECT user_id FROM public.teacher_profiles WHERE id = c.teacher_id
    ))
  ));

CREATE POLICY "Teachers can manage their course lessons"
  ON public.course_lessons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON m.course_id = c.id
    JOIN public.teacher_profiles t ON c.teacher_id = t.id
    WHERE m.id = module_id AND t.user_id = auth.uid()
  ));

-- RLS Policies for course quizzes
CREATE POLICY "Course quizzes are viewable with course access"
  ON public.course_quizzes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.course_lessons l
    JOIN public.course_modules m ON l.module_id = m.id
    JOIN public.courses c ON m.course_id = c.id
    WHERE l.id = lesson_id AND (c.is_published = true OR auth.uid() IN (
      SELECT user_id FROM public.teacher_profiles WHERE id = c.teacher_id
    ))
  ));

CREATE POLICY "Teachers can manage their course quizzes"
  ON public.course_quizzes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.course_lessons l
    JOIN public.course_modules m ON l.module_id = m.id
    JOIN public.courses c ON m.course_id = c.id
    JOIN public.teacher_profiles t ON c.teacher_id = t.id
    WHERE l.id = lesson_id AND t.user_id = auth.uid()
  ));

-- RLS Policies for course enrollments
CREATE POLICY "Students can view their own enrollments"
  ON public.course_enrollments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll themselves"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view enrollments for their courses"
  ON public.course_enrollments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.teacher_profiles t ON c.teacher_id = t.id
    WHERE c.id = course_id AND t.user_id = auth.uid()
  ));

-- RLS Policies for lesson progress
CREATE POLICY "Students can view their own progress"
  ON public.lesson_progress FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE id = enrollment_id AND student_id = auth.uid()
  ));

CREATE POLICY "Students can update their own progress"
  ON public.lesson_progress FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE id = enrollment_id AND student_id = auth.uid()
  ));

-- RLS Policies for quiz attempts
CREATE POLICY "Students can view their own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE id = enrollment_id AND student_id = auth.uid()
  ));

CREATE POLICY "Students can submit quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE id = enrollment_id AND student_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_contractor_profiles_user_id ON public.contractor_profiles(user_id);
CREATE INDEX idx_contractor_profiles_category ON public.contractor_profiles(category);
CREATE INDEX idx_teacher_profiles_user_id ON public.teacher_profiles(user_id);
CREATE INDEX idx_service_tiers_category_id ON public.service_tiers(category_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX idx_course_enrollments_student_id ON public.course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course_id ON public.course_enrollments(course_id);