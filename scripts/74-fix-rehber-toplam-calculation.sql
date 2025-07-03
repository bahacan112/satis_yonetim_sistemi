-- Önce mevcut view'ı kontrol edelim
SELECT 
    satis_id,
    bildirim_tipi,
    urun_adi,
    adet,
    birim_fiyat,
    toplam_tutar
FROM satislar_detay_view 
WHERE bildirim_tipi = 'rehber'
ORDER BY satis_id DESC
LIMIT 5;

-- View'ı yeniden oluşturalım - rehber kısmındaki toplam_tutar hesaplamasını düzeltelim
DROP VIEW IF EXISTS public.satislar_detay_view;

CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.tur_id,
    t.tur_adi AS tur,
    s.rehber_id,
    r.rehber_adi,
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.operator_id,
    o.operator_adi,
    msk.id AS kalem_id,
    msk.urun_id,
    u_msk.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    msk.ofis_komisyonu,
    (msk.adet * msk.birim_fiyat) AS toplam_tutar,
    (msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100) AS acente_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100) AS rehber_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100) AS kaptan_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) AS ofis_komisyon_tutari,
    msk.bekleme,
    msk.vade_tarihi,
    s.created_at,
    'magaza' AS bildirim_tipi,
    CASE
        WHEN msk.bekleme = TRUE THEN 'Uyumsuz'
        ELSE 'Uyumlu'
    END AS uyum_durumu
FROM
    public.satislar s
LEFT JOIN
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.urunler u_msk ON msk.urun_id = u_msk.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.operatorler o ON s.operator_id = o.id
WHERE
    msk.id IS NOT NULL

UNION ALL

SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.tur_id,
    t.tur_adi AS tur,
    s.rehber_id,
    r.rehber_adi,
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.operator_id,
    o.operator_adi,
    rsk.id AS kalem_id,
    rsk.urun_id,
    u_rsk.urun_adi,
    rsk.adet,
    rsk.birim_fiyat,
    NULL AS acente_komisyonu,
    NULL AS rehber_komisyonu,
    NULL AS kaptan_komisyonu,
    NULL AS ofis_komisyonu,
    -- Burada sorun vardı - toplam_tutar hesaplaması yanlış sıradaydı
    (rsk.adet * rsk.birim_fiyat) AS toplam_tutar,
    NULL AS acente_komisyon_tutari,
    NULL AS rehber_komisyon_tutari,
    NULL AS kaptan_komisyon_tutari,
    NULL AS ofis_komisyon_tutari,
    rsk.bekleme,
    rsk.vade_tarihi,
    s.created_at,
    'rehber' AS bildirim_tipi,
    CASE
        WHEN rsk.bekleme = TRUE THEN 'Uyumsuz'
        ELSE 'Uyumlu'
    END AS uyum_durumu
FROM
    public.satislar s
LEFT JOIN
    public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.urunler u_rsk ON rsk.urun_id = u_rsk.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.operatorler o ON s.operator_id = o.id
WHERE
    rsk.id IS NOT NULL;

-- Grant select privileges to authenticated users
GRANT SELECT ON public.satislar_detay_view TO authenticated;

-- Test edelim - rehber bildirimlerinin toplam tutarını kontrol edelim
SELECT 
    satis_id,
    bildirim_tipi,
    urun_adi,
    adet,
    birim_fiyat,
    toplam_tutar,
    (adet * birim_fiyat) as hesaplanan_toplam
FROM satislar_detay_view 
WHERE bildirim_tipi = 'rehber'
ORDER BY satis_id DESC
LIMIT 10;
