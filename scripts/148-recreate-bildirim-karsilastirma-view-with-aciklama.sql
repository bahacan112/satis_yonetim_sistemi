-- Bildirim karşılaştırma view'ini satis_aciklamasi ile yeniden oluştur
-- satislar tablosundan satis_tarihi kaldırıldığı için magaza_giris_tarihi kullan
-- Tablo yapılarına göre düzenlendi

-- Önce mevcut view'i düşür
DROP VIEW IF EXISTS bildirim_karsilastirma CASCADE;

-- Bildirim karşılaştırma view'ini yeniden oluştur
CREATE VIEW bildirim_karsilastirma AS
SELECT 
    s.id as satis_id,
    s.magaza_id,
    m.adi as magaza_adi,
    s.magaza_giris_tarihi as tarih, -- satis_tarihi yerine magaza_giris_tarihi kullan
    s.tur_id,
    t.tur_adi,
    t.tur_aciklamasi,
    s.operator_id,
    o.adi as operator_adi,
    
    -- Mağaza satış kalemleri
    msk.id as magaza_kalem_id,
    msk.urun_id as magaza_urun_id,
    u.adi as urun_adi,
    msk.adet as magaza_adet,
    msk.birim_fiyat as magaza_birim_fiyat,
    msk.komisyon_orani as magaza_komisyon_orani,
    msk.ofis_komisyonu as magaza_ofis_komisyonu,
    msk.bekleme_suresi as magaza_bekleme_suresi,
    msk.vade_tarihi as magaza_vade_tarihi,
    msk.status as magaza_status,
    msk.satis_aciklamasi as magaza_satis_aciklamasi,
    msk.operator_adi as magaza_kalem_operator_adi,
    
    -- Mağaza kalem tutarları
    (msk.adet * msk.birim_fiyat) as magaza_kalem_toplam_tutar,
    (msk.adet * msk.birim_fiyat * msk.komisyon_orani / 100) as magaza_kalem_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) as magaza_kalem_ofis_komisyonu,
    
    -- Rehber satış kalemleri
    rsk.id as rehber_kalem_id,
    rsk.urun_id as rehber_urun_id,
    rsk.adet as rehber_adet,
    rsk.birim_fiyat as rehber_birim_fiyat,
    rsk.komisyon_orani as rehber_komisyon_orani,
    rsk.bekleme_suresi as rehber_bekleme_suresi,
    rsk.vade_tarihi as rehber_vade_tarihi,
    rsk.status as rehber_status,
    rsk.satis_aciklamasi as rehber_satis_aciklamasi,
    
    -- Rehber kalem tutarları
    (rsk.adet * rsk.birim_fiyat) as rehber_kalem_toplam_tutar,
    (rsk.adet * rsk.birim_fiyat * rsk.komisyon_orani / 100) as rehber_kalem_komisyon_tutari,
    
    -- Karşılaştırma alanları
    CASE 
        WHEN msk.id IS NOT NULL AND rsk.id IS NOT NULL THEN 'BOTH'
        WHEN msk.id IS NOT NULL THEN 'MAGAZA_ONLY'
        WHEN rsk.id IS NOT NULL THEN 'REHBER_ONLY'
        ELSE 'NONE'
    END as kaynak_tipi,
    
    -- Fark hesaplamaları
    COALESCE(msk.adet, 0) - COALESCE(rsk.adet, 0) as adet_farki,
    COALESCE(msk.birim_fiyat, 0) - COALESCE(rsk.birim_fiyat, 0) as fiyat_farki,
    COALESCE((msk.adet * msk.birim_fiyat), 0) - COALESCE((rsk.adet * rsk.birim_fiyat), 0) as tutar_farki

FROM satislar s
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN turlar t ON s.tur_id = t.id
LEFT JOIN operatorler o ON s.operator_id = o.id
LEFT JOIN magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN rehber_satis_kalemleri rsk ON s.id = rsk.satis_id AND msk.urun_id = rsk.urun_id
LEFT JOIN urunler u ON COALESCE(msk.urun_id, rsk.urun_id) = u.id

ORDER BY s.magaza_giris_tarihi DESC, s.id, msk.id, rsk.id;

-- View'e yorum ekle
COMMENT ON VIEW bildirim_karsilastirma IS 'Mağaza ve rehber satış kalemlerini karşılaştıran view - satis_aciklamasi dahil, magaza_giris_tarihi kullanıyor';
