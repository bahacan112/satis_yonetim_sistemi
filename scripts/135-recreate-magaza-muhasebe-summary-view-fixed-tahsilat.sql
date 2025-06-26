-- scripts/135-recreate-magaza-muhasebe-summary-view-fixed-tahsilat.sql
-- Recreate magaza_muhasebe_summary_view with corrected tahsilat calculation.

DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;

CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    f.firma_adi,
    COALESCE(SUM(CASE WHEN s.status = 'onaylandi' THEN s.toplam_tutar ELSE 0 END), 0) AS toplam_satis_tutari,
    COALESCE(SUM(CASE WHEN s.status = 'onaylandi' THEN s.acente_komisyon_tutari ELSE 0 END), 0) AS toplam_acente_komisyonu,
    COALESCE(SUM(CASE WHEN s.status = 'onaylandi' THEN s.rehber_komisyon_tutari ELSE 0 END), 0) AS toplam_rehber_komisyonu,
    COALESCE(SUM(CASE WHEN s.status = 'onaylandi' THEN s.kaptan_komisyon_tutari ELSE 0 END), 0) AS toplam_kaptan_komisyonu,
    COALESCE(SUM(CASE WHEN s.status = 'onaylandi' THEN s.ofis_komisyon_tutari ELSE 0 END), 0) AS toplam_ofis_komisyonu,
    COALESCE(SUM(t.acente_payi + t.ofis_payi), 0) AS toplam_tahsilat_tutari, -- FIXED: Use acente_payi + ofis_payi
    COALESCE(SUM(CASE WHEN s.status = 'onaylandi' THEN s.toplam_tutar ELSE 0 END), 0) - COALESCE(SUM(t.acente_payi + t.ofis_payi), 0) AS kalan_bakiye -- FIXED: Use acente_payi + ofis_payi
FROM
    public.magazalar m
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.satislar_detay_view s ON m.id = s.magaza_id
LEFT JOIN
    public.tahsilatlar t ON m.id = t.magaza_id
GROUP BY
    m.id, m.magaza_adi, f.firma_adi;

GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
