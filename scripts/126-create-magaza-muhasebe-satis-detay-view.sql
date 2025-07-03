-- scripts/126-create-magaza-muhasebe-satis-detay-view.sql
-- Create a specialized view for magaza muhasebe detail page
-- This view provides detailed sales information specifically for the muhasebe/[magazaId] page

-- Drop the view if it exists
DROP VIEW IF EXISTS public.magaza_muhasebe_satis_detay_view;

-- Create the magaza_muhasebe_satis_detay_view
-- This view combines sales data from magaza_satis_kalemleri with all necessary joins
CREATE OR REPLACE VIEW public.magaza_muhasebe_satis_detay_view AS
SELECT
  s.id AS satis_id,
  s.magaza_giris_tarihi AS satis_tarihi,
  s.grup_gelis_tarihi,
  s.grup_pax,
  s.magaza_pax,
  s.magaza_id,
  m.magaza_adi,
  o.operator_adi,
  t.tur_adi,
  r.rehber_adi,
  f.firma_adi,
  msk.urun_id,
  u.urun_adi,
  msk.adet,
  msk.birim_fiyat,
  (msk.adet * msk.birim_fiyat) AS toplam_tutar,
  msk.acente_komisyonu AS acente_komisyon_oran,
  msk.rehber_komisyonu AS rehber_komisyon_oran,
  msk.kaptan_komisyonu AS kaptan_komisyon_oran,
  msk.ofis_komisyonu AS ofis_komisyon_oran,
  (msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100) AS acente_komisyon_tutari,
  (msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100) AS rehber_komisyon_tutari,
  (msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100) AS kaptan_komisyon_tutari,
  (msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) AS ofis_komisyon_tutari,
  msk.bekleme,
  msk.vade_tarihi,
  msk.status,
  s.created_at
FROM
  public.satislar s
JOIN
  public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
  public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
  public.operatorler o ON s.operator_id = o.id
LEFT JOIN
  public.turlar t ON s.tur_id = t.id
LEFT JOIN
  public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
  public.firmalar f ON s.firma_id = f.id
LEFT JOIN
  public.urunler u ON msk.urun_id = u.id;

-- Grant select privileges to authenticated users
GRANT SELECT ON public.magaza_muhasebe_satis_detay_view TO authenticated;
