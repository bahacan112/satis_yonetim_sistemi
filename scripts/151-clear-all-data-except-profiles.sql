-- Profiles hariç tüm tabloların verilerini sil
-- Foreign key kısıtlamaları nedeniyle doğru sırayla silme işlemi yapıyoruz

-- Önce bağımlı tabloları temizle
DELETE FROM tahsilatlar;
DELETE FROM rehber_satis_kalemleri;
DELETE FROM magaza_satis_kalemleri;
DELETE FROM satislar;
DELETE FROM magaza_urunler;
DELETE FROM urunler;
DELETE FROM turlar;
DELETE FROM magazalar;
DELETE FROM firmalar;
DELETE FROM rehberler;
DELETE FROM operatorler;

-- Sequence'leri sıfırla (eğer SERIAL kullanıyorsa)
-- UUID kullandığımız için bu adım gerekli değil, ama kontrol edelim

-- Temizlik işleminin başarılı olduğunu kontrol et
SELECT 
  'firmalar' as tablo, COUNT(*) as kayit_sayisi FROM firmalar
UNION ALL
SELECT 
  'magazalar' as tablo, COUNT(*) as kayit_sayisi FROM magazalar
UNION ALL
SELECT 
  'urunler' as tablo, COUNT(*) as kayit_sayisi FROM urunler
UNION ALL
SELECT 
  'magaza_urunler' as tablo, COUNT(*) as kayit_sayisi FROM magaza_urunler
UNION ALL
SELECT 
  'operatorler' as tablo, COUNT(*) as kayit_sayisi FROM operatorler
UNION ALL
SELECT 
  'rehberler' as tablo, COUNT(*) as kayit_sayisi FROM rehberler
UNION ALL
SELECT 
  'turlar' as tablo, COUNT(*) as kayit_sayisi FROM turlar
UNION ALL
SELECT 
  'satislar' as tablo, COUNT(*) as kayit_sayisi FROM satislar
UNION ALL
SELECT 
  'magaza_satis_kalemleri' as tablo, COUNT(*) as kayit_sayisi FROM magaza_satis_kalemleri
UNION ALL
SELECT 
  'rehber_satis_kalemleri' as tablo, COUNT(*) as kayit_sayisi FROM rehber_satis_kalemleri
UNION ALL
SELECT 
  'tahsilatlar' as tablo, COUNT(*) as kayit_sayisi FROM tahsilatlar
UNION ALL
SELECT 
  'profiles' as tablo, COUNT(*) as kayit_sayisi FROM profiles;
