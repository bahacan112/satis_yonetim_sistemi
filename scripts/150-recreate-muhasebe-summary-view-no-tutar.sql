-- Mağaza muhasebe özet view'ini yeniden oluştur
-- tahsilatlar tablosunda tutar alanı yok, acente_payi ve ofis_payi var
-- Tablo yapılarına göre düzenlendi

-- Mağaza muhasebe özet view'ini oluştur
CREATE VIEW magaza_muhasebe_summary_view AS
SELECT 
    m.id as magaza_id,
    m.adi as magaza_adi,
    m.tur_adi as magaza_tur_adi,
    m.tur_aciklamasi as magaza_tur_aciklamasi,
    m.operator_id as magaza_operator_id,
    f.id as firma_id,
    f.adi as firma_adi,
    
    -- Satış toplamları (sadece mağaza kalemleri)
    COALESCE(satis_data.toplam_satis, 0) as toplam_satis,
    COALESCE(satis_data.toplam_komisyon, 0) as toplam_komisyon,
    COALESCE(satis_data.toplam_ofis_komisyonu, 0) as toplam_ofis_komisyonu,
    COALESCE(satis_data.kalem_sayisi, 0) as kalem_sayisi,
    
    -- Tahsilat toplamları (acente_payi + ofis_payi)
    COALESCE(tahsilat_data.tahsilat_toplami, 0) as tahsilat_toplami,
    COALESCE(tahsilat_data.acente_payi_toplami, 0) as acente_payi_toplami,
    COALESCE(tahsilat_data.ofis_payi_toplami, 0) as ofis_payi_toplami,
    COALESCE(tahsilat_data.tahsilat_sayisi, 0) as tahsilat_sayisi,
    
    -- Kalan borç
    COALESCE(satis_data.toplam_satis, 0) - COALESCE(tahsilat_data.tahsilat_toplami, 0) as kalan_borc,
    
    -- Son işlem tarihleri
    satis_data.son_satis_tarihi,
    tahsilat_data.son_tahsilat_tarihi

FROM magazalar m
JOIN firmalar f ON m.firma_id = f.id

-- Satış verileri (sadece mağaza kalemleri)
LEFT JOIN (
    SELECT 
        sd.magaza_id,
        SUM(sd.kalem_toplam_tutar) as toplam_satis,
        SUM(sd.kalem_komisyon_tutari) as toplam_komisyon,
        SUM(sd.kalem_ofis_komisyonu) as toplam_ofis_komisyonu,
        COUNT(sd.kalem_id) as kalem_sayisi,
        MAX(sd.tarih) as son_satis_tarihi
    FROM satislar_detay_view sd
    WHERE sd.is_magaza_item = true -- Sadece mağaza kalemleri
    GROUP BY sd.magaza_id
) satis_data ON m.id = satis_data.magaza_id

-- Tahsilat verileri (acente_payi + ofis_payi)
LEFT JOIN (
    SELECT 
        t.magaza_id,
        SUM(t.acente_payi + t.ofis_payi) as tahsilat_toplami,
        SUM(t.acente_payi) as acente_payi_toplami,
        SUM(t.ofis_payi) as ofis_payi_toplami,
        COUNT(t.id) as tahsilat_sayisi,
        MAX(t.tahsilat_tarihi) as son_tahsilat_tarihi
    FROM tahsilatlar t
    GROUP BY t.magaza_id
) tahsilat_data ON m.id = tahsilat_data.magaza_id

ORDER BY m.adi;

-- View'e yorum ekle
COMMENT ON VIEW magaza_muhasebe_summary_view IS 'Mağaza bazında muhasebe özet bilgileri - tahsilatlar tablosunda acente_payi ve ofis_payi kullanıyor, tablo yapılarına uygun';
