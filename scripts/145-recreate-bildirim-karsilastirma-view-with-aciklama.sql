-- bildirim_karsilastirma view'ini yeniden oluştur
CREATE OR REPLACE VIEW public.bildirim_karsilastirma AS
SELECT
    s.id,
    s.satis_tarihi,
    f.id AS firma_id,
    f.firma_adi,
    m.id AS magaza_id,
    m.magaza_adi,
    op.id AS operator_id,
    op.operator_adi,
    r.id AS rehber_id,
    r.rehber_adi,
    t.tur_adi AS tur,
    s.grup_pax,
    s.magaza_pax,
    COALESCE(magaza_agg.magaza_bildirimi_tutar, 0) AS magaza_bildirimi_tutar,
    COALESCE(rehber_agg.rehber_bildirimi_tutar, 0) AS rehber_bildirimi_tutar,
    magaza_agg.magaza_bildirimi_tarihi,
    rehber_agg.rehber_bildirimi_tarihi,
    magaza_agg.satis_aciklamasi AS magaza_bildirimi_notu, -- satis_aciklamasi olarak güncellendi
    rehber_agg.satis_aciklamasi AS rehber_bildirimi_notu, -- satis_aciklamasi olarak güncellendi
    (COALESCE(magaza_agg.magaza_bildirimi_tutar, 0) - COALESCE(rehber_agg.rehber_bildirimi_tutar, 0)) AS tutar_farki,
    CASE
        WHEN COALESCE(magaza_agg.magaza_bildirimi_tutar, 0) = COALESCE(rehber_agg.rehber_bildirimi_tutar, 0) AND COALESCE(magaza_agg.magaza_bildirimi_tutar, 0) > 0 THEN 'UYUMLU'
        WHEN COALESCE(magaza_agg.magaza_bildirimi_tutar, 0) > 0 AND COALESCE(rehber_agg.rehber_bildirimi_tutar, 0) = 0 THEN 'REHBER_BILDIRIMI_YOK'
        WHEN COALESCE(magaza_agg.magaza_bildirimi_tutar, 0) = 0 AND COALESCE(rehber_agg.rehber_bildirimi_tutar, 0) > 0 THEN 'MAGAZA_BILDIRIMI_YOK'
        ELSE 'UYUMSUZ'
    END AS durum
FROM
    satislar s
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN firmalar f ON m.firma_id = f.id
LEFT JOIN operatorler op ON s.operator_id = op.id
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN turlar t ON s.tur_id = t.id
LEFT JOIN (
    SELECT
        satis_id,
        SUM(adet * birim_fiyat) AS magaza_bildirimi_tutar,
        MIN(created_at) AS magaza_bildirimi_tarihi,
        STRING_AGG(satis_aciklamasi, E'\n') AS satis_aciklamasi -- Açıklamaları birleştir
    FROM
        magaza_satis_kalemleri
    GROUP BY
        satis_id
) AS magaza_agg ON s.id = magaza_agg.satis_id
LEFT JOIN (
    SELECT
        satis_id,
        SUM(adet * birim_fiyat) AS rehber_bildirimi_tutar,
        MIN(created_at) AS rehber_bildirimi_tarihi,
        STRING_AGG(satis_aciklamasi, E'\n') AS satis_aciklamasi -- Açıklamaları birleştir
    FROM
        rehber_satis_kalemleri
    GROUP BY
        satis_id
) AS rehber_agg ON s.id = rehber_agg.satis_id;
