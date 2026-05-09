
-- Company invitations
CREATE TABLE IF NOT EXISTS public.company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.company_role NOT NULL DEFAULT 'sales_rep',
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  job_title text,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON public.company_invitations(token);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON public.company_invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_company_invitations_company ON public.company_invitations(company_id);

ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins and super admins manage invitations"
ON public.company_invitations FOR ALL
TO authenticated
USING (public.is_company_or_super_admin(company_id))
WITH CHECK (public.is_company_or_super_admin(company_id));

-- Directory access requests
CREATE TABLE IF NOT EXISTS public.directory_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_profile_id uuid NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('directory','referral','social')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dir_access_user ON public.directory_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dir_access_status ON public.directory_access_requests(status);

ALTER TABLE public.directory_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own requests"
ON public.directory_access_requests FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users create own requests"
ON public.directory_access_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins update requests"
ON public.directory_access_requests FOR UPDATE TO authenticated
USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins delete requests"
ON public.directory_access_requests FOR DELETE TO authenticated
USING (public.is_super_admin());

CREATE TRIGGER trg_dir_access_requests_updated_at
BEFORE UPDATE ON public.directory_access_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_company_invitations_updated_at
BEFORE UPDATE ON public.company_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
