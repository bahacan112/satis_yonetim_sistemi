-- scripts/119-add-is-magaza-item-to-satislar-detay-view.sql
-- Bu script, satislar_detay_view görünümünü, bir satış kaleminin
-- magaza_satis_kalemleri'nden mi geldiğini belirten bir bayrak eklemek için günceller.

CREATE OR REPLACE VIEW satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.bekleme,
    s.vade_tarihi,
    s.status,
    m.id AS magaza_id,
    m.magaza_adi,
    o.adi AS operator_adi,
    t.tur_adi,
    f.firma_adi,
    p.rehber_adi,
    COALESCE(msk.urun_id, rsk.urun_id) AS urun_id,
    COALESCE(mu.urun_adi, ru.urun_adi) AS urun_adi,
    COALESCE(msk.adet, rsk.adet) AS adet,
    COALESCE(msk.birim_fiyat, rsk.birim_fiyat) AS birim_fiyat,
    COALESCE(msk.toplam_tutar, rsk.toplam_tutar) AS toplam_tutar,
    COALESCE(msk.acente_komisyon_tutari, rsk.acente_komisyon_tutari) AS acente_komisyon_tutari,
    COALESCE(msk.rehber_komisyon_tutari, rsk.rehber_komisyon_tutari) AS rehber_komisyon_tutari,
    COALESCE(msk.kaptan_komisyon_tutari, rsk.kaptan_komisyon_tutari) AS kaptan_komisyon_tutari,
    COALESCE(msk.ofis_komisyon_tutari, rsk.ofis_komisyon_tutari) AS ofis_komisyon_tutari,
    (msk.satis_id IS NOT NULL) AS is_magaza_sale_item -- Yeni bayrak: Mağaza satış kalemi ise TRUE
FROM
    satislar s
LEFT JOIN
    magazalar m ON s.magaza_id = m.id
LEFT JOIN
    operatorler o ON s.operator_id = o.id
LEFT JOIN
    turlar t ON s.tur_id = t.id
LEFT JOIN
    firmalar f ON s.firma_id = f.id
LEFT JOIN
    profiles p ON s.rehber_id = p.id
LEFT JOIN
    magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    magaza_urunler mu ON msk.urun_id = mu.id
LEFT JOIN
    rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN
    rehber_urunler ru ON rsk.urun_id = ru.id;
