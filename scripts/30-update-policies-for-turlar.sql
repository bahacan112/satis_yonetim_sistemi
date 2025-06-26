-- Enable RLS for turlar table
ALTER TABLE turlar ENABLE ROW LEVEL SECURITY;

-- Policy for admin: full access
DROP POLICY IF EXISTS "admin_all_access_turlar" ON turlar;
CREATE POLICY "admin_all_access_turlar" ON turlar
FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Policy for standart: read access
DROP POLICY IF EXISTS "standart_read_access_turlar" ON turlar;
CREATE POLICY "standart_read_access_turlar" ON turlar
FOR SELECT USING (get_user_role() = 'standart');
