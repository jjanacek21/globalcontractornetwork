-- Fix RLS policy for permit_form_templates to use permit_admins table
-- Drop the old policy that incorrectly checks profiles.role
DROP POLICY IF EXISTS "Admins can manage permit form templates" ON permit_form_templates;

-- Create new policy that correctly checks permit_admins table
CREATE POLICY "Permit admins can manage form templates" 
  ON permit_form_templates FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid()));