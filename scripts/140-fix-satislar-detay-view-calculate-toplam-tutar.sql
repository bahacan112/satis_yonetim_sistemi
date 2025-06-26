-- Satislar detay view'ını toplam_tutar hesaplaması ile düzelt

-- Önce mevcut view'ı düşür
DROP VIEW IF EXISTS public.satislar_detay_view CASCADE;

-- View'ı yeniden oluştur - toplam_tutar'ı hesapla
CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.magaza_giris_tarihi AS satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    t.tur_adi AS tur,
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.tur_id,
    t.tur_adi,
    s.rehber_id,
    r.rehber_adi,
    s.operator_id,
    o.operator_adi,
    -- Mağaza satış kalemleri
    msk.urun_id,
    u_magaza.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    msk.ofis_komisyonu,
    (msk.birim_fiyat * msk.adet) AS toplam_tutar, -- Hesapla
    'magaza' AS bildirim_tipi,
    msk.status,
    -- Komisyon tutarları - hesaplanan toplam_tutar ile
    CASE 
        WHEN msk.birim_fiyat IS NOT NULL AND msk.adet IS NOT NULL AND msk.acente_komisyonu IS NOT NULL 
        THEN ((msk.birim_fiyat * msk.adet) * msk.acente_komisyonu / 100)
        ELSE 0
    END AS acente_komisyon_tutari,
    CASE 
        WHEN msk.birim_fiyat IS NOT NULL AND msk.adet IS NOT NULL AND msk.rehber_komisyonu IS NOT NULL 
        THEN ((msk.birim_fiyat * msk.adet) * msk.rehber_komisyonu / 100)
        ELSE 0
    END AS rehber_komisyon_tutari,
    CASE 
        WHEN msk.birim_fiyat IS NOT NULL AND msk.adet IS NOT NULL AND msk.kaptan_komisyonu IS NOT NULL 
        THEN ((msk.birim_fiyat * msk.adet) * msk.kaptan_komisyonu / 100)
        ELSE 0
    END AS kaptan_komisyon_tutari,
    CASE 
        WHEN msk.birim_fiyat IS NOT NULL AND msk.adet IS NOT NULL AND msk.ofis_komisyonu IS NOT NULL 
        THEN ((msk.birim_fiyat * msk.adet) * msk.ofis_komisyonu / 100)
        ELSE 0
    END AS ofis_komisyon_tutari
FROM
    public.satislar s
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.operatorler o ON s.operator_id = o.id
LEFT JOIN
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.magaza_urunler mu ON msk.urun_id = mu.id AND s.magaza_id = mu.magaza_id
LEFT JOIN
    public.urunler u_magaza ON mu.urun_id = u_magaza.id

UNION ALL

SELECT
    s.id AS satis_id,
    s.magaza_giris_tarihi AS satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    t.tur_adi AS tur,
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.tur_id,
    t.tur_adi,
    s.rehber_id,
    r.rehber_adi,
    s.operator_id,
    o.operator_adi,
    -- Rehber satış kalemleri
    rsk.urun_id,
    u_rehber.urun_adi,
    rsk.adet,
    rsk.birim_fiyat,
    rsk.acente_komisyonu,
    rsk.rehber_komisyonu,
    rsk.kaptan_komisyonu,
    rsk.ofis_komisyonu,
    (rsk.birim_fiyat * rsk.adet) AS toplam_tutar, -- Hesapla
    'rehber' AS bildirim_tipi,
    rsk.status,
    -- Komisyon tutarları - hesaplanan toplam_tutar ile
    CASE 
        WHEN rsk.birim_fiyat IS NOT NULL AND rsk.adet IS NOT NULL AND rsk.acente_komisyonu IS NOT NULL 
        THEN ((rsk.birim_fiyat * rsk.adet) * rsk.acente_komisyonu / 100)
        ELSE 0
    END AS acente_komisyon_tutari,
    CASE 
        WHEN rsk.birim_fiyat IS NOT NULL AND rsk.adet IS NOT NULL AND rsk.rehber_komisyonu IS NOT NULL 
        THEN ((rsk.birim_fiyat * rsk.adet) * rsk.rehber_komisyonu / 100)
        ELSE 0
    END AS rehber_komisyon_tutari,
    CASE 
        WHEN rsk.birim_fiyat IS NOT NULL AND rsk.adet IS NOT NULL AND rsk.kaptan_komisyonu IS NOT NULL 
        THEN ((rsk.birim_fiyat * rsk.adet) * rsk.kaptan_komisyonu / 100)
        ELSE 0
    END AS kaptan_komisyon_tutari,
    CASE 
        WHEN rsk.birim_fiyat IS NOT NULL AND rsk.adet IS NOT NULL AND rsk.ofis_komisyonu IS NOT NULL 
        THEN ((rsk.birim_fiyat * rsk.adet) * rsk.ofis_komisyonu / 100)
        ELSE 0
    END AS ofis_komisyon_tutari
FROM
    public.satislar s
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.operatorler o ON s.operator_id = o.id
LEFT JOIN
    public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN
    public.urunler u_rehber ON rsk.urun_id = u_rehber.id;

-- View'a yorum ekle
COMMENT ON VIEW public.satislar_detay_view IS 'Satış detayları view - toplam_tutar birim_fiyat * adet ile hesaplanır';
