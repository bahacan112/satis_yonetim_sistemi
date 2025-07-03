-- scripts/107-recreate-views-with-cte.sql
-- Recreate all views, using CTEs for magaza_muhasebe_summary_view to fix GROUP BY issue.

-- Step 1: Drop all dependent views
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view CASCADE;
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view CASCADE;
DROP VIEW IF EXISTS public.satislar_detay_view CASCADE;

-- Step 2: Recreate satislar_detay_view (No changes here, but needed for dependency)
CREATE VIEW public.satislar_detay_view AS
-- Mağaza satış kalemleri
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.tur_id,
    t.tur_adi AS tur,
    s.operator_id,
    o.operator_adi,
    s.rehber_id,
    r.rehber_adi,
    s.magaza_id,
    m.magaza_adi,
    s.firma_id,
    f.firma_adi,
    msk.urun_id,
    u.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    msk.ofis_komisyonu,
    COALESCE(msk.adet * msk.birim_fiyat, 0) AS toplam_tutar,
    COALESCE(msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100, 0) AS acente_komisyon_tutari,
    COALESCE(msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100, 0) AS rehber_komisyon_tutari,
    COALESCE(msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100, 0) AS kaptan_komisyon_tutari,
    COALESCE(msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100, 0) AS ofis_komisyon_tutari,
    'magaza'::text AS bildirim_tipi,
    msk.bekleme,
    msk.vade_tarihi,
    s.created_at
FROM
    public.satislar s
INNER JOIN public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN public.turlar t ON s.tur_id = t.id
LEFT JOIN public.operatorler o ON s.operator_id = o.id
LEFT JOIN public.rehberler r ON s.rehber_id = r.id
LEFT JOIN public.magazalar m ON s.magaza_id = m.id
LEFT JOIN public.firmalar f ON s.firma_id = f.id
LEFT JOIN public.urunler u ON msk.urun_id = u.id

UNION ALL

-- Rehber satış kalemleri
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.tur_id,
    t.tur_adi AS tur,
    s.operator_id,
    o.operator_adi,
    s.rehber_id,
    r.rehber_adi,
    s.magaza_id,
    m.magaza_adi,
    s.firma_id,
    f.firma_adi,
    rsk.urun_id,
    u.urun_adi,
    rsk.adet,
    rsk.birim_fiyat,
    NULL AS acente_komisyonu,
    NULL AS rehber_komisyonu,
    NULL AS kaptan_komisyonu,
    NULL AS ofis_komisyonu,
    COALESCE(rsk.adet * rsk.birim_fiyat, 0) AS toplam_tutar,
    NULL AS acente_komisyon_tutari,
    NULL AS rehber_komisyon_tutari,
    NULL AS kaptan_komisyon_tutari,
    NULL AS ofis_komisyon_tutari,
    'rehber'::text AS bildirim_tipi,
    rsk.bekleme,
    rsk.vade_tarihi,
    s.created_at
FROM
    public.satislar s
INNER JOIN public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN public.turlar t ON s.tur_id = t.id
LEFT JOIN public.operatorler o ON s.operator_id = o.id
LEFT JOIN public.rehberler r ON s.rehber_id = r.id
LEFT JOIN public.magazalar m ON s.magaza_id = m.id
LEFT JOIN public.firmalar f ON s.firma_id = f.id
LEFT JOIN public.urunler u ON rsk.urun_id = u.id;

-- Step 3: Recreate magaza_satis_detaylari_view (No changes here, but needed for dependency)
CREATE VIEW public.magaza_satis_detaylari_view AS
SELECT
    satis_id,
    satis_tarihi,
    grup_gelis_tarihi,
    magaza_giris_tarihi,
    grup_pax,
    magaza_pax,
    tur_id,
    tur AS tur_adi,
    rehber_id,
    rehber_adi,
    magaza_id,
    magaza_adi,
    firma_id,
    firma_adi,
    operator_id,
    operator_adi,
    urun_id,
    urun_adi,
    adet,
    birim_fiyat,
    acente_komisyonu,
    rehber_komisyonu,
    kaptan_komisyonu,
    ofis_komisyonu,
    toplam_tutar,
    acente_komisyon_tutari,
    rehber_komisyon_tutari,
    kaptan_komisyon_tutari,
    ofis_komisyon_tutari,
    bekleme,
    vade_tarihi,
    created_at
FROM
    public.satislar_detay_view
WHERE
    bildirim_tipi = 'magaza';

-- Step 4: Recreate magaza_muhasebe_summary_view using CTEs for robustness
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
WITH magaza_sales_summary AS (
    -- First, aggregate all sales data per magaza_id
    SELECT
        magaza_id,
        SUM(CASE WHEN bildirim_tipi = 'magaza' THEN toplam_tutar ELSE 0 END) AS toplam_magaza_satis,
        SUM(CASE WHEN bildirim_tipi = 'rehber' THEN toplam_tutar ELSE 0 END) AS toplam_rehber_satis,
        SUM(toplam_tutar) AS genel_toplam_satis,
        SUM(acente_komisyon_tutari) AS toplam_acente_komisyonu,
        SUM(rehber_komisyon_tutari) AS toplam_rehber_komisyonu,
        SUM(kaptan_komisyon_tutari) AS toplam_kaptan_komisyonu,
        SUM(ofis_komisyon_tutari) AS toplam_ofis_komisyonu,
        -- Use SUM on distinct sales to avoid double counting pax
        SUM(DISTINCT grup_pax) AS toplam_grup_pax,
        SUM(DISTINCT magaza_pax) AS toplam_magaza_pax
    FROM public.satislar_detay_view
    WHERE magaza_id IS NOT NULL
    GROUP BY magaza_id
),
tahsilat_summary AS (
    -- Second, aggregate all tahsilat data per firma_id
    SELECT
        firma_id,
        SUM(acente_payi + ofis_payi) AS total_tahsilat_for_firm
    FROM public.tahsilatlar
    WHERE firma_id IS NOT NULL
    GROUP BY firma_id
)
-- Finally, join the pre-aggregated summaries with the magazalar table
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    COALESCE(ss.toplam_magaza_satis, 0) AS toplam_magaza_satis,
    COALESCE(ss.toplam_rehber_satis, 0) AS toplam_rehber_satis,
    COALESCE(ss.genel_toplam_satis, 0) AS genel_toplam_satis,
    COALESCE(ss.toplam_acente_komisyonu, 0) AS toplam_acente_komisyonu,
    COALESCE(ss.toplam_rehber_komisyonu, 0) AS toplam_rehber_komisyonu,
    COALESCE(ss.toplam_kaptan_komisyonu, 0) AS toplam_kaptan_komisyonu,
    COALESCE(ss.toplam_ofis_komisyonu, 0) AS toplam_ofis_komisyonu,
    COALESCE(ts.total_tahsilat_for_firm, 0) AS toplam_tahsilat,
    COALESCE(ss.genel_toplam_satis, 0) - COALESCE(ts.total_tahsilat_for_firm, 0) AS kalan_bakiye,
    COALESCE(ss.toplam_grup_pax, 0) AS toplam_grup_pax,
    COALESCE(ss.toplam_magaza_pax, 0) AS toplam_magaza_pax
FROM
    public.magazalar m
LEFT JOIN
    magaza_sales_summary ss ON m.id = ss.magaza_id
LEFT JOIN
    tahsilat_summary ts ON m.firma_id = ts.firma_id;

-- Step 5: Grant permissions
GRANT SELECT ON public.satislar_detay_view TO authenticated;
GRANT SELECT ON public.magaza_satis_detaylari_view TO authenticated;
GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
