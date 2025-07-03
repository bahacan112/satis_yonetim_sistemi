-- scripts/118-recreate-all-muhasebe-views.sql
-- This script drops and recreates all dependent views related to muhasebe and sales details
-- in the correct order to resolve dependency issues.

-- Step 1: Drop dependent views first to allow satislar_detay_view to be dropped
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view;

-- Step 2: Drop satislar_detay_view (it should now be droppable as its dependents are gone)
DROP VIEW IF EXISTS public.satislar_detay_view;

-- Step 3: Recreate satislar_detay_view
-- This view combines both magaza_satis_kalemleri and rehber_satis_kalemleri
CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
  s.id AS satis_id,
  s.magaza_giris_tarihi AS satis_tarihi,
  s.grup_gelis_tarihi,
  s.magaza_giris_tarihi,
  s.grup_pax,
  s.magaza_pax,
  s.magaza_id,
  m.magaza_adi,
  s.operator_id,
  o.operator_adi,
  s.tur_id,
  t.tur_adi,
  s.rehber_id,
  r.rehber_adi,
  s.firma_id,
  f.firma_adi,
  ms.urun_id,
  ur.urun_adi,
  ur.urun_aciklamasi,
  ms.adet,
  ms.birim_fiyat,
  (ms.adet * ms.birim_fiyat) AS toplam_tutar,
  ms.acente_komisyonu AS acente_komisyon_oran, -- Storing percentage as oran
  ms.rehber_komisyonu AS rehber_komisyon_oran,
  ms.kaptan_komisyonu AS kaptan_komisyon_oran,
  ms.ofis_komisyonu AS ofis_komisyon_oran,
  (ms.adet * ms.birim_fiyat * ms.acente_komisyonu / 100) AS acente_komisyon_tutari, -- Calculated amount
  (ms.adet * ms.birim_fiyat * ms.rehber_komisyonu / 100) AS rehber_komisyon_tutari,
  (ms.adet * ms.birim_fiyat * ms.kaptan_komisyonu / 100) AS kaptan_komisyon_tutari,
  (ms.adet * ms.birim_fiyat * ms.ofis_komisyonu / 100) AS ofis_komisyon_tutari,
  ms.bekleme,
  ms.vade_tarihi,
  ms.status,
  'magaza' AS bildirim_tipi,
  s.created_at
FROM
  public.satislar s
JOIN
  public.magaza_satis_kalemleri ms ON s.id = ms.satis_id
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
  public.urunler ur ON ms.urun_id = ur.id
WHERE
  ms.status = 'onaylandı'

UNION ALL

SELECT
  s.id AS satis_id,
  s.magaza_giris_tarihi AS satis_tarihi,
  s.grup_gelis_tarihi,
  s.magaza_giris_tarihi,
  s.grup_pax,
  s.magaza_pax,
  s.magaza_id,
  m.magaza_adi,
  s.operator_id,
  o.operator_adi,
  s.tur_id,
  t.tur_adi,
  s.rehber_id,
  r.rehber_adi,
  s.firma_id,
  f.firma_adi,
  rs.urun_id,
  ur.urun_adi,
  ur.urun_aciklamasi,
  rs.adet,
  rs.birim_fiyat,
  (rs.adet * rs.birim_fiyat) AS toplam_tutar,
  NULL AS acente_komisyon_oran, -- Rehber satış kalemlerinde oranlar NULL
  NULL AS rehber_komisyon_oran,
  NULL AS kaptan_komisyon_oran,
  NULL AS ofis_komisyon_oran,
  NULL AS acente_komisyon_tutari, -- Rehber satış kalemlerinde komisyon tutarları NULL
  NULL AS rehber_komisyon_tutari,
  NULL AS kaptan_komisyon_tutari,
  NULL AS ofis_komisyon_tutari,
  rs.bekleme,
  rs.vade_tarihi,
  rs.status,
  'rehber' AS bildirim_tipi,
  s.created_at
FROM
  public.satislar s
JOIN
  public.rehber_satis_kalemleri rs ON s.id = rs.satis_id
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
  public.urunler ur ON rs.urun_id = ur.id
WHERE
  rs.status = 'onaylandı';

-- Grant permissions
GRANT SELECT ON public.satislar_detay_view TO authenticated;

-- Step 4: Recreate magaza_satis_detaylari_view
-- This view provides detailed store sales information for the muhasebe/[magazaId] page.
CREATE OR REPLACE VIEW public.magaza_satis_detaylari_view AS
SELECT
  s.id AS satis_id,
  s.magaza_giris_tarihi AS satis_tarihi,
  s.grup_gelis_tarihi,
  s.magaza_giris_tarihi,
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
  msk.status
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
  public.urunler u ON msk.urun_id = u.id
WHERE
  msk.status = 'onaylandı';

-- Grant permissions
GRANT SELECT ON public.magaza_satis_detaylari_view TO authenticated;

-- Step 5: Recreate magaza_muhasebe_summary_view
-- This view provides a summary of store accounting, separating store and guide sales.
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
WITH sales_summary AS (
  SELECT
      sdv.magaza_id,
      COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' AND sdv.status = 'onaylandı' THEN sdv.toplam_tutar ELSE 0 END), 0) AS toplam_magaza_satis,
      COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'rehber' AND sdv.status = 'onaylandı' THEN sdv.toplam_tutar ELSE 0 END), 0) AS toplam_rehber_satis,
      COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' AND sdv.status = 'onaylandı' THEN sdv.acente_komisyon_tutari ELSE 0 END), 0) AS toplam_acente_komisyonu,
      COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' AND sdv.status = 'onaylandı' THEN sdv.rehber_komisyon_tutari ELSE 0 END), 0) AS toplam_rehber_komisyonu_magaza,
      COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' AND sdv.status = 'onaylandı' THEN sdv.kaptan_komisyon_tutari ELSE 0 END), 0) AS toplam_kaptan_komisyonu,
      COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' AND sdv.status = 'onaylandı' THEN sdv.ofis_komisyon_tutari ELSE 0 END), 0) AS toplam_ofis_komisyonu
  FROM
      public.satislar_detay_view sdv
  WHERE sdv.magaza_id IS NOT NULL
  GROUP BY
      sdv.magaza_id
),
tahsilat_summary AS (
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
SELECT
  m.id AS magaza_id,
  m.magaza_adi,
  COALESCE(ss.toplam_magaza_satis, 0) AS toplam_magaza_satis,
  COALESCE(ss.toplam_rehber_satis, 0) AS toplam_rehber_satis,
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

-- Grant select privileges to authenticated users
GRANT SELECT ON public.satislar_detay_view TO authenticated;
GRANT SELECT ON public.magaza_satis_detaylari_view TO authenticated;
GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
