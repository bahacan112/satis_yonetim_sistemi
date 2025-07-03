-- Rehberler tablosuna eksik alanları ekle
ALTER TABLE rehberler 
ADD COLUMN IF NOT EXISTS telefon VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS adres TEXT,
ADD COLUMN IF NOT EXISTS notlar TEXT,
ADD COLUMN IF NOT EXISTS aktif BOOLEAN DEFAULT true;

-- Mevcut verileri güncelle (eğer varsa)
UPDATE rehberler 
SET aktif = true 
WHERE aktif IS NULL;

-- Tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rehberler' 
ORDER BY ordinal_position;
