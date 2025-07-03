-- scripts/59-create-magaza-satis-detaylari-view.sql
-- Creates a view for detailed store sales, specifically for the muhasebe/[magazaId] page.
-- This view aggregates sales items by sale_id and includes relevant details from joined tables.

DROP VIEW IF EXISTS public.magaza_satis_detaylari_view;

CREATE OR REPLACE VIEW public.magaza_satis_detaylari_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.magaza_id,
    m.magaza_adi,
    o.adi AS operator_adi,
    t.tur_adi,
    p_rehber.tam_ad AS rehber_adi,
    f.firma_adi,
    msk.urun_id,
    u.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    (msk.adet * msk.birim_fiyat) AS toplam_tutar,
    msk.acente_komisyon_tutari,
    msk.rehber_komisyon_tutari,
    msk.kaptan_komisyon_tutari,
    msk.ofis_komisyon_tutari,
    msk.bekleme,
    msk.vade_tarihi,
    msk.status
FROM
    public.satislar s
JOIN
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.operatorler o ON s.operator_id = o.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.profiles p_rehber ON s.rehber_id = p_rehber.id
LEFT JOIN
    public.firmalar f ON s.firma_id = f.id
LEFT JOIN
    public.urunler u ON msk.urun_id = u.id
WHERE
    msk.status = 'onaylandı'; -- Only include approved sales items

-- Grant permissions
GRANT SELECT ON public.magaza_satis_detaylari_view TO authenticated;
