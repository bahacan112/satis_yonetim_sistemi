-- Satışlar tablosuna bildirim tipi alanı ekle
ALTER TABLE satislar 
ADD COLUMN IF NOT EXISTS bildirim_tipi VARCHAR(20) DEFAULT 'magaza' CHECK (bildirim_tipi IN ('magaza', 'rehber'));

-- Mevcut satışları mağaza bildirimi olarak işaretle
UPDATE satislar 
SET bildirim_tipi = 'magaza' 
WHERE bildirim_tipi IS NULL;

-- Bildirim karşılaştırması için view oluştur
CREATE OR REPLACE VIEW bildirim_karsilastirma AS
SELECT 
    s1.satis_tarihi,
    s1.firma_id,
    f.firma_adi,
    s1.magaza_id,
    m.magaza_adi,
    s1.operator_id,
    o.operator_adi,
    s1.rehber_id,
    r.rehber_adi,
    s1.tur,
    s1.grup_pax,
    s1.magaza_pax,
    
    -- Mağaza bildirimleri
    COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'magaza' THEN s1.adet ELSE 0 END), 0) as magaza_toplam_adet,
    COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'magaza' THEN s1.satis_tutari ELSE 0 END), 0) as magaza_toplam_tutar,
    
    -- Rehber bildirimleri
    COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'rehber' THEN s1.adet ELSE 0 END), 0) as rehber_toplam_adet,
    COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'rehber' THEN s1.satis_tutari ELSE 0 END), 0) as rehber_toplam_tutar,
    
    -- Farklar
    COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'magaza' THEN s1.adet ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'rehber' THEN s1.adet ELSE 0 END), 0) as adet_farki,
    
    COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'magaza' THEN s1.satis_tutari ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'rehber' THEN s1.satis_tutari ELSE 0 END), 0) as tutar_farki,
    
    -- Durum kontrolü
    CASE 
        WHEN COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'magaza' THEN s1.adet ELSE 0 END), 0) = 
             COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'rehber' THEN s1.adet ELSE 0 END), 0) AND
             COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'magaza' THEN s1.satis_tutari ELSE 0 END), 0) = 
             COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'rehber' THEN s1.satis_tutari ELSE 0 END), 0)
        THEN 'UYUMLU'
        WHEN COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'rehber' THEN s1.adet ELSE 0 END), 0) = 0
        THEN 'REHBER_BILDIRIMI_YOK'
        WHEN COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'magaza' THEN s1.adet ELSE 0 END), 0) = 0
        THEN 'MAGAZA_BILDIRIMI_YOK'
        ELSE 'UYUMSUZ'
    END as durum
    
FROM satislar s1
LEFT JOIN firmalar f ON s1.firma_id = f.id
LEFT JOIN magazalar m ON s1.magaza_id = m.id
LEFT JOIN operatorler o ON s1.operator_id = o.id
LEFT JOIN rehberler r ON s1.rehber_id = r.id
GROUP BY 
    s1.satis_tarihi, s1.firma_id, f.firma_adi, s1.magaza_id, m.magaza_adi, 
    s1.operator_id, o.operator_adi, s1.rehber_id, r.rehber_adi, s1.tur, s1.grup_pax, s1.magaza_pax
HAVING 
    -- En az bir bildirim var
    (COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'magaza' THEN s1.adet ELSE 0 END), 0) > 0 OR
     COALESCE(SUM(CASE WHEN s1.bildirim_tipi = 'rehber' THEN s1.adet ELSE 0 END), 0) > 0)
ORDER BY s1.satis_tarihi DESC, f.firma_adi, m.magaza_adi;
