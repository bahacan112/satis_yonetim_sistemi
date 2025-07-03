-- RLS politikalarını güncelle
-- satislar tablosu için RLS politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON satislar;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON satislar;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON satislar;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON satislar;

CREATE POLICY "Allow all access for admins" ON satislar
FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Allow read access for standart users" ON satislar
FOR SELECT USING (get_user_role() = 'standart');

CREATE POLICY "Allow insert for standart users" ON satislar
FOR INSERT WITH CHECK (get_user_role() = 'standart');

CREATE POLICY "Allow update for standart users" ON satislar
FOR UPDATE USING (get_user_role() = 'standart');

CREATE POLICY "Allow delete for standart users" ON satislar
FOR DELETE USING (get_user_role() = 'standart');

-- magaza_satis_kalemleri tablosu için RLS politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON magaza_satis_kalemleri;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON magaza_satis_kalemleri;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON magaza_satis_kalemleri;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON magaza_satis_kalemleri;

CREATE POLICY "Allow all access for admins on magaza_satis_kalemleri" ON magaza_satis_kalemleri
FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Allow read access for standart users on magaza_satis_kalemleri" ON magaza_satis_kalemleri
FOR SELECT USING (get_user_role() = 'standart');

-- rehber_satis_kalemleri tablosu için RLS politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON rehber_satis_kalemleri;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON rehber_satis_kalemleri;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON rehber_satis_kalemleri;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON rehber_satis_kalemleri;

CREATE POLICY "Allow all access for admins on rehber_satis_kalemleri" ON rehber_satis_kalemleri
FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Allow read access for standart users on rehber_satis_kalemleri" ON rehber_satis_kalemleri
FOR SELECT USING (get_user_role() = 'standart');

CREATE POLICY "Allow insert for standart users on rehber_satis_kalemleri" ON rehber_satis_kalemleri
FOR INSERT WITH CHECK (get_user_role() = 'standart');

CREATE POLICY "Allow update for standart users on rehber_satis_kalemleri" ON rehber_satis_kalemleri
FOR UPDATE USING (get_user_role() = 'standart');

CREATE POLICY "Allow delete for standart users on rehber_satis_kalemleri" ON rehber_satis_kalemleri
FOR DELETE USING (get_user_role() = 'standart');

-- Diğer tablolar için mevcut RLS politikalarını koru veya güncelle
-- firmalar
DROP POLICY IF EXISTS "Enable read access for all users" ON firmalar;
CREATE POLICY "Enable read access for all users" ON firmalar FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all access for admins" ON firmalar;
CREATE POLICY "Allow all access for admins" ON firmalar FOR ALL USING (get_user_role() = 'admin');

-- magazalar
DROP POLICY IF EXISTS "Enable read access for all users" ON magazalar;
CREATE POLICY "Enable read access for all users" ON magazalar FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all access for admins" ON magazalar;
CREATE POLICY "Allow all access for admins" ON magazalar FOR ALL USING (get_user_role() = 'admin');

-- operatorler
DROP POLICY IF EXISTS "Enable read access for all users" ON operatorler;
CREATE POLICY "Enable read access for all users" ON operatorler FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all access for admins" ON operatorler;
CREATE POLICY "Allow all access for admins" ON operatorler FOR ALL USING (get_user_role() = 'admin');

-- rehberler
DROP POLICY IF EXISTS "Enable read access for all users" ON rehberler;
CREATE POLICY "Enable read access for all users" ON rehberler FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all access for admins" ON rehberler;
CREATE POLICY "Allow all access for admins" ON rehberler FOR ALL USING (get_user_role() = 'admin');

-- urunler
DROP POLICY IF EXISTS "Enable read access for all users" ON urunler;
CREATE POLICY "Enable read access for all users" ON urunler FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all access for admins" ON urunler;
CREATE POLICY "Allow all access for admins" ON urunler FOR ALL USING (get_user_role() = 'admin');

-- profiles
DROP POLICY IF EXISTS "Allow all access for admins" ON profiles;
CREATE POLICY "Allow all access for admins" ON profiles FOR ALL USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON profiles;
CREATE POLICY "Allow read access for authenticated users" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow update for authenticated users" ON profiles;
CREATE POLICY "Allow update for authenticated users" ON profiles FOR UPDATE USING (auth.uid() = id);
