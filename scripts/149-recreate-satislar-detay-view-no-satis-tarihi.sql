-- Satışlar detay view'ini yeniden oluştur
-- satislar tablosundan satis_tarihi kaldırıldığı için magaza_giris_tarihi kullan
-- satis_aciklamasi alanını dahil et
-- Tablo yapılarına göre düzenlendi

-- Önce bağımlı view'leri düşür
DROP VIEW IF EXISTS magaza_muhasebe_summary_view CASCADE;
DROP VIEW IF EXISTS bildirim_karsilastirma CASCADE;

-- Satışlar detay view'ini düşür
DROP VIEW IF EXISTS satislar_detay_view CASCADE;

-- Satışlar detay view'ini yeniden oluştur
CREATE VIEW satislar_detay_view AS
-- Mağaza satış kalemleri
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
    
    -- Kalem bilgileri
    msk.id as kalem_id,
    msk.urun_id,
    u.adi as urun_adi,
    u.aciklama as urun_aciklamasi,
    msk.adet,
    msk.birim_fiyat,
    msk.komisyon_orani,
    msk.ofis_komisyonu,
    msk.bekleme_suresi,
    msk.vade_tarihi,
    msk.status,
    msk.satis_aciklamasi,
    msk.operator_adi as kalem_operator_adi,
    
    -- Hesaplanan tutarlar
    (msk.adet * msk.birim_fiyat) as kalem_toplam_tutar,
    (msk.adet * msk.birim_fiyat * msk.komisyon_orani / 100) as kalem_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) as kalem_ofis_komisyonu,
    
    -- Kaynak tipi
    'MAGAZA' as kaynak_tipi,
    true as is_magaza_item,
    
    -- Firma bilgisi
    m.firma_id,
    f.adi as firma_adi,
    
    -- Rehber bilgileri (mağaza kalemleri için null)
    NULL::uuid as rehber_id,
    NULL::text as rehber_adi

FROM satislar s
JOIN magazalar m ON s.magaza_id = m.id
JOIN firmalar f ON m.firma_id = f.id
JOIN turlar t ON s.tur_id = t.id
LEFT JOIN operatorler o ON s.operator_id = o.id
JOIN magaza_satis_kalemleri msk ON s.id = msk.satis_id
JOIN urunler u ON msk.urun_id = u.id

UNION ALL

-- Rehber satış kalemleri
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
    
    -- Kalem bilgileri
    rsk.id as kalem_id,
    rsk.urun_id,
    u.adi as urun_adi,
    u.aciklama as urun_aciklamasi,
    rsk.adet,
    rsk.birim_fiyat,
    rsk.komisyon_orani,
    0 as ofis_komisyonu, -- Rehber kalemlerinde ofis komisyonu yok
    rsk.bekleme_suresi,
    rsk.vade_tarihi,
    rsk.status,
    rsk.satis_aciklamasi,
    NULL as kalem_operator_adi, -- Rehber kalemlerinde operator_adi yok
    
    -- Hesaplanan tutarlar
    (rsk.adet * rsk.birim_fiyat) as kalem_toplam_tutar,
    (rsk.adet * rsk.birim_fiyat * rsk.komisyon_orani / 100) as kalem_komisyon_tutari,
    0 as kalem_ofis_komisyonu, -- Rehber kalemlerinde ofis komisyonu yok
    
    -- Kaynak tipi
    'REHBER' as kaynak_tipi,
    false as is_magaza_item,
    
    -- Firma bilgisi
    m.firma_id,
    f.adi as firma_adi,
    
    -- Rehber bilgileri
    rsk.rehber_id,
    r.adi as rehber_adi

FROM satislar s
JOIN magazalar m ON s.magaza_id = m.id
JOIN firmalar f ON m.firma_id = f.id
JOIN turlar t ON s.tur_id = t.id
LEFT JOIN operatorler o ON s.operator_id = o.id
JOIN rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
JOIN urunler u ON rsk.urun_id = u.id
LEFT JOIN rehberler r ON rsk.rehber_id = r.id

ORDER BY tarih DESC, satis_id, kalem_id;

-- View'e yorum ekle
COMMENT ON VIEW satislar_detay_view IS 'Mağaza ve rehber satış kalemlerini birleştiren detay view - satis_aciklamasi dahil, magaza_giris_tarihi kullanıyor, tablo yapılarına uygun';
