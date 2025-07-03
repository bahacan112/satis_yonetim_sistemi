-- Satışlar tablosuna mağaza ve rehber bildirim alanları ekle
ALTER TABLE satislar 
ADD COLUMN IF NOT EXISTS magaza_bildirimi_tutar DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rehber_bildirimi_tutar DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS magaza_bildirimi_tarihi DATE,
ADD COLUMN IF NOT EXISTS rehber_bildirimi_tarihi DATE,
ADD COLUMN IF NOT EXISTS magaza_bildirimi_notu TEXT,
ADD COLUMN IF NOT EXISTS rehber_bildirimi_notu TEXT;

-- Bildirim tipi alanını kaldır (artık gerekli değil)
ALTER TABLE satislar DROP COLUMN IF EXISTS bildirim_tipi;

-- Mevcut satışlara varsayılan değerler ata
UPDATE satislar 
SET magaza_bildirimi_tutar = COALESCE(satis_tutari, 0),
    magaza_bildirimi_tarihi = satis_tarihi
WHERE magaza_bildirimi_tutar IS NULL OR magaza_bildirimi_tutar = 0;
