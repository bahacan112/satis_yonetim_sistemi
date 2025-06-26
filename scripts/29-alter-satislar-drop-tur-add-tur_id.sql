-- satislar tablosundan eski tur sütununu kaldır
ALTER TABLE satislar DROP COLUMN IF EXISTS tur;

-- satislar tablosuna tur_id sütununu ekle
ALTER TABLE satislar ADD COLUMN tur_id INTEGER REFERENCES turlar(id);

-- Mevcut satislar kayıtları için tur_id'yi NULL olarak ayarla (eğer varsa)
-- Eğer yeni bir kurulumsa bu adım gerekli olmayabilir, ancak güvenli bir geçiş için eklenmiştir.
UPDATE satislar SET tur_id = NULL WHERE tur_id IS NULL;

-- tur_id sütununu NOT NULL yap (isteğe bağlı, veri tutarlılığı için önerilir)
-- ALTER TABLE satislar ALTER COLUMN tur_id SET NOT NULL;
