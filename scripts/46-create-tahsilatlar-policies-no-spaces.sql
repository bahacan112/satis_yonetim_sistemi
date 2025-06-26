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

-- Create new policies for tahsilatlar with no spaces in names
CREATE POLICY tahsilatlar_select_policy ON public.tahsilatlar
  FOR SELECT USING (is_admin() OR is_standart());

CREATE POLICY tahsilatlar_insert_policy ON public.tahsilatlar
  FOR INSERT WITH CHECK (is_admin() OR is_standart());

CREATE POLICY tahsilatlar_update_policy ON public.tahsilatlar
  FOR UPDATE USING (is_admin() OR is_standart());

CREATE POLICY tahsilatlar_delete_policy ON public.tahsilatlar
  FOR DELETE USING (is_admin() OR is_standart());
