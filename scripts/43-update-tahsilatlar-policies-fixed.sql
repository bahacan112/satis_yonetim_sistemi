-- Helper function to check if user is standart
CREATE OR REPLACE FUNCTION is_standart()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'standart'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies for tahsilatlar (without IF EXISTS)
-- These commands might throw an error if the policy does not exist,
-- but the subsequent CREATE POLICY commands will ensure policies are set.
ALTER TABLE public.tahsilatlar DROP POLICY "Enable read access for all users";
ALTER TABLE public.tahsilatlar DROP POLICY "Enable insert for authenticated users";
ALTER TABLE public.tahsilatlar DROP POLICY "Enable update for authenticated users";
ALTER TABLE public.tahsilatlar DROP POLICY "Enable delete for authenticated users";

-- Recreate policies for tahsilatlar using helper functions
CREATE POLICY "Admins and standart users can view tahsilatlar" ON public.tahsilatlar
  FOR SELECT USING (is_admin() OR is_standart());

CREATE POLICY "Admins and standart users can insert tahsilatlar" ON public.tahsilatlar
  FOR INSERT WITH CHECK (is_admin() OR is_standart());

CREATE POLICY "Admins and standart users can update tahsilatlar" ON public.tahsilatlar
  FOR UPDATE USING (is_admin() OR is_standart());

CREATE POLICY "Admins and standart users can delete tahsilatlar" ON public.tahsilatlar
  FOR DELETE USING (is_admin() OR is_standart());
