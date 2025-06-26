-- scripts/94-add-pax-fields-to-magaza-view.sql

-- Drop and recreate magaza_satis_detaylari_view with pax fields
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view;

CREATE OR REPLACE VIEW public.magaza_satis_detaylari_view AS
SELECT
    sdv.satis_id,
    sdv.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    sdv.tur_id,
    sdv.tur_adi,
    sdv.rehber_id,
    sdv.rehber_adi,
    sdv.magaza_id,
    sdv.magaza_adi,
    sdv.firma_id,
    sdv.firma_adi,
    sdv.operator_id,
    sdv.operator_adi,
    sdv.urun_id,
    sdv.urun_adi,
    sdv.adet,
    sdv.birim_fiyat,
    sdv.acente_komisyonu,
    sdv.rehber_komisyonu,
    sdv.kaptan_komisyonu,
    sdv.toplam_tutar,
    sdv.acente_komisyon_tutari,
    sdv.rehber_komisyon_tutari,
    sdv.kaptan_komisyon_tutari,
    sdv.ofis_komisyon_tutari,
    sdv.bekleme_suresi AS bekleme,
    sdv.vade_tarihi,
    sdv.satis_tarihi AS created_at
FROM
    public.satislar_detay_view sdv
LEFT JOIN
    public.satislar s ON sdv.satis_id = s.id
WHERE
    sdv.bildirim_tipi = 'magaza';

GRANT SELECT ON public.magaza_satis_detaylari_view TO authenticated;
