-- scripts/122-drop-bekleme-from-satislar-and-recreate-view.sql
-- Bu script, satislar tablosundan bekleme sütununu kaldırır
-- ve ardından magaza_muhasebe_satis_detay_view görünümünü yeniden oluşturur.

DO $$
BEGIN
    -- satislar tablosunda bekleme sütununun varlığını kontrol et
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'satislar' AND column_name = 'bekleme'
    ) THEN
        -- Sütun varsa, kaldır
        ALTER TABLE satislar DROP COLUMN bekleme;
        RAISE NOTICE 'bekleme sütunu satislar tablosundan kaldırıldı.';
    ELSE
        RAISE NOTICE 'bekleme sütunu satislar tablosunda zaten mevcut değil.';
    END IF;
END $$;

-- magaza_muhasebe_satis_detay_view görünümünü yeniden oluştur
-- Bu görünümde artık s.bekleme sütunu yer almayacak
CREATE OR REPLACE VIEW magaza_muhasebe_satis_detay_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.vade_tarihi,
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
