-- Satislar detay view'ını operatör bilgisini satis_kalemleri'nden alacak şekilde düzelt

-- Önce mevcut view'ı düşür
DROP VIEW IF EXISTS public.satislar_detay_view CASCADE;

-- View'ı yeniden oluştur - operatör bilgisini satış kalemlerinden al
CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.created_at AS satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    t.tur_adi AS tur, -- tur_adi'nı tur olarak al
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.tur_id,
    t.tur_adi,
    s.rehber_id,
    r.rehber_adi,
    -- Mağaza satış kalemleri
    msk.urun_id,
    mu.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    msk.ofis_komisyonu,
    msk.toplam_tutar,
    'magaza' AS bildirim_tipi,
    msk.status,
    -- Operatör bilgisini magaza_satis_kalemleri'nden al
    msk.operator_id,
    o.operator_adi,
    -- Komisyon tutarları
    CASE 
        WHEN msk.toplam_tutar IS NOT NULL AND msk.acente_komisyonu IS NOT NULL 
        THEN (msk.toplam_tutar * msk.acente_komisyonu / 100)
        ELSE 0
    END AS acente_komisyon_tutari,
    CASE 
        WHEN msk.toplam_tutar IS NOT NULL AND msk.rehber_komisyonu IS NOT NULL 
        THEN (msk.toplam_tutar * msk.rehber_komisyonu / 100)
        ELSE 0
    END AS rehber_komisyon_tutari,
    CASE 
        WHEN msk.toplam_tutar IS NOT NULL AND msk.kaptan_komisyonu IS NOT NULL 
        THEN (msk.toplam_tutar * msk.kaptan_komisyonu / 100)
        ELSE 0
    END AS kaptan_komisyon_tutari,
    CASE 
        WHEN msk.toplam_tutar IS NOT NULL AND msk.ofis_komisyonu IS NOT NULL 
        THEN (msk.toplam_tutar * msk.ofis_komisyonu / 100)
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
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.magaza_urunler mu ON msk.urun_id = mu.id AND s.magaza_id = mu.magaza_id
LEFT JOIN
    public.operatorler o ON msk.operator_id = o.id -- Operatör join'i magaza_satis_kalemleri üzerinden

UNION ALL

SELECT
    s.id AS satis_id,
    s.created_at AS satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    t.tur_adi AS tur, -- tur_adi'nı tur olarak al
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.tur_id,
    t.tur_adi,
    s.rehber_id,
    r.rehber_adi,
    -- Rehber satış kalemleri
    rsk.urun_id,
    u.urun_adi,
    rsk.adet,
    rsk.birim_fiyat,
    rsk.acente_komisyonu,
    rsk.rehber_komisyonu,
    rsk.kaptan_komisyonu,
    rsk.ofis_komisyonu,
    rsk.toplam_tutar,
    'rehber' AS bildirim_tipi,
    rsk.status,
    -- Operatör bilgisini rehber_satis_kalemleri'nden al
    rsk.operator_id,
    o.operator_adi,
    -- Komisyon tutarları
    CASE 
        WHEN rsk.toplam_tutar IS NOT NULL AND rsk.acente_komisyonu IS NOT NULL 
        THEN (rsk.toplam_tutar * rsk.acente_komisyonu / 100)
        ELSE 0
    END AS acente_komisyon_tutari,
    CASE 
        WHEN rsk.toplam_tutar IS NOT NULL AND rsk.rehber_komisyonu IS NOT NULL 
        THEN (rsk.toplam_tutar * rsk.rehber_komisyonu / 100)
        ELSE 0
    END AS rehber_komisyon_tutari,
    CASE 
        WHEN rsk.toplam_tutar IS NOT NULL AND rsk.kaptan_komisyonu IS NOT NULL 
        THEN (rsk.toplam_tutar * rsk.kaptan_komisyonu / 100)
        ELSE 0
    END AS kaptan_komisyon_tutari,
    CASE 
        WHEN rsk.toplam_tutar IS NOT NULL AND rsk.ofis_komisyonu IS NOT NULL 
        THEN (rsk.toplam_tutar * rsk.ofis_komisyonu / 100)
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
    public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN
    public.urunler u ON rsk.urun_id = u.id
LEFT JOIN
    public.operatorler o ON rsk.operator_id = o.id; -- Operatör join'i rehber_satis_kalemleri üzerinden

-- View'a yorum ekle
COMMENT ON VIEW public.satislar_detay_view IS 'Satış detayları view - operatör bilgisi satış kalemlerinden alınır';
