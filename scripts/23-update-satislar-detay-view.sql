-- satislar_detay_view'i yeni şemaya göre güncelle
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

    -- Mağaza Satış Kalemi bilgileri
    msk.id as magaza_satis_kalemi_id,
    msk.urun_id as magaza_urun_id,
    u_magaza.urun_adi as magaza_urun_adi,
    msk.adet as magaza_adet,
    msk.birim_fiyat as magaza_birim_fiyat,
    msk.acente_komisyonu as magaza_acente_komisyonu,
    msk.rehber_komisyonu as magaza_rehber_komisyonu,
    msk.kaptan_komisyonu as magaza_kaptan_komisyonu,
    (msk.adet * msk.birim_fiyat) as magaza_toplam_tutar,

    -- Rehber Satış Kalemi bilgileri
    rsk.id as rehber_satis_kalemleri_id, -- Changed alias to avoid conflict with table name
    rsk.urun_id as rehber_urun_id,
    u_rehber.urun_adi as rehber_urun_adi,
    rsk.adet as rehber_adet,
    rsk.birim_fiyat as rehber_birim_fiyat,
    rsk.bildirim_tarihi as rehber_bildirim_tarihi,
    rsk.bildirim_notu as rehber_bildirim_notu,
    (rsk.adet * rsk.birim_fiyat) as rehber_toplam_tutar

FROM satislar s
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN firmalar f ON s.firma_id = f.id
LEFT JOIN operatorler o ON s.operator_id = o.id
LEFT JOIN magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN urunler u_magaza ON msk.urun_id = u_magaza.id
LEFT JOIN rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN urunler u_rehber ON rsk.urun_id = u_rehber.id
WHERE s.created_at IS NOT NULL
ORDER BY s.satis_tarihi DESC, s.id DESC;

-- View'e erişim izinleri
GRANT SELECT ON satislar_detay_view TO authenticated;
