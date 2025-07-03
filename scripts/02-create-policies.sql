-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is operator
CREATE OR REPLACE FUNCTION is_operator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'operator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Firmalar policies
CREATE POLICY "Admins can do everything on firmalar" ON firmalar
  FOR ALL USING (is_admin());

CREATE POLICY "Operators can view firmalar" ON firmalar
  FOR SELECT USING (is_operator() OR is_admin());

-- Mağazalar policies
CREATE POLICY "Admins can do everything on magazalar" ON magazalar
  FOR ALL USING (is_admin());

CREATE POLICY "Operators can view magazalar" ON magazalar
  FOR SELECT USING (is_operator() OR is_admin());

-- Ürünler policies
CREATE POLICY "Admins can do everything on urunler" ON urunler
  FOR ALL USING (is_admin());

CREATE POLICY "Operators can view urunler" ON urunler
  FOR SELECT USING (is_operator() OR is_admin());

-- Operatörler policies
CREATE POLICY "Admins can do everything on operatorler" ON operatorler
  FOR ALL USING (is_admin());

CREATE POLICY "Operators can view operatorler" ON operatorler
  FOR SELECT USING (is_operator() OR is_admin());

-- Rehberler policies
CREATE POLICY "Admins can do everything on rehberler" ON rehberler
  FOR ALL USING (is_admin());

CREATE POLICY "Operators can view rehberler" ON rehberler
  FOR SELECT USING (is_operator() OR is_admin());

-- Satışlar policies
CREATE POLICY "Admins can do everything on satislar" ON satislar
  FOR ALL USING (is_admin());

CREATE POLICY "Operators can view satislar" ON satislar
  FOR SELECT USING (is_operator() OR is_admin());

-- Satış Kalemleri policies (Operators can update rehber bildirim fields)
CREATE POLICY "Admins can do everything on satis_kalemleri" ON satis_kalemleri
  FOR ALL USING (is_admin());

CREATE POLICY "Operators can view satis_kalemleri" ON satis_kalemleri
  FOR SELECT USING (is_operator() OR is_admin());

CREATE POLICY "Operators can update rehber bildirim on satis_kalemleri" ON satis_kalemleri
  FOR UPDATE USING (is_operator() OR is_admin());
