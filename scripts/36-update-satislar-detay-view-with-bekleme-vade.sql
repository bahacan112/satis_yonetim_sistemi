-- Drop the existing view if it exists to recreate it with new columns
DROP VIEW IF EXISTS public.satislar_detay_view;

-- Recreate the view
CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    t.tur_adi AS tur,
    s.created_at,
    op.operator_adi,
    r.rehber_adi,
    m.magaza_adi,
    f.firma_adi,
    msk.urun_id,
    u_magaza.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    (msk.adet * msk.birim_fiyat) AS toplam_tutar,
    'magaza'::text AS bildirim_tipi,
    msk.bekleme AS bekleme,
    msk.vade_tarihi AS vade_tarihi
FROM public.satislar s
LEFT JOIN public.operatorler op ON s.operator_id = op.id
LEFT JOIN public.rehberler r ON s.rehber_id = r.id
LEFT JOIN public.magazalar m ON s.magaza_id = m.id
LEFT JOIN public.firmalar f ON s.firma_id = f.id
LEFT JOIN public.turlar t ON s.tur_id = t.id
JOIN public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN public.urunler u_magaza ON msk.urun_id = u_magaza.id

UNION ALL

SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    t.tur_adi AS tur,
    s.created_at,
    op.operator_adi,
    r.rehber_adi,
    m.magaza_adi,
    f.firma_adi,
    rsk.urun_id,
    u_rehber.urun_adi,
    rsk.adet,
    rsk.birim_fiyat,
    NULL AS acente_komisyonu,
    NULL AS rehber_komisyonu,
    NULL AS kaptan_komisyonu,
    (rsk.adet * rsk.birim_fiyat) AS toplam_tutar,
    'rehber'::text AS bildirim_tipi,
    rsk.bekleme AS bekleme,
    rsk.vade_tarihi AS vade_tarihi
FROM public.satislar s
LEFT JOIN public.operatorler op ON s.operator_id = op.id
LEFT JOIN public.rehberler r ON s.rehber_id = r.id
LEFT JOIN public.magazalar m ON s.magaza_id = m.id
LEFT JOIN public.firmalar f ON s.firma_id = f.id
LEFT JOIN public.turlar t ON s.tur_id = t.id
JOIN public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN public.urunler u_rehber ON rsk.urun_id = u_rehber.id;
