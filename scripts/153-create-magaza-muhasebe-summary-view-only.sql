-- scripts/153-create-magaza-muhasebe-summary-view-only.sql
-- Sadece magaza_muhasebe_summary_view'ı oluştur

-- Önce mevcut view'ı sil (varsa)
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view CASCADE;

-- magaza_muhasebe_summary_view'ı oluştur
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
    -- Satış toplamları (iptal hariç)
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
    -- Kalan bakiye hesaplaması (iptal hariç satışlar - tahsilatlar)
    COALESCE(st.toplam_satis_tutari, 0) - COALESCE(tt.toplam_tahsilat_tutari, 0) AS kalan_bakiye
FROM
    public.magazalar m
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    satis_toplamlari st ON m.id = st.magaza_id
LEFT JOIN
    tahsilat_toplamlari tt ON m.id = tt.magaza_id;

-- View'a izin ver
GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;

-- View'a yorum ekle
COMMENT ON VIEW public.magaza_muhasebe_summary_view IS 'Mağaza muhasebe özeti - iptal durumundaki ürünler toplam hesaplamalardan hariç tutulur';

-- Test sorgusu
SELECT 
    'magaza_muhasebe_summary_view oluşturuldu' as durum,
    COUNT(*) as magaza_sayisi 
FROM public.magaza_muhasebe_summary_view;
