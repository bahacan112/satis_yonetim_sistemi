-- Helper function to check if user is standart
-- Ensure is_admin() is also defined elsewhere or define it here if not.
-- For completeness, assuming is_admin() exists.
CREATE OR REPLACE FUNCTION is_standart()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'standart'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies for tahsilatlar robustly using format() for identifiers
DO $$
BEGIN
    EXECUTE format('ALTER TABLE public.tahsilatlar DROP POLICY %I', 'Enable read access for all users');
EXCEPTION
    WHEN UNDEFINED_OBJECT THEN
        RAISE NOTICE 'Policy "Enable read access for all users" does not exist, skipping drop.';
END
$$;

DO $$
BEGIN
    EXECUTE format('ALTER TABLE public.tahsilatlar DROP POLICY %I', 'Enable insert for authenticated users');
EXCEPTION
    WHEN UNDEFINED_OBJECT THEN
        RAISE NOTICE 'Policy "Enable insert for authenticated users" does not exist, skipping drop.';
END
$$;

DO $$
BEGIN
    EXECUTE format('ALTER TABLE public.tahsilatlar DROP POLICY %I', 'Enable update for authenticated users');
EXCEPTION
    WHEN UNDEFINED_OBJECT THEN
        RAISE NOTICE 'Policy "Enable update for authenticated users" does not exist, skipping drop.';
END
$$;

DO $$
BEGIN
    EXECUTE format('ALTER TABLE public.tahsilatlar DROP POLICY %I', 'Enable delete for authenticated users');
EXCEPTION
    WHEN UNDEFINED_OBJECT THEN
        RAISE NOTICE 'Policy "Enable delete for authenticated users" does not exist, skipping drop.';
END
$$;

-- Recreate policies for tahsilatlar using helper functions
CREATE POLICY "Admins and standart users can view tahsilatlar" ON public.tahsilatlar
  FOR SELECT USING (is_admin() OR is_standart());

CREATE POLICY "Admins and standart users can insert tahsilatlar" ON public.tahsilatlar
  FOR INSERT WITH CHECK (is_admin() OR is_standart());

CREATE POLICY "Admins and standart users can update tahsilatlar" ON public.tahsilatlar
  FOR UPDATE USING (is_admin() OR is_standart());

CREATE POLICY "Admins and standart users can delete tahsilatlar" ON public.tahsilatlar
  FOR DELETE USING (is_admin() OR is_standart());
