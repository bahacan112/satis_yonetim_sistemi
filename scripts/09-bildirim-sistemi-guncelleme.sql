-- Mevcut view'ı sil ve yeniden oluştur (satış ID'leri ile)
DROP VIEW IF EXISTS bildirim_karsilastirma;

CREATE VIEW bildirim_karsilastirma AS
WITH magaza_bildirimleri AS (
  SELECT 
    s.id as magaza_satis_id,
    s.satis_tarihi,
    s.firma_id,
    f.firma_adi,
    s.magaza_id,
    m.magaza_adi,
    s.operator_id,
    o.operator_adi,
    s.rehber_id,
    r.rehber_adi,
    s.tur,
    s.grup_pax,
    s.magaza_pax,
    COALESCE(SUM(sk.adet), 0) as magaza_toplam_adet,
    COALESCE(SUM(sk.adet * sk.birim_fiyat), 0) as magaza_toplam_tutar
  FROM satislar s
  LEFT JOIN satis_kalemleri sk ON s.id = sk.satis_id
  LEFT JOIN firmalar f ON s.firma_id = f.id
  LEFT JOIN magazalar m ON s.magaza_id = m.id
  LEFT JOIN operatorler o ON s.operator_id = o.id
  LEFT JOIN rehberler r ON s.rehber_id = r.id
  WHERE s.bildirim_tipi = 'magaza'
  GROUP BY s.id, s.satis_tarihi, s.firma_id, f.firma_adi, s.magaza_id, m.magaza_adi, 
           s.operator_id, o.operator_adi, s.rehber_id, r.rehber_adi, s.tur, s.grup_pax, s.magaza_pax
),
rehber_bildirimleri AS (
  SELECT 
    s.id as rehber_satis_id,
    s.satis_tarihi,
    s.firma_id,
    s.magaza_id,
    s.operator_id,
    s.rehber_id,
    COALESCE(SUM(sk.adet), 0) as rehber_toplam_adet,
    COALESCE(SUM(sk.adet * sk.birim_fiyat), 0) as rehber_toplam_tutar
  FROM satislar s
  LEFT JOIN satis_kalemleri sk ON s.id = sk.satis_id
  WHERE s.bildirim_tipi = 'rehber'
  GROUP BY s.id, s.satis_tarihi, s.firma_id, s.magaza_id, s.operator_id, s.rehber_id
)
SELECT 
  COALESCE(mb.satis_tarihi, rb.satis_tarihi) as satis_tarihi,
  COALESCE(mb.firma_id, rb.firma_id) as firma_id,
  mb.firma_adi,
  COALESCE(mb.magaza_id, rb.magaza_id) as magaza_id,
  mb.magaza_adi,
  COALESCE(mb.operator_id, rb.operator_id) as operator_id,
  mb.operator_adi,
  COALESCE(mb.rehber_id, rb.rehber_id) as rehber_id,
  mb.rehber_adi,
  mb.tur,
  mb.grup_pax,
  mb.magaza_pax,
  mb.magaza_satis_id,
  rb.rehber_satis_id,
  COALESCE(mb.magaza_toplam_adet, 0) as magaza_toplam_adet,
  COALESCE(mb.magaza_toplam_tutar, 0) as magaza_toplam_tutar,
  COALESCE(rb.rehber_toplam_adet, 0) as rehber_toplam_adet,
  COALESCE(rb.rehber_toplam_tutar, 0) as rehber_toplam_tutar,
  (COALESCE(rb.rehber_toplam_adet, 0) - COALESCE(mb.magaza_toplam_adet, 0)) as adet_farki,
  (COALESCE(rb.rehber_toplam_tutar, 0) - COALESCE(mb.magaza_toplam_tutar, 0)) as tutar_farki,
  CASE 
    WHEN mb.magaza_satis_id IS NULL THEN 'MAGAZA_BILDIRIMI_YOK'
    WHEN rb.rehber_satis_id IS NULL THEN 'REHBER_BILDIRIMI_YOK'
    WHEN COALESCE(mb.magaza_toplam_adet, 0) = COALESCE(rb.rehber_toplam_adet, 0) 
         AND COALESCE(mb.magaza_toplam_tutar, 0) = COALESCE(rb.rehber_toplam_tutar, 0) THEN 'UYUMLU'
    ELSE 'UYUMSUZ'
  END as durum
FROM magaza_bildirimleri mb
FULL OUTER JOIN rehber_bildirimleri rb ON (
  mb.satis_tarihi = rb.satis_tarihi 
  AND mb.firma_id = rb.firma_id 
  AND mb.magaza_id = rb.magaza_id
  AND COALESCE(mb.operator_id, 0) = COALESCE(rb.operator_id, 0)
  AND COALESCE(mb.rehber_id, 0) = COALESCE(rb.rehber_id, 0)
);
