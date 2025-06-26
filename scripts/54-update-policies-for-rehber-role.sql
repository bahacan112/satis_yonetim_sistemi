-- Rehber rolü için yeni yardımcı fonksiyonlar ve RLS politikaları oluşturur/günceller.

-- Kullanıcının rehber rolünde olup olmadığını kontrol eden yardımcı fonksiyon.
CREATE OR REPLACE FUNCTION is_rehber()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'rehber'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mevcut kullanıcının profiles tablosundaki rehber_id'sini döndüren fonksiyon.
CREATE OR REPLACE FUNCTION get_current_rehber_id()
RETURNS INT AS $$
  SELECT rehber_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Rehberler tablosu politikaları:
-- Rehberler kendi rehber kayıtlarını görebilir ve güncelleyebilir.
-- Adminler ve Operatörler tüm rehberleri görebilir.
DROP POLICY IF EXISTS "Rehber can view own rehber entry" ON rehberler;
CREATE POLICY "Rehber can view own rehber entry" ON rehberler
  FOR SELECT USING (id = get_current_rehber_id() OR is_admin() OR is_operator());

DROP POLICY IF EXISTS "Rehber can update own rehber entry" ON rehberler;
CREATE POLICY "Rehber can update own rehber entry" ON rehberler
  FOR UPDATE USING (id = get_current_rehber_id());

-- Satışlar tablosu politikaları:
-- Rehberler sadece kendilerine atanan satışları görebilir.
-- Adminler ve Operatörler tüm satışları görebilir.
DROP POLICY IF EXISTS "Rehber can view own sales" ON satislar;
CREATE POLICY "Rehber can view own sales" ON satislar
  FOR SELECT USING (rehber_id = get_current_rehber_id() OR is_admin() OR is_operator());

-- Magaza_satis_kalemleri tablosu politikaları:
-- Rehberler, kendilerine atanan satışlarla ilgili mağaza satış kalemlerini görebilir.
DROP POLICY IF EXISTS "Rehber can view magaza_satis_kalemleri related to own sales" ON magaza_satis_kalemleri;
CREATE POLICY "Rehber can view magaza_satis_kalemleri related to own sales" ON magaza_satis_kalemleri
  FOR SELECT USING (satis_id IN (SELECT id FROM satislar WHERE rehber_id = get_current_rehber_id()) OR is_admin() OR is_operator());

-- Rehber_satis_kalemleri tablosu politikaları:
-- Rehberler kendi rehber satış kalemlerini görebilir ve güncelleyebilir.
DROP POLICY IF EXISTS "Rehber can view own rehber_satis_kalemleri" ON rehber_satis_kalemleri;
CREATE POLICY "Rehber can view own rehber_satis_kalemleri" ON rehber_satis_kalemleri
  FOR SELECT USING (satis_id IN (SELECT id FROM satislar WHERE rehber_id = get_current_rehber_id()) OR is_admin() OR is_operator());

DROP POLICY IF EXISTS "Rehber can update own rehber_satis_kalemleri" ON rehber_satis_kalemleri;
CREATE POLICY "Rehber can update own rehber_satis_kalemleri" ON rehber_satis_kalemleri
  FOR UPDATE USING (satis_id IN (SELECT id FROM satislar WHERE rehber_id = get_current_rehber_id()));

-- Diğer tabloların SELECT politikalarını güncelleme (Rehber rolü için okuma izni ekleme):
-- Firmalar
DROP POLICY IF EXISTS "Rehber can view firmalar" ON firmalar;
CREATE POLICY "Rehber can view firmalar" ON firmalar
  FOR SELECT USING (is_rehber() OR is_operator() OR is_admin());

-- Mağazalar
DROP POLICY IF EXISTS "Rehber can view magazalar" ON magazalar;
CREATE POLICY "Rehber can view magazalar" ON magazalar
  FOR SELECT USING (is_rehber() OR is_operator() OR is_admin());

-- Ürünler
DROP POLICY IF EXISTS "Rehber can view urunler" ON urunler;
CREATE POLICY "Rehber can view urunler" ON urunler
  FOR SELECT USING (is_rehber() OR is_operator() OR is_admin());

-- Operatörler
DROP POLICY IF EXISTS "Rehber can view operatorler" ON operatorler;
CREATE POLICY "Rehber can view operatorler" ON operatorler
  FOR SELECT USING (is_rehber() OR is_operator() OR is_admin());

-- Turlar
DROP POLICY IF EXISTS "Rehber can view turlar" ON turlar;
CREATE POLICY "Rehber can view turlar" ON turlar
  FOR SELECT USING (is_rehber() OR is_operator() OR is_admin());

-- Tahsilatlar tablosu için rehber rolüne SELECT izni verilmemiştir, çünkü bu rol için gerekli değildir.
