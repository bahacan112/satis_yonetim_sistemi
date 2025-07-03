-- Satışlar tablosuna firma ve tarih bilgilerini ekle
ALTER TABLE satislar 
ADD COLUMN IF NOT EXISTS firma_id INTEGER REFERENCES firmalar(id),
ADD COLUMN IF NOT EXISTS satis_tarihi DATE DEFAULT CURRENT_DATE;

-- Mevcut satışlara firma bilgisini ekle (mağaza üzerinden)
UPDATE satislar 
SET firma_id = m.firma_id
FROM magazalar m
WHERE satislar.magaza_id = m.id AND satislar.firma_id IS NULL;

-- Mevcut satışlara satış tarihi ekle (magaza_giris_tarihi varsa onu kullan)
UPDATE satislar 
SET satis_tarihi = COALESCE(magaza_giris_tarihi::date, CURRENT_DATE)
WHERE satis_tarihi IS NULL;
