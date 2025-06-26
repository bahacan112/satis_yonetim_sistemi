-- Bu script turlar tablosu ile ilgili tüm güncellemeleri sırayla çalıştırır

-- 1. Turlar tablosunu oluştur
CREATE TABLE IF NOT EXISTS turlar (
  id SERIAL PRIMARY KEY,
  tur_adi TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Başlangıç verilerini ekle
INSERT INTO turlar (tur_adi) VALUES
('Şehir Turu'),
('Doğa Turu'),
('Kültür Turu'),
('Macera Turu'),
('Yemek Turu'),
('Günübirlik Tur'),
('Tekne Turu'),
('Alışveriş Turu')
ON CONFLICT (tur_adi) DO NOTHING;

-- 3. Satislar tablosuna tur_id sütununu ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'satislar' AND column_name = 'tur_id') THEN
        ALTER TABLE satislar ADD COLUMN tur_id INTEGER REFERENCES turlar(id);
    END IF;
END $$;

-- 4. Eski tur sütununu kaldır (eğer varsa)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'satislar' AND column_name = 'tur') THEN
        ALTER TABLE satislar DROP COLUMN tur;
    END IF;
END $$;

-- 5. Turlar tablosu için RLS politikalarını oluştur
ALTER TABLE turlar ENABLE ROW LEVEL SECURITY;

-- Admin için tam erişim
DROP POLICY IF EXISTS "admin_all_access_turlar" ON turlar;
CREATE POLICY "admin_all_access_turlar" ON turlar
FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Standart kullanıcı için okuma erişimi
DROP POLICY IF EXISTS "standart_read_access_turlar" ON turlar;
CREATE POLICY "standart_read_access_turlar" ON turlar
FOR SELECT USING (get_user_role() = 'standart');

-- 6. Satislar detay view'ini güncelle
DROP VIEW IF EXISTS satislar_detay_view;

CREATE OR REPLACE VIEW satislar_detay_view AS
SELECT
  s.id AS satis_id,
  s.satis_tarihi,
  s.grup_gelis_tarihi,
  s.magaza_giris_tarihi,
  s.grup_pax,
  s.magaza_pax,
  t.tur_adi AS tur,
  s.bekleme,
  'magaza' AS bildirim_tipi,
  s.created_at,
  o.operator_adi,
  r.rehber_adi,
  m.magaza_adi,
  f.firma_adi,
  msk.urun_id,
  u.urun_adi,
  msk.adet,
  msk.birim_fiyat,
  msk.acente_komisyonu,
  msk.rehber_komisyonu,
  msk.kaptan_komisyonu,
  (msk.adet * msk.birim_fiyat) AS toplam_tutar
FROM satislar s
JOIN magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN operatorler o ON s.operator_id = o.id
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN firmalar f ON s.firma_id = f.id
LEFT JOIN urunler u ON msk.urun_id = u.id
LEFT JOIN turlar t ON s.tur_id = t.id

UNION ALL

SELECT
  s.id AS satis_id,
  s.satis_tarihi,
  s.grup_gelis_tarihi,
  s.magaza_giris_tarihi,
  s.grup_pax,
  s.magaza_pax,
  t.tur_adi AS tur,
  s.bekleme,
  'rehber' AS bildirim_tipi,
  s.created_at,
  o.operator_adi,
  r.rehber_adi,
  m.magaza_adi,
  f.firma_adi,
  rsk.urun_id,
  u.urun_adi,
  rsk.adet,
  rsk.birim_fiyat,
  NULL AS acente_komisyonu,
  NULL AS rehber_komisyonu,
  NULL AS kaptan_komisyonu,
  (rsk.adet * rsk.birim_fiyat) AS toplam_tutar
FROM satislar s
JOIN rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN operatorler o ON s.operator_id = o.id
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN firmalar f ON s.firma_id = f.id
LEFT JOIN urunler u ON rsk.urun_id = u.id
LEFT JOIN turlar t ON s.tur_id = t.id;

SELECT 'Turlar tablosu ve ilgili güncellemeler başarıyla tamamlandı!' as result;
