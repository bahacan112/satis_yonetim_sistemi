-- scripts/154-fix-magaza-muhasebe-summary-view-onaylandi-only.sql
-- magaza_muhasebe_summary_view'ı düzelt - sadece onaylandı durumu

-- Önce mevcut view'ı sil
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view CASCADE;

-- Önce satislar_detay_view'daki sütunları kontrol edelim
DO $$
BEGIN
    RAISE NOTICE 'satislar_detay_view sütunları kontrol ediliyor...';
END $$;

-- magaza_muhasebe_summary_view'ı yeniden oluştur - sadece onaylandı durumu
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
WITH satis_toplamlari AS (
    SELECT
        sd.magaza_id,
        -- Sadece onaylandı durumundaki satışları hesapla
        SUM(CASE WHEN sd.status = 'onaylandı' THEN sd.toplam_tutar ELSE 0 END) AS toplam_satis_tutari,
        SUM(CASE WHEN sd.status = 'onaylandı' THEN sd.acente_komisyon_tutari ELSE 0 END) AS toplam_komisyon_tutari,
        SUM(CASE WHEN sd.status = 'onaylandı' THEN sd.ofis_komisyon_tutari ELSE 0 END) AS toplam_ofis_komisyonu,
        COUNT(CASE WHEN sd.status = 'onaylandı' THEN 1 END) AS onaylanan_kalem_sayisi,
        COUNT(CASE WHEN sd.status = 'beklemede' THEN 1 END) AS bekleyen_kalem_sayisi,
        COUNT(CASE WHEN sd.status = 'iptal' THEN 1 END) AS iptal_kalem_sayisi,
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
        COALESCE(SUM(t.acente_payi), 0) AS toplam_acente_tahsilat,
        COALESCE(SUM(t.ofis_payi), 0) AS toplam_ofis_tahsilat,
        COALESCE(SUM(t.acente_payi + t.ofis_payi), 0) AS toplam_tahsilat,
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
    COALESCE(f.firma_adi, 'Firma Yok') AS firma_adi,
    -- Satış toplamları (sadece onaylandı)
    COALESCE(st.toplam_satis_tutari, 0) AS toplam_satis_tutari,
    COALESCE(st.toplam_komisyon_tutari, 0) AS toplam_komisyon_tutari,
    COALESCE(st.toplam_ofis_komisyonu, 0) AS toplam_ofis_komisyonu,
    -- Tahsilat toplamları
    COALESCE(tt.toplam_acente_tahsilat, 0) AS toplam_acente_tahsilat,
    COALESCE(tt.toplam_ofis_tahsilat, 0) AS toplam_ofis_tahsilat,
    COALESCE(tt.toplam_tahsilat, 0) AS toplam_tahsilat,
    -- Kalan bakiye (sadece onaylandı satışlar - tahsilatlar)
    COALESCE(st.toplam_satis_tutari, 0) - COALESCE(tt.toplam_tahsilat, 0) AS kalan_bakiye,
    -- Kalem sayıları
    COALESCE(st.onaylanan_kalem_sayisi, 0) AS onaylanan_kalem_sayisi,
    COALESCE(st.bekleyen_kalem_sayisi, 0) AS bekleyen_kalem_sayisi,
    COALESCE(st.iptal_kalem_sayisi, 0) AS iptal_kalem_sayisi,
    COALESCE(st.toplam_kalem_sayisi, 0) AS toplam_kalem_sayisi,
    -- Tahsilat bilgileri
    COALESCE(tt.tahsilat_sayisi, 0) AS tahsilat_sayisi,
    tt.son_tahsilat_tarihi
FROM
    public.magazalar m
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    satis_toplamlari st ON m.id = st.magaza_id
LEFT JOIN
    tahsilat_toplamlari tt ON m.id = tt.magaza_id
ORDER BY
    m.magaza_adi;

-- View'a izin ver
GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;

-- View'a yorum ekle
COMMENT ON VIEW public.magaza_muhasebe_summary_view IS 'Mağaza muhasebe özeti - sadece onaylandı durumundaki satışlar hesaba katılır';

-- Test sorgusu - sütun adlarını kontrol et
SELECT 
    'View oluşturuldu' as durum,
    COUNT(*) as magaza_sayisi,
    SUM(toplam_satis_tutari) as toplam_satis,
    SUM(toplam_komisyon_tutari) as toplam_komisyon,
    SUM(toplam_tahsilat) as toplam_tahsilat
FROM public.magaza_muhasebe_summary_view;

-- Detaylı test - hangi mağazalarda veri var
SELECT 
    magaza_adi,
    toplam_satis_tutari,
    toplam_komisyon_tutari,
    toplam_ofis_komisyonu,
    toplam_acente_tahsilat,
    toplam_ofis_tahsilat,
    toplam_tahsilat,
    kalan_bakiye,
    onaylanan_kalem_sayisi,
    bekleyen_kalem_sayisi,
    iptal_kalem_sayisi
FROM public.magaza_muhasebe_summary_view
WHERE toplam_satis_tutari > 0 OR toplam_tahsilat > 0
ORDER BY magaza_adi;
