-- Satışlar detay view'ini oluştur (satis_kalemleri tablosu olmadan)
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
    s.adet,
    s.birim_fiyat,
    s.toplam_tutar,
    s.acente_komisyonu,
    s.rehber_komisyonu,
    s.kaptan_komisyonu,
    
    -- Rehber bilgileri
    r.id as rehber_id,
    r.rehber_adi,
    r.telefon as rehber_telefon,
    r.email as rehber_email,
    r.aktif as rehber_aktif,
    
    -- Mağaza bilgileri
    m.id as magaza_id,
    m.magaza_adi,
    m.il as magaza_il,
    m.ilce as magaza_ilce,
    m.sektor as magaza_sektor,
    m.aktif as magaza_aktif,
    
    -- Firma bilgileri
    f.id as firma_id,
    f.firma_adi,
    f.il as firma_il,
    f.sektor as firma_sektor,
    f.aktif as firma_aktif,
    
    -- Operatör bilgileri
    o.id as operator_id,
    o.operator_adi,
    o.telefon as operator_telefon,
    o.email as operator_email,
    o.aktif as operator_aktif,
    
    -- Ürün bilgileri
    u.id as urun_id,
    u.urun_adi,
    u.satis_cirosu as urun_satis_cirosu,
    u.acente_komisyonu as urun_acente_komisyonu,
    u.rehber_komisyonu as urun_rehber_komisyonu,
    u.kaptan_komisyonu as urun_kaptan_komisyonu,
    u.aktif as urun_aktif
    
FROM satislar s
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN firmalar f ON s.firma_id = f.id
LEFT JOIN operatorler o ON s.operator_id = o.id
LEFT JOIN urunler u ON s.urun_id = u.id
WHERE s.created_at IS NOT NULL
ORDER BY s.satis_tarihi DESC, s.id DESC;

-- View'e erişim izinleri
GRANT SELECT ON satislar_detay_view TO authenticated;
