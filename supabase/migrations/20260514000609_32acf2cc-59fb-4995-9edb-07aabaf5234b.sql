
-- 1. contractor_documents table
CREATE TABLE IF NOT EXISTS public.contractor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('license','insurance','workers_comp','w9','other')),
  file_url text NOT NULL,
  file_name text,
  notes text,
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  CHECK (contractor_id IS NOT NULL OR company_id IS NOT NULL)
);

ALTER TABLE public.contractor_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors view own documents"
  ON public.contractor_documents FOR SELECT TO authenticated
  USING (
    contractor_id IN (SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_member(company_id))
    OR public.is_super_admin()
  );

CREATE POLICY "Contractors insert own documents"
  ON public.contractor_documents FOR INSERT TO authenticated
  WITH CHECK (
    contractor_id IN (SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_member(company_id))
  );

CREATE POLICY "Contractors delete own documents"
  ON public.contractor_documents FOR DELETE TO authenticated
  USING (
    contractor_id IN (SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_member(company_id))
    OR public.is_super_admin()
  );

-- 2. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-credentials', 'contractor-credentials', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Contractors read own credentials"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'contractor-credentials'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_super_admin()
    )
  );

CREATE POLICY "Contractors upload own credentials"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'contractor-credentials'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Contractors update own credentials"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'contractor-credentials'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Contractors delete own credentials"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'contractor-credentials'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

-- 3. Default features grant
CREATE OR REPLACE FUNCTION public.grant_default_contractor_features(_contractor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  feat text;
  default_features text[] := ARRAY[
    'permit_queens',
    'gcn_app',
    'job_marketplace',
    'directory_listing',
    'property_iq',
    'referral_network',
    'estimating_supplementing',
    'digital_marketing',
    'academy_access'
  ];
BEGIN
  FOREACH feat IN ARRAY default_features LOOP
    INSERT INTO public.contractor_feature_access (contractor_id, feature_name, is_approved, approved_at)
    VALUES (_contractor_id, feat, true, now())
    ON CONFLICT (contractor_id, feature_name) DO UPDATE SET is_approved = true, approved_at = COALESCE(contractor_feature_access.approved_at, now());
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_grant_default_features()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.grant_default_contractor_features(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contractor_profiles_grant_default_features ON public.contractor_profiles;
CREATE TRIGGER contractor_profiles_grant_default_features
  AFTER INSERT ON public.contractor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_grant_default_features();

-- 4. Backfill
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.contractor_profiles LOOP
    PERFORM public.grant_default_contractor_features(r.id);
  END LOOP;
END $$;

-- 5. Remove deprecated feature keys
DELETE FROM public.contractor_feature_access
WHERE feature_name IN ('supplement_kings','green_home_solutions');
