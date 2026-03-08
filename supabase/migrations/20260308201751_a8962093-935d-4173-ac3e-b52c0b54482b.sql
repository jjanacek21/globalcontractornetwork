
-- Drop restrictive contact policies and replace with broader authenticated access
DROP POLICY IF EXISTS "Authenticated users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;

CREATE POLICY "Authenticated users can update contacts"
  ON contacts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view contacts"
  ON contacts FOR SELECT TO authenticated USING (true);

-- Drop restrictive property policies and replace
DROP POLICY IF EXISTS "Authenticated users can view own contact properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can update own contact properties" ON properties;

CREATE POLICY "Authenticated users can view properties"
  ON properties FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update properties"
  ON properties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
