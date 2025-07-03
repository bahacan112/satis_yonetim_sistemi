-- Drop the existing view if it exists to recreate it with the fix
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;

-- Create a new view for store accounting summary with pre-aggregated sales and collections
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
WITH aggregated_sales AS (
    SELECT
        magaza_id,
        COALESCE(SUM(toplam_tutar), 0) AS toplam_satis_tutari,
        COALESCE(SUM(acente_komisyon_tutari), 0) AS toplam_acente_komisyonu,
        COALESCE(SUM(rehber_komisyon_tutari), 0) AS toplam_rehber_komisyonu,
        COALESCE(SUM(kaptan_komisyon_tutari), 0) AS toplam_kaptan_komisyonu,
        COALESCE(SUM(ofis_komisyon_tutari), 0) AS toplam_ofis_komisyonu
    FROM
        public.magaza_satis_detaylari_view
    GROUP BY
        magaza_id
),
aggregated_tahsilat AS (
    SELECT
        magaza_id,
        COALESCE(SUM(acente_payi), 0) AS toplam_acente_tahsilat,
        COALESCE(SUM(ofis_payi), 0) AS toplam_ofis_tahsilat
    FROM
        public.tahsilatlar
    GROUP BY
        magaza_id
)
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    COALESCE(s.toplam_satis_tutari, 0) AS toplam_satis_tutari,
    COALESCE(s.toplam_acente_komisyonu, 0) AS toplam_acente_komisyonu,
    COALESCE(s.toplam_rehber_komisyonu, 0) AS toplam_rehber_komisyonu,
    COALESCE(s.toplam_kaptan_komisyonu, 0) AS toplam_kaptan_komisyonu,
    COALESCE(s.toplam_ofis_komisyonu, 0) AS toplam_ofis_komisyonu,
    COALESCE(t.toplam_acente_tahsilat, 0) AS toplam_acente_tahsilat,
    COALESCE(t.toplam_ofis_tahsilat, 0) AS toplam_ofis_tahsilat,
    (COALESCE(s.toplam_acente_komisyonu, 0) - COALESCE(t.toplam_acente_tahsilat, 0)) AS kalan_acente_alacagi,
    (COALESCE(s.toplam_ofis_komisyonu, 0) - COALESCE(t.toplam_ofis_tahsilat, 0)) AS kalan_ofis_alacagi
FROM
    public.magazalar m
LEFT JOIN
    aggregated_sales s ON m.id = s.magaza_id
LEFT JOIN
    aggregated_tahsilat t ON m.id = t.magaza_id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
ORDER BY
    m.magaza_adi;

GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
