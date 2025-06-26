-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;

-- Create a new view for store accounting summary
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    COALESCE(SUM(msdv.magaza_toplam_tutar), 0) AS toplam_satis_tutari,
    COALESCE(SUM(msdv.magaza_acente_komisyon_tutari), 0) AS toplam_acente_komisyonu,
    COALESCE(SUM(msdv.magaza_rehber_komisyon_tutari), 0) AS toplam_rehber_komisyonu,
    COALESCE(SUM(msdv.magaza_kaptan_komisyon_tutari), 0) AS toplam_kaptan_komisyonu,
    COALESCE(SUM(msdv.magaza_ofis_komisyon_tutari), 0) AS toplam_ofis_komisyonu,
    COALESCE(SUM(t.tahsil_edilen_tutar), 0) AS toplam_tahsilat,
    (COALESCE(SUM(msdv.magaza_toplam_tutar), 0) - COALESCE(SUM(t.tahsil_edilen_tutar), 0)) AS kalan_bakiye
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
