-- satislar_detay_view'i firma_id sütununu içerecek şekilde güncelle
DROP VIEW IF EXISTS public.satislar_detay_view;

CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.created_at,
    op.operator_adi,
    r.rehber_adi,
    m.magaza_adi,
    f.firma_adi,
    s.firma_id, -- Yeni eklendi: satislar tablosundaki firma_id
    t.tur_adi AS tur,
    COALESCE(msk.urun_id, rsk.urun_id) AS urun_id,
    COALESCE(mu.urun_adi, ru.urun_adi) AS urun_adi,
    COALESCE(msk.adet, rsk.adet) AS adet,
    COALESCE(msk.birim_fiyat, rsk.birim_fiyat) AS birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    msk.ofis_komisyonu,
    COALESCE(msk.bekleme, rsk.bekleme) AS bekleme,
    COALESCE(msk.vade_tarihi, rsk.vade_tarihi) AS vade_tarihi,
    CASE
        WHEN msk.id IS NOT NULL THEN (msk.adet * msk.birim_fiyat)
        WHEN rsk.id IS NOT NULL THEN (rsk.adet * rsk.birim_fiyat)
        ELSE 0
    END AS toplam_tutar,
    CASE
        WHEN msk.id IS NOT NULL THEN 'magaza'
        WHEN rsk.id IS NOT NULL THEN 'rehber'
        ELSE NULL
    END AS bildirim_tipi,
    CASE
        WHEN msk.id IS NOT NULL THEN (msk.adet * msk.birim_fiyat * (msk.acente_komisyonu / 100))
        ELSE 0
    END AS acente_komisyon_tutari,
    CASE
        WHEN msk.id IS NOT NULL THEN (msk.adet * msk.birim_fiyat * (msk.rehber_komisyonu / 100))
        ELSE 0
    END AS rehber_komisyon_tutari,
    CASE
        WHEN msk.id IS NOT NULL THEN (msk.adet * msk.birim_fiyat * (msk.kaptan_komisyonu / 100))
        ELSE 0
    END AS kaptan_komisyon_tutari,
    CASE
        WHEN msk.id IS NOT NULL THEN (msk.adet * msk.birim_fiyat * (msk.ofis_komisyonu / 100))
        ELSE 0
    END AS ofis_komisyon_tutari
FROM
    public.satislar s
LEFT JOIN
    public.operatorler op ON s.operator_id = op.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON s.firma_id = f.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.urunler mu ON msk.urun_id = mu.id
LEFT JOIN
    public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN
    public.urunler ru ON rsk.urun_id = ru.id;

COMMENT ON VIEW public.satislar_detay_view IS 'Satışlar, ilgili operatör, rehber, mağaza, firma, tur ve ürün bilgilerini birleştirerek detaylı satış görünümü sağlar. Mağaza ve rehber satış kalemlerini ayrı ayrı gösterir ve komisyon tutarlarını hesaplar.';

GRANT SELECT ON satislar_detay_view TO authenticated;
