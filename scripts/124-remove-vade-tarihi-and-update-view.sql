-- scripts/124-remove-vade-tarihi-and-update-view.sql
-- Bu script, magaza_muhasebe_satis_detay_view görünümünü yeniden oluşturur.
-- satislar tablosundan vade_tarihi sütunu kaldırıldığı için görünümden de çıkarılır.
-- satis_tarihi sütunu hala satislar tablosundaki magaza_giris_tarihi sütunundan alınır.

DROP VIEW IF EXISTS magaza_muhasebe_satis_detay_view;

CREATE OR REPLACE VIEW magaza_muhasebe_satis_detay_view AS
SELECT
    s.id AS satis_id,
    s.magaza_giris_tarihi AS satis_tarihi, -- satis_tarihi olarak magaza_giris_tarihi kullanıldı
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi, -- Orijinal magaza_giris_tarihi de tutuldu
    s.grup_pax,
    s.magaza_pax,
    -- s.vade_tarihi, -- vade_tarihi kaldırıldı
    s.status,
    m.id AS magaza_id,
    m.magaza_adi,
    o.adi AS operator_adi,
    t.tur_adi,
    f.firma_adi,
    p.rehber_adi,
    msk.urun_id,
    mu.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    msk.toplam_tutar,
    msk.acente_komisyon_tutari,
    msk.rehber_komisyon_tutari,
    msk.kaptan_komisyon_tutari,
    msk.ofis_komisyon_tutari
FROM
    satislar s
JOIN
    magaza_satis_kalemleri msk ON s.id = msk.satis_id
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
    magaza_urunler mu ON msk.urun_id = mu.id;
