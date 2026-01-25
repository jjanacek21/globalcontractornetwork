-- Drop the broken policy that checks profiles.role = 'admin'
DROP POLICY IF EXISTS "Admins can manage batches" ON permit_training_batches;

-- Create policies matching permit_packet_training pattern
CREATE POLICY "Super admins can manage batches"
  ON permit_training_batches FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Permit admins can manage batches"
  ON permit_training_batches FOR ALL
  USING (EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid()));