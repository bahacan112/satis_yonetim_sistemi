-- scripts/51-recreate-satislar-detay-view-union.sql
-- Recreates the satislar_detay_view by unioning magaza_satis_kalemleri and rehber_satis_kalemleri.
-- This view provides a unified source for all sales details, regardless of their origin (store or guide).

DROP VIEW IF EXISTS public.satislar_detay_view;

CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.magaza_id,
    m.magaza_adi,
    s.operator_id,
    o.adi AS operator_adi,
    s.tur_id,
    t.tur_adi,
    s.rehber_id,
    p_rehber.tam_ad AS rehber_adi,
    s.firma_id,
    f.firma_adi,
    ms.urun_id,
    ur.urun_adi,
    ur.urun_aciklamasi,
    ms.adet,
    ms.birim_fiyat,
    (ms.adet * ms.birim_fiyat) AS toplam_tutar,
    ms.acente_komisyon_tutari,
    ms.rehber_komisyon_tutari,
    ms.kaptan_komisyon_tutari,
    ms.ofis_komisyon_tutari,
    ms.bekleme,
    ms.vade_tarihi,
    ms.status,
    'magaza' AS bildirim_tipi -- Indicates this sale item originated from a store
FROM
    public.satislar s
JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.operatorler o ON s.operator_id = o.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.profiles p_rehber ON s.rehber_id = p_rehber.id
LEFT JOIN
    public.firmalar f ON s.firma_id = f.id
JOIN
    public.magaza_satis_kalemleri ms ON s.id = ms.satis_id
LEFT JOIN
    public.urunler ur ON ms.urun_id = ur.id
WHERE
    ms.status = 'onaylandı' -- Only include approved sales items from stores

UNION ALL

SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.magaza_id,
    m.magaza_adi,
    s.operator_id,
    o.adi AS operator_adi,
    s.tur_id,
    t.tur_adi,
    s.rehber_id,
    p_rehber.tam_ad AS rehber_adi,
    s.firma_id,
    f.firma_adi,
    rs.urun_id,
    ur.urun_adi,
    ur.urun_aciklamasi,
    rs.adet,
    rs.birim_fiyat,
    (rs.adet * rs.birim_fiyat) AS toplam_tutar,
    NULL AS acente_komisyon_tutari, -- Rehber satış kalemlerinde komisyon tutarları NULL
    NULL AS rehber_komisyon_tutari,
    NULL AS kaptan_komisyon_tutari,
    NULL AS ofis_komisyon_tutari,
    rs.bekleme,
    rs.vade_tarihi,
    rs.status,
    'rehber' AS bildirim_tipi -- Indicates this sale item originated from a guide
FROM
    public.satislar s
JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.operatorler o ON s.operator_id = o.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.profiles p_rehber ON s.rehber_id = p_rehber.id
LEFT JOIN
    public.firmalar f ON s.firma_id = f.id
JOIN
    public.rehber_satis_kalemleri rs ON s.id = rs.satis_id
LEFT JOIN
    public.urunler ur ON rs.urun_id = ur.id
WHERE
    rs.status = 'onaylandı'; -- Only include approved sales items from guides

-- Grant permissions
GRANT SELECT ON public.satislar_detay_view TO authenticated;
