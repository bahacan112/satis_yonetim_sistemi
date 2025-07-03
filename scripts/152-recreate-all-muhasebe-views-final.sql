-- scripts/152-recreate-all-muhasebe-views-final.sql
-- Tüm muhasebe view'larını en güncel haliyle yeniden oluştur

-- Önce bağımlı view'ları sil
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view CASCADE;
DROP VIEW IF EXISTS public.magaza_muhasebe_satis_detay_view CASCADE;
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view CASCADE;

-- 1. satislar_detay_view'ın mevcut olduğundan emin ol (en güncel hali)
DROP VIEW IF EXISTS public.satislar_detay_view CASCADE;

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
    s.created_at,
    -- Ürün bilgileri
    msk.urun_id,
    u.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    msk.ofis_komisyonu,
    (msk.birim_fiyat * msk.adet) AS toplam_tutar,
    'magaza' AS bildirim_tipi,
    msk.status,
    msk.satis_aciklamasi,
    -- Komisyon tutarları
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
    public.urunler u ON msk.urun_id = u.id
WHERE 
    msk.id IS NOT NULL

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
    s.created_at,
    -- Ürün bilgileri
    rsk.urun_id,
    u.urun_adi,
    rsk.adet,
    rsk.birim_fiyat,
    NULL AS acente_komisyonu,
    NULL AS rehber_komisyonu,
    NULL AS kaptan_komisyonu,
    NULL AS ofis_komisyonu,
    (rsk.birim_fiyat * rsk.adet) AS toplam_tutar,
    'rehber' AS bildirim_tipi,
    rsk.status,
    rsk.satis_aciklamasi,
    -- Komisyon tutarları
    NULL AS acente_komisyon_tutari,
    NULL AS rehber_komisyon_tutari,
    NULL AS kaptan_komisyon_tutari,
    NULL AS ofis_komisyon_tutari
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
    public.urunler u ON rsk.urun_id = u.id
WHERE 
    rsk.id IS NOT NULL;

-- 2. magaza_muhasebe_summary_view'ı yeniden oluştur
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
WITH satis_toplamlari AS (
    SELECT
        sd.magaza_id,
        SUM(CASE WHEN sd.status != 'iptal' THEN sd.toplam_tutar ELSE 0 END) AS toplam_satis_tutari,
        SUM(CASE WHEN sd.status != 'iptal' THEN sd.acente_komisyon_tutari ELSE 0 END) AS toplam_acente_komisyonu,
        SUM(CASE WHEN sd.status != 'iptal' THEN sd.rehber_komisyon_tutari ELSE 0 END) AS toplam_rehber_komisyonu,
        SUM(CASE WHEN sd.status != 'iptal' THEN sd.kaptan_komisyon_tutari ELSE 0 END) AS toplam_kaptan_komisyonu,
        SUM(CASE WHEN sd.status != 'iptal' THEN sd.ofis_komisyon_tutari ELSE 0 END) AS toplam_ofis_komisyonu,
        COUNT(CASE WHEN sd.status != 'iptal' THEN 1 END) AS aktif_kalem_sayisi,
        COUNT(*) AS toplam_kalem_sayisi
    FROM
        public.satislar_detay_view sd
    WHERE 
        sd.bildirim_tipi = 'magaza' -- Sadece mağaza kalemleri
    GROUP BY
        sd.magaza_id
),
tahsilat_toplamlari AS (
    SELECT
        t.magaza_id,
        SUM(t.acente_payi + t.ofis_payi) AS toplam_tahsilat_tutari,
        SUM(t.acente_payi) AS toplam_acente_payi,
        SUM(t.ofis_payi) AS toplam_ofis_payi,
        COUNT(*) AS tahsilat_sayisi,
        MAX(t.tahsilat_tarihi) AS son_tahsilat_tarihi
    FROM
        public.tahsilatlar t
    GROUP BY
        t.magaza_id
)
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    f.firma_adi,
    -- Satış toplamları
    COALESCE(st.toplam_satis_tutari, 0) AS toplam_satis_tutari,
    COALESCE(st.toplam_acente_komisyonu, 0) AS toplam_acente_komisyonu,
    COALESCE(st.toplam_rehber_komisyonu, 0) AS toplam_rehber_komisyonu,
    COALESCE(st.toplam_kaptan_komisyonu, 0) AS toplam_kaptan_komisyonu,
    COALESCE(st.toplam_ofis_komisyonu, 0) AS toplam_ofis_komisyonu,
    COALESCE(st.aktif_kalem_sayisi, 0) AS aktif_kalem_sayisi,
    COALESCE(st.toplam_kalem_sayisi, 0) AS toplam_kalem_sayisi,
    -- Tahsilat toplamları
    COALESCE(tt.toplam_tahsilat_tutari, 0) AS toplam_tahsilat_tutari,
    COALESCE(tt.toplam_acente_payi, 0) AS toplam_acente_payi,
    COALESCE(tt.toplam_ofis_payi, 0) AS toplam_ofis_payi,
    COALESCE(tt.tahsilat_sayisi, 0) AS tahsilat_sayisi,
    tt.son_tahsilat_tarihi,
    -- Kalan bakiye hesaplaması
    COALESCE(st.toplam_satis_tutari, 0) - COALESCE(tt.toplam_tahsilat_tutari, 0) AS kalan_bakiye
