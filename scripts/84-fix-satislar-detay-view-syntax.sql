-- Drop the existing view if it exists to recreate it with the corrected join condition
DROP VIEW IF EXISTS public.satislar_detay_view;

-- Recreate the view with operator information and ensure all necessary columns are present for pax calculation
CREATE OR REPLACE VIEW public.satislar_detay_view AS -- CORRECTED LINE: Changed 'OR OR' to 'OR'
SELECT
    s.id AS satis_id,
    s.created_at AS satis_tarihi,
    s.magaza_id,
    m.adi AS magaza_adi,
    s.rehber_id,
    r.adi AS rehber_adi,
    r.soyadi AS rehber_soyadi,
    f.id AS firma_id,
    f.adi AS firma_adi,
    t.id AS tur_id,
    t.adi AS tur_adi,
    sk.id AS satis_kalemi_id,
    sk.urun_id,
    u.adi AS urun_adi,
    sk.adet, -- This will be used for pax
    sk.birim_fiyat,
    sk.toplam_tutar,
    sk.bekleme_suresi,
    sk.vade_tarihi,
    sk.ofis_komisyonu_orani,
    sk.magaza_komisyonu_orani,
    sk.rehber_komisyonu_orani,
    o.id AS operator_id, -- Add operator ID
    o.adi AS operator_adi -- Add operator name
FROM
    public.satislar s
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id -- Assuming magazalar has firma_id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.magaza_satis_kalemleri sk ON s.id = sk.satis_id
LEFT JOIN
    public.magaza_urunler mu ON sk.urun_id = mu.id AND s.magaza_id = mu.magaza_id
LEFT JOIN
    public.urunler u ON mu.urun_id = u.id
LEFT JOIN
    public.operatorler o ON t.operator_id = o.id; -- Assuming turlar has operator_id
