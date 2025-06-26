-- satislar_detay_view'i yeniden oluşturmadan önce mevcut view'i sil
DROP VIEW IF EXISTS satislar_detay_view;

-- satislar_detay_view'i magaza_satis_kalemleri ve rehber_satis_kalemleri tablolarından veri alacak şekilde yeniden oluştur
CREATE OR REPLACE VIEW satislar_detay_view AS
SELECT
  s.id AS satis_id,
  s.satis_tarihi,
  s.grup_gelis_tarihi,
  s.magaza_giris_tarihi,
  s.grup_pax,
  s.magaza_pax,
  t.tur_adi AS tur, -- turlar tablosundan tur_adi
  s.bekleme,
  'magaza' AS bildirim_tipi, -- Sabit değer olarak 'magaza'
  s.created_at,
  o.operator_adi,
  r.rehber_adi,
  m.magaza_adi,
  f.firma_adi,
  msk.urun_id,
  u.urun_adi,
  msk.adet,
  msk.birim_fiyat,
  msk.acente_komisyonu,
  msk.rehber_komisyonu,
  msk.kaptan_komisyonu,
  (msk.adet * msk.birim_fiyat) AS toplam_tutar -- Her bir satış kaleminin toplam tutarı
FROM satislar s
JOIN magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN operatorler o ON s.operator_id = o.id
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN firmalar f ON s.firma_id = f.id
LEFT JOIN urunler u ON msk.urun_id = u.id
LEFT JOIN turlar t ON s.tur_id = t.id -- turlar tablosu ile join

UNION ALL

SELECT
  s.id AS satis_id,
  s.satis_tarihi,
  s.grup_gelis_tarihi,
  s.magaza_giris_tarihi,
  s.grup_pax,
  s.magaza_pax,
  t.tur_adi AS tur, -- turlar tablosundan tur_adi
  s.bekleme,
  'rehber' AS bildirim_tipi, -- Sabit değer olarak 'rehber'
  s.created_at,
  o.operator_adi,
  r.rehber_adi,
  m.magaza_adi,
  f.firma_adi,
  rsk.urun_id,
  u.urun_adi,
  rsk.adet,
  rsk.birim_fiyat,
  NULL AS acente_komisyonu, -- Rehber satış kalemlerinde bu alanlar yok
  NULL AS rehber_komisyonu, -- Rehber satış kalemlerinde bu alanlar yok
  NULL AS kaptan_komisyonu, -- Rehber satış kalemlerinde bu alanlar yok
  (rsk.adet * rsk.birim_fiyat) AS toplam_tutar -- Her bir satış kaleminin toplam tutarı
FROM satislar s
JOIN rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN operatorler o ON s.operator_id = o.id
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN firmalar f ON s.firma_id = f.id
LEFT JOIN urunler u ON rsk.urun_id = u.id
LEFT JOIN turlar t ON s.tur_id = t.id; -- turlar tablosu ile join
