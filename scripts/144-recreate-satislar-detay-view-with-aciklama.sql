-- Bağımlı view'ları sil
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view;
DROP VIEW IF EXISTS public.bildirim_karsilastirma;
DROP VIEW IF EXISTS public.satislar_detay_view;

-- satislar_detay_view'i yeni satis_aciklamasi sütunu ile yeniden oluştur
CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    t.tur_adi AS tur,
    s.created_at,
    op.operator_adi,
    r.rehber_adi,
    m.magaza_adi,
    f.firma_adi,
    f.id as firma_id,
    m.id as magaza_id,
    r.id as rehber_id,
    op.id as operator_id,
    msk.urun_id,
    u.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    msk.ofis_komisyonu,
    (msk.adet * msk.birim_fiyat) AS toplam_tutar,
    (msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100) AS acente_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100) AS rehber_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100) AS kaptan_komisyon_tutari,
    (msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) AS ofis_komisyon_tutari,
    'magaza'::text AS bildirim_tipi,
    msk.status,
    msk.satis_aciklamasi, -- Yeni sütun
    NULL AS rehber_teyyit_edildi,
    NULL AS rehber_teyyit_birim_fiyat,
    NULL AS rehber_teyyit_adet,
    NULL AS rehber_teyyit_toplam_tutar
FROM
    satislar s
JOIN magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN firmalar f ON m.firma_id = f.id
LEFT JOIN turlar t ON s.tur_id = t.id
LEFT JOIN operatorler op ON s.operator_id = op.id
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN urunler u ON msk.urun_id = u.id

UNION ALL

SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    t.tur_adi AS tur,
    s.created_at,
    op.operator_adi,
    r.rehber_adi,
    m.magaza_adi,
    f.firma_adi,
    f.id as firma_id,
    m.id as magaza_id,
    r.id as rehber_id,
    op.id as operator_id,
    rsk.urun_id,
    u.urun_adi,
    rsk.adet,
    rsk.birim_fiyat,
    NULL AS acente_komisyonu,
    NULL AS rehber_komisyonu,
    NULL AS kaptan_komisyonu,
    NULL AS ofis_komisyonu,
    (rsk.adet * rsk.birim_fiyat) AS toplam_tutar,
    NULL AS acente_komisyon_tutari,
    NULL AS rehber_komisyon_tutari,
    NULL AS kaptan_komisyon_tutari,
    NULL AS ofis_komisyon_tutari,
    'rehber'::text AS bildirim_tipi,
    rsk.status,
    rsk.satis_aciklamasi, -- Yeni sütun
    NULL AS rehber_teyyit_edildi,
    NULL AS rehber_teyyit_birim_fiyat,
    NULL AS rehber_teyyit_adet,
    NULL AS rehber_teyyit_toplam_tutar
FROM
    satislar s
JOIN rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN firmalar f ON m.firma_id = f.id
LEFT JOIN turlar t ON s.tur_id = t.id
LEFT JOIN operatorler op ON s.operator_id = op.id
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN urunler u ON rsk.urun_id = u.id;

-- magaza_satis_detaylari_view'i yeniden oluştur
CREATE OR REPLACE VIEW public.magaza_satis_detaylari_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
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
    (msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) AS ofis_komisyon_tutari
FROM
    satislar s
JOIN magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN magazalar m ON s.magaza_id = m.id
LEFT JOIN rehberler r ON s.rehber_id = r.id
LEFT JOIN urunler u ON msk.urun_id = u.id
WHERE msk.status = 'onaylandı';

-- magaza_muhasebe_summary_view'i yeniden oluştur
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
WITH satis_toplamlari AS (
    SELECT
        s.magaza_id,
        SUM(msk.adet * msk.birim_fiyat) AS toplam_satis,
        SUM(msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100) AS toplam_acente_komisyon,
        SUM(msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100) AS toplam_rehber_komisyon,
        SUM(msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100) AS toplam_kaptan_komisyon,
        SUM(msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) AS toplam_ofis_komisyon
    FROM
        satislar s
    JOIN magaza_satis_kalemleri msk ON s.id = msk.satis_id
    WHERE msk.status = 'onaylandı'
    GROUP BY
        s.magaza_id
),
tahsilat_toplamlari AS (
    SELECT
        t.magaza_id,
        SUM(t.tutar) AS toplam_tahsilat
    FROM
        tahsilatlar t
    GROUP BY
        t.magaza_id
)
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    COALESCE(st.toplam_satis, 0) AS toplam_satis,
    COALESCE(st.toplam_acente_komisyon, 0) AS toplam_acente_komisyon,
    COALESCE(st.toplam_rehber_komisyon, 0) AS toplam_rehber_komisyon,
    COALESCE(st.toplam_kaptan_komisyon, 0) AS toplam_kaptan_komisyon,
    COALESCE(st.toplam_ofis_komisyon, 0) AS toplam_ofis_komisyon,
    COALESCE(tt.toplam_tahsilat, 0) AS toplam_tahsilat,
    (COALESCE(st.toplam_satis, 0) - COALESCE(st.toplam_acente_komisyon, 0) - COALESCE(tt.toplam_tahsilat, 0)) AS bakiye
FROM
    magazalar m
LEFT JOIN satis_toplamlari st ON m.id = st.magaza_id
LEFT JOIN tahsilat_toplamlari tt ON m.id = tt.magaza_id;
