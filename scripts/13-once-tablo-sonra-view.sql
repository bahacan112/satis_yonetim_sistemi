-- Önce satışlar tablosuna yeni sütunları ekle
ALTER TABLE satislar 
ADD COLUMN IF NOT EXISTS magaza_bildirimi_tutar DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rehber_bildirimi_tutar DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS magaza_bildirimi_tarihi DATE,
ADD COLUMN IF NOT EXISTS rehber_bildirimi_tarihi DATE,
ADD COLUMN IF NOT EXISTS magaza_bildirimi_notu TEXT,
ADD COLUMN IF NOT EXISTS rehber_bildirimi_notu TEXT;

-- Mevcut satışlara varsayılan değerler ata
UPDATE satislar 
SET magaza_bildirimi_tutar = COALESCE(satis_tutari, 0),
    magaza_bildirimi_tarihi = satis_tarihi
WHERE magaza_bildirimi_tutar IS NULL OR magaza_bildirimi_tutar = 0;

-- Bağımlı view'ı sil (eğer varsa)
DROP VIEW IF EXISTS bildirim_karsilastirma;

-- Bildirim tipi sütununu sil (eğer varsa)
ALTER TABLE satislar DROP COLUMN IF EXISTS bildirim_tipi;

-- Yeni karşılaştırma view'ını oluştur
CREATE OR REPLACE VIEW bildirim_karsilastirma AS
SELECT 
    s.id,
    s.satis_tarihi,
    s.firma_id,
    f.firma_adi,
    s.magaza_id,
    m.magaza_adi,
    s.operator_id,
    CAST(s.operator_id AS TEXT) AS operator_adi,
    s.rehber_id,
    CAST(s.rehber_id AS TEXT) AS rehber_adi,
    s.tur,
    s.grup_pax,
    s.magaza_pax,
    s.magaza_bildirimi_tutar,
    s.rehber_bildirimi_tutar,
    s.magaza_bildirimi_tarihi,
    s.rehber_bildirimi_tarihi,
    s.magaza_bildirimi_notu,
    s.rehber_bildirimi_notu,
    (COALESCE(s.rehber_bildirimi_tutar, 0) - COALESCE(s.magaza_bildirimi_tutar, 0)) AS tutar_farki,
    CASE 
        WHEN s.rehber_bildirimi_tutar IS NULL OR s.rehber_bildirimi_tutar = 0 THEN 'REHBER_BILDIRIMI_YOK'
        WHEN s.magaza_bildirimi_tutar IS NULL OR s.magaza_bildirimi_tutar = 0 THEN 'MAGAZA_BILDIRIMI_YOK'
        WHEN ABS(s.rehber_bildirimi_tutar - s.magaza_bildirimi_tutar) < 0.01 THEN 'UYUMLU'
        ELSE 'UYUMSUZ'
    END AS durum
FROM 
    satislar s
LEFT JOIN 
    firmalar f ON s.firma_id = f.id
LEFT JOIN 
    magazalar m ON s.magaza_id = m.id
ORDER BY s.satis_tarihi DESC, s.id DESC;