FROM
    public.magazalar m
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    satis_toplamlari st ON m.id = st.magaza_id
LEFT JOIN
    tahsilat_toplamlari tt ON m.id = tt.magaza_id;

-- 3. magaza_muhasebe_satis_detay_view'ı yeniden oluştur
CREATE OR REPLACE VIEW public.magaza_muhasebe_satis_detay_view AS
SELECT
    s.id AS satis_id,
    s.magaza_giris_tarihi AS satis_tarihi,
    s.grup_gelis_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.magaza_id,
    m.magaza_adi,
    o.operator_adi,
    t.tur_adi,
    r.rehber_adi,
    f.firma_adi,
    msk.urun_id,
    u.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    (msk.adet * msk.birim_fiyat) AS toplam_tutar,
    msk.acente_komisyonu AS acente_komisyon_oran,
    msk.rehber_komisyonu AS rehber_komisyon_oran,
    msk.kaptan_komisyonu AS kaptan_komisyon_oran,
    msk.ofis_komisyonu AS ofis_komisyon_oran,
    (msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100) AS acente_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100) AS rehber_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100) AS kaptan_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) AS ofis_komisyon_tutari,
    msk.status,
    msk.satis_aciklamasi,
    s.created_at
FROM
    public.satislar s
INNER JOIN
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.operatorler o ON s.operator_id = o.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.firmalar f ON s.firma_id = f.id
LEFT JOIN
    public.urunler u ON msk.urun_id = u.id;

-- 4. magaza_satis_detaylari_view'ı yeniden oluştur
CREATE OR REPLACE VIEW public.magaza_satis_detaylari_view AS
SELECT
    s.id AS satis_id,
    s.magaza_giris_tarihi AS satis_tarihi,
    s.magaza_id,
    m.magaza_adi,
    s.rehber_id,
    r.rehber_adi,
    s.grup_pax,
    s.magaza_pax,
    u.id AS urun_id,
    u.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    (msk.adet * msk.birim_fiyat) AS toplam_satis,
    (msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100) AS acente_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100) AS rehber_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100) AS kaptan_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) AS ofis_komisyon_tutari,
    msk.status,
    msk.satis_aciklamasi
FROM
    public.satislar s
JOIN 
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.urunler u ON msk.urun_id = u.id;

-- Tüm view'lara izinleri ver
GRANT SELECT ON public.satislar_detay_view TO authenticated;
GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
GRANT SELECT ON public.magaza_muhasebe_satis_detay_view TO authenticated;
GRANT SELECT ON public.magaza_satis_detaylari_view TO authenticated;

-- View'lara yorum ekle
COMMENT ON VIEW public.satislar_detay_view IS 'Satış detayları - mağaza ve rehber kalemleri birleşik, iptal durumu dahil';
COMMENT ON VIEW public.magaza_muhasebe_summary_view IS 'Mağaza muhasebe özeti - iptal ürünler hariç toplamlar';
COMMENT ON VIEW public.magaza_muhasebe_satis_detay_view IS 'Mağaza muhasebe detay sayfası için özel view';
COMMENT ON VIEW public.magaza_satis_detaylari_view IS 'Mağaza satış detayları - sadece mağaza kalemleri';
