-- magaza_urunler tablosunu genişlet ve komisyon oranlarını buraya taşı
ALTER TABLE magaza_urunler 
ADD COLUMN IF NOT EXISTS acente_komisyonu DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rehber_komisyonu DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS kaptan_komisyonu DECIMAL(5,2) DEFAULT 0;

-- Mevcut verileri güncelle (varsa)
UPDATE magaza_urunler mu
SET 
  acente_komisyonu = u.acente_komisyonu,
  rehber_komisyonu = u.rehber_komisyonu,
  kaptan_komisyonu = u.kaptan_komisyonu
FROM urunler u
WHERE mu.urun_id = u.id;

-- Artık ürünler tablosunda komisyon oranlarına ihtiyaç yok
ALTER TABLE urunler 
DROP COLUMN IF EXISTS acente_komisyonu,
DROP COLUMN IF EXISTS rehber_komisyonu,
DROP COLUMN IF EXISTS kaptan_komisyonu;

-- Satışlar tablosunu güncelle - komisyon oranları artık magaza_urunler'den gelecek
-- (Mevcut satışlar için bir şey yapmıyoruz, onlar eski oranları koruyacak)
