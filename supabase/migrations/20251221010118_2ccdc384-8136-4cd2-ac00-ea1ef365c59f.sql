-- Super admins can update all coating leads
CREATE POLICY "Super admins can update coating leads"
ON public.coating_leads FOR UPDATE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can delete coating leads
CREATE POLICY "Super admins can delete coating leads"
ON public.coating_leads FOR DELETE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can update all window leads
CREATE POLICY "Super admins can update window leads"
ON public.window_leads FOR UPDATE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can delete window leads
CREATE POLICY "Super admins can delete window leads"
ON public.window_leads FOR DELETE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can update roofing consultations
CREATE POLICY "Super admins can update roofing consultations"
ON public.roofing_consultations FOR UPDATE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can delete roofing consultations
CREATE POLICY "Super admins can delete roofing consultations"
ON public.roofing_consultations FOR DELETE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can update supplement leads
CREATE POLICY "Super admins can update supplement leads"
ON public.supplement_leads FOR UPDATE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can delete supplement leads
CREATE POLICY "Super admins can delete supplement leads"
ON public.supplement_leads FOR DELETE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can update contact requests
CREATE POLICY "Super admins can update contact requests"
ON public.contact_requests FOR UPDATE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can delete contact requests
CREATE POLICY "Super admins can delete contact requests"
ON public.contact_requests FOR DELETE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can update service requests
CREATE POLICY "Super admins can update service requests"
ON public.service_requests FOR UPDATE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can delete service requests
CREATE POLICY "Super admins can delete service requests"
ON public.service_requests FOR DELETE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can update contractor profiles
CREATE POLICY "Super admins can update contractor profiles"
ON public.contractor_profiles FOR UPDATE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can insert contractor profiles
CREATE POLICY "Super admins can insert contractor profiles"
ON public.contractor_profiles FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can delete contractor profiles
CREATE POLICY "Super admins can delete contractor profiles"
ON public.contractor_profiles FOR DELETE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can update supplement contractors
CREATE POLICY "Super admins can update supplement contractors"
ON public.supplement_contractors FOR UPDATE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can insert supplement contractors
CREATE POLICY "Super admins can insert supplement contractors"
ON public.supplement_contractors FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can delete supplement contractors
CREATE POLICY "Super admins can delete supplement contractors"
ON public.supplement_contractors FOR DELETE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can update permit contractors
CREATE POLICY "Super admins can update permit contractors"
ON public.permit_contractors FOR UPDATE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can insert permit contractors
CREATE POLICY "Super admins can insert permit contractors"
ON public.permit_contractors FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- Super admins can delete permit contractors
CREATE POLICY "Super admins can delete permit contractors"
ON public.permit_contractors FOR DELETE
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));