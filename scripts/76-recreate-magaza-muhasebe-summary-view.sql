-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;

-- Create a new view for store accounting summary
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    COALESCE(SUM(msdv.toplam_tutar), 0) AS toplam_satis_tutari, -- Corrected column name
    COALESCE(SUM(msdv.acente_komisyon_tutari), 0) AS toplam_acente_komisyonu, -- Corrected column name
    COALESCE(SUM(msdv.rehber_komisyon_tutari), 0) AS toplam_rehber_komisyonu, -- Corrected column name
    COALESCE(SUM(msdv.kaptan_komisyon_tutari), 0) AS toplam_kaptan_komisyonu, -- Corrected column name
    COALESCE(SUM(msdv.ofis_komisyon_tutari), 0) AS toplam_ofis_komisyonu, -- Corrected column name
    COALESCE(SUM(t.acente_payi), 0) AS toplam_acente_tahsilat,
    COALESCE(SUM(t.ofis_payi), 0) AS toplam_ofis_tahsilat,
    (COALESCE(SUM(msdv.acente_komisyon_tutari), 0) - COALESCE(SUM(t.acente_payi), 0)) AS kalan_acente_alacagi, -- Corrected column name
    (COALESCE(SUM(msdv.ofis_komisyon_tutari), 0) - COALESCE(SUM(t.ofis_payi), 0)) AS kalan_ofis_alacagi -- Corrected column name
FROM
    public.magazalar m
LEFT JOIN
    public.magaza_satis_detaylari_view msdv ON m.id = msdv.magaza_id
LEFT JOIN
    public.tahsilatlar t ON m.id = t.magaza_id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
GROUP BY
    m.id, m.magaza_adi, m.firma_id, f.firma_adi
ORDER BY
    m.magaza_adi;

GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
