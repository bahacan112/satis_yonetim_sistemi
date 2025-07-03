-- scripts/133-fix-satislar-detay-view-add-ids.sql
-- Recreate satislar_detay_view to include magaza_id and rehber_id

-- Drop the existing view (assuming dependent views are already dropped by script 129)
DROP VIEW IF EXISTS public.satislar_detay_view;

-- Recreate satislar_detay_view with proper UNION and including magaza_id and rehber_id
CREATE OR REPLACE VIEW public.satislar_detay_view AS
-- Magaza satış kalemleri
SELECT
    s.id AS satis_id,
    s.magaza_giris_tarihi AS satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    t.tur_adi AS tur,
    s.created_at,
    o.operator_adi,
    r.rehber_adi,
    m.magaza_adi,
    f.firma_adi,
    msk.urun_id,
    u.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    msk.ofis_komisyonu,
    (msk.adet * msk.birim_fiyat) AS toplam_tutar,
    'magaza'::text AS bildirim_tipi,
    msk.status,
    (msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100) AS acente_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100) AS rehber_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100) AS kaptan_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) AS ofis_komisyon_tutari,
    s.magaza_id, -- Added magaza_id
    s.rehber_id  -- Added rehber_id
FROM
    public.satislar s
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.operatorler o ON t.operator_id = o.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.urunler u ON msk.urun_id = u.id

UNION ALL

-- Rehber satış kalemleri
SELECT
    s.id AS satis_id,
    s.magaza_giris_tarihi AS satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    t.tur_adi AS tur,
    s.created_at,
    o.operator_adi,
    r.rehber_adi,
    m.magaza_adi,
    f.firma_adi,
    rsk.urun_id,
    u.urun_adi,
    rsk.adet,
    rsk.birim_fiyat,
    0 AS acente_komisyonu,
    0 AS rehber_komisyonu,
    0 AS kaptan_komisyonu,
    0 AS ofis_komisyonu,
    (rsk.adet * rsk.birim_fiyat) AS toplam_tutar,
    'rehber'::text AS bildirim_tipi,
    rsk.status,
    0 AS acente_komisyon_tutari,
    0 AS rehber_komisyon_tutari,
    0 AS kaptan_komisyon_tutari,
    0 AS ofis_komisyon_tutari,
    s.magaza_id, -- Added magaza_id
    s.rehber_id  -- Added rehber_id
FROM
    public.satislar s
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.operatorler o ON t.operator_id = o.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN
    public.urunler u ON rsk.urun_id = u.id;

-- Grant select privileges
GRANT SELECT ON public.satislar_detay_view TO authenticated;
