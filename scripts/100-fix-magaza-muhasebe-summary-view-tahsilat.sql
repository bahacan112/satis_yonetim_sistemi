-- scripts/100-fix-magaza-muhasebe-summary-view-tahsilat.sql

-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;

-- Step 2: Recreate magaza_muhasebe_summary_view with corrected tahsilat calculation
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' THEN sdv.toplam_tutar ELSE 0 END), 0) AS toplam_magaza_satis,
    COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'rehber' THEN sdv.toplam_tutar ELSE 0 END), 0) AS toplam_rehber_satis,
    COALESCE(SUM(sdv.toplam_tutar), 0) AS genel_toplam_satis,
    COALESCE(SUM(sdv.acente_komisyon_tutari), 0) AS toplam_acente_komisyonu,
    COALESCE(SUM(sdv.rehber_komisyon_tutari), 0) AS toplam_rehber_komisyonu,
    COALESCE(SUM(sdv.kaptan_komisyon_tutari), 0) AS toplam_kaptan_komisyonu,
    COALESCE(SUM(sdv.ofis_komisyon_tutari), 0) AS toplam_ofis_komisyonu,
    -- Corrected tahsilat calculation: sum tahsilatlar for the firm associated with the store
    COALESCE(tf.total_tahsilat_for_firm, 0) AS toplam_tahsilat,
    COALESCE(SUM(sdv.toplam_tutar), 0) - COALESCE(tf.total_tahsilat_for_firm, 0) AS kalan_bakiye,
    COALESCE(SUM(sdv.grup_pax), 0) AS toplam_grup_pax,
    COALESCE(SUM(sdv.magaza_pax), 0) AS toplam_magaza_pax
FROM
    public.magazalar m
LEFT JOIN
    public.satislar_detay_view sdv ON m.id = sdv.magaza_id
LEFT JOIN (
    SELECT
        firma_id,
        SUM(acente_payi + ofis_payi) AS total_tahsilat_for_firm
    FROM
        public.tahsilatlar
    GROUP BY
        firma_id
) AS tf ON m.firma_id = tf.firma_id -- Join tahsilatlar by firma_id
GROUP BY
    m.id, m.magaza_adi, tf.total_tahsilat_for_firm; -- Group by the aggregated tahsilat value as well

-- Grant permissions
GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
