-- Önce bağımlı view'ı sil
DROP VIEW IF EXISTS bildirim_karsilastirma;

-- Yeni bir karşılaştırma view'ı oluştur (doğru sütun adlarıyla)
CREATE OR REPLACE VIEW bildirim_karsilastirma AS
SELECT 
    s.id,
    s.satis_tarihi,
    s.firma_id,
    f.firma_adi,
    s.magaza_id,
    m.magaza_adi,
    s.operator_id,
    COALESCE(o.isim, o.operator_adi, o.name, CAST(o.id AS TEXT)) AS operator_adi,
    s.rehber_id,
    COALESCE(r.isim, r.rehber_adi, r.name, r.ad, CAST(r.id AS TEXT)) AS rehber_adi,
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
