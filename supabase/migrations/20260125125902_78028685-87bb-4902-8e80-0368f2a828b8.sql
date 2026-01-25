-- Allow super admins to view all permit project documents
CREATE POLICY "Super admins can view all permit project documents"
  ON permit_project_documents
  FOR SELECT
  USING (public.is_super_admin());

-- Allow permit admins to view all permit project documents  
CREATE POLICY "Permit admins can view all permit project documents"
  ON permit_project_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM permit_admins
      WHERE permit_admins.user_id = auth.uid()
    )
  );

-- Allow super admins to update document validation status
CREATE POLICY "Super admins can update permit project documents"
  ON permit_project_documents
  FOR UPDATE
  USING (public.is_super_admin());

-- Allow permit admins to update document validation status
CREATE POLICY "Permit admins can update permit project documents"
  ON permit_project_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM permit_admins
      WHERE permit_admins.user_id = auth.uid()
    )
  );