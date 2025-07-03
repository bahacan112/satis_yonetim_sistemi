-- Satışlar detay view'ini oluştur
CREATE OR REPLACE VIEW satislar_detay_view AS
SELECT 
    s.id as satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.tur,
    s.bekleme,
    
    -- Rehber bilgileri
    r.id as rehber_id,
    r.rehber_adi,
    
    -- Mağaza bilgileri
    m.id as magaza_id,
    m.magaza_adi,
    m.il as magaza_il,
    m.ilce as magaza_ilce,
    m.sektor as magaza_sektor,
    
    -- Firma bilgileri
    f.id as firma_id,
    f.firma_adi,
    f.il as firma_il,
    f.sektor as firma_sektor,
    
    -- Operatör bilgileri
    o.id as operator_id,
    o.operator_adi,
    
    -- Satış kalemi bilgileri
    sk.id as satis_kalemi_id,
    sk.adet,
    sk.birim_fiyat,
    sk.acente_komisyonu,
    sk.rehber_komisyonu,
    sk.kaptan_komisyonu,
    (sk.adet * sk.birim_fiyat) as toplam_tutar,
    
    -- Ürün bilgileri
    u.id as urun_id,
    u.urun_adi,
    u.satis_cirosu as urun_satis_cirosu,
    u.acente_komisyonu as urun_acente_komisyonu,
    u.rehber_komisyonu as urun_rehber_komisyonu,
    u.kaptan_komisyonu as urun_kaptan_komisyonu,
    
    -- Rehber bildirimi bilgileri
    sk.rehber_bildirim_adet,
    sk.rehber_bildirim_fiyati,
    sk.rehber_bildirim_tarihi,
    sk.rehber_bildirim_notu,
    (sk.rehber_bildirim_adet * sk.rehber_bildirim_fiyati) as rehber_bildirim_toplam
    
FROM satislar s
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN firmalar f ON s.firma_id = f.id
LEFT JOIN operatorler o ON s.operator_id = o.id
LEFT JOIN satis_kalemleri sk ON s.id = sk.satis_id
LEFT JOIN urunler u ON sk.urun_id = u.id
WHERE s.created_at IS NOT NULL
ORDER BY s.satis_tarihi DESC, s.id DESC;

-- View'e erişim izinleri
GRANT SELECT ON satislar_detay_view TO authenticated;
