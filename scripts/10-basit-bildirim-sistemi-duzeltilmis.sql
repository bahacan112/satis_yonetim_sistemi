-- Önce bağımlı view'ı sil
DROP VIEW IF EXISTS bildirim_karsilastirma;

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

-- Yeni bir karşılaştırma view'ı oluştur (opsiyonel)
CREATE OR REPLACE VIEW bildirim_karsilastirma AS
SELECT 
    s.id,
    s.satis_tarihi,
    s.firma_id,
    f.firma_adi,
    s.magaza_id,
    m.magaza_adi,
    s.operator_id,
    o.ad AS operator_adi,
    s.rehber_id,
    r.ad AS rehber_adi,
    s.tur,
    s.grup_pax,
    s.magaza_pax,
    s.magaza_bildirimi_tutar,
    s.rehber_bildirimi_tutar,
    s.magaza_bildirimi_tarihi,
    s.rehber_bildirimi_tarihi,
    (s.rehber_bildirimi_tutar - s.magaza_bildirimi_tutar) AS tutar_farki,
    CASE 
        WHEN s.rehber_bildirimi_tutar IS NULL OR s.rehber_bildirimi_tutar = 0 THEN 'REHBER_BILDIRIMI_YOK'
        WHEN s.magaza_bildirimi_tutar IS NULL OR s.magaza_bildirimi_tutar = 0 THEN 'MAGAZA_BILDIRIMI_YOK'
        WHEN s.rehber_bildirimi_tutar = s.magaza_bildirimi_tutar THEN 'UYUMLU'
        ELSE 'UYUMSUZ'
    END AS durum
FROM 
    satislar s
LEFT JOIN 
    firmalar f ON s.firma_id = f.id
LEFT JOIN 
    magazalar m ON s.magaza_id = m.id
LEFT JOIN 
    operatorler o ON s.operator_id = o.id
LEFT JOIN 
    rehberler r ON s.rehber_id = r.id;
