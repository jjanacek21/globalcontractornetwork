
DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
