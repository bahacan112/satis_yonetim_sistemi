-- scripts/116-update-muhasebe-summary-view.sql
-- Update magaza_muhasebe_summary_view to include separate totals for magaza and rehber sales,
-- and ensure commissions are correctly aggregated from magaza sales.

-- Step 1: Drop the existing view if it exists to recreate it with the new logic
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;

-- Step 2: Recreate magaza_muhasebe_summary_view using CTEs for clarity and correct aggregation
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
WITH sales_summary AS (
    -- Aggregate sales data per magaza_id from satislar_detay_view
    SELECT
        sdv.magaza_id,
        -- Total sales for 'magaza' type items with 'onaylandı' status
        COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' AND sdv.status = 'onaylandı' THEN sdv.toplam_tutar ELSE 0 END), 0) AS toplam_magaza_satis,
        -- Total sales for 'rehber' type items with 'onaylandı' status
        COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'rehber' AND sdv.status = 'onaylandı' THEN sdv.toplam_tutar ELSE 0 END), 0) AS toplam_rehber_satis,
        -- General total sales (sum of all 'onaylandı' sales, regardless of type)
        COALESCE(SUM(CASE WHEN sdv.status = 'onaylandı' THEN sdv.toplam_tutar ELSE 0 END), 0) AS genel_toplam_satis,
        -- Commission totals (only from 'magaza' type items with 'onaylandı' status, as rehber items have NULL commissions)
        COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' AND sdv.status = 'onaylandı' THEN sdv.acente_komisyon_tutari ELSE 0 END), 0) AS toplam_acente_komisyonu,
        COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' AND sdv.status = 'onaylandı' THEN sdv.rehber_komisyon_tutari ELSE 0 END), 0) AS toplam_rehber_komisyonu_magaza,
        COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' AND sdv.status = 'onaylandı' THEN sdv.kaptan_komisyon_tutari ELSE 0 END), 0) AS toplam_kaptan_komisyonu,
        COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' AND sdv.status = 'onaylandı' THEN sdv.ofis_komisyon_tutari ELSE 0 END), 0) AS toplam_ofis_komisyonu
    FROM
        public.satislar_detay_view sdv
    WHERE sdv.magaza_id IS NOT NULL -- Ensure we only count sales linked to a store
    GROUP BY
        sdv.magaza_id
),
tahsilat_summary AS (
    -- Aggregate tahsilat data per magaza_id
    SELECT
        t.magaza_id,
        COALESCE(SUM(t.acente_payi), 0) AS toplam_acente_tahsilat,
        COALESCE(SUM(t.ofis_payi), 0) AS toplam_ofis_tahsilat
    FROM
        public.tahsilatlar t
    WHERE t.magaza_id IS NOT NULL
    GROUP BY
        t.magaza_id
)
-- Final selection joining magazalar with the aggregated sales and tahsilat summaries
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    COALESCE(ss.toplam_magaza_satis, 0) AS toplam_magaza_satis,
    COALESCE(ss.toplam_rehber_satis, 0) AS toplam_rehber_satis,
    COALESCE(ss.genel_toplam_satis, 0) AS genel_toplam_satis,
    COALESCE(ss.toplam_acente_komisyonu, 0) AS toplam_acente_komisyonu,
    COALESCE(ss.toplam_rehber_komisyonu_magaza, 0) AS toplam_rehber_komisyonu_magaza,
    COALESCE(ss.toplam_kaptan_komisyonu, 0) AS toplam_kaptan_komisyonu,
    COALESCE(ss.toplam_ofis_komisyonu, 0) AS toplam_ofis_komisyonu,
    COALESCE(ts.toplam_acente_tahsilat, 0) AS toplam_acente_tahsilat,
    COALESCE(ts.toplam_ofis_tahsilat, 0) AS toplam_ofis_tahsilat,
    (COALESCE(ss.toplam_acente_komisyonu, 0) - COALESCE(ts.toplam_acente_tahsilat, 0)) AS kalan_acente_alacagi,
    (COALESCE(ss.toplam_ofis_komisyonu, 0) - COALESCE(ts.toplam_ofis_tahsilat, 0)) AS kalan_ofis_alacagi
FROM
    public.magazalar m
LEFT JOIN
    sales_summary ss ON m.id = ss.magaza_id
LEFT JOIN
    tahsilat_summary ts ON m.id = ts.magaza_id;

-- Grant permissions
GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
