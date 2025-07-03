-- Önce magazalar tablosunun yapısını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'magazalar'
ORDER BY ordinal_position;

-- Magazalar tablosundaki verileri de kontrol et
SELECT * FROM magazalar LIMIT 3;

-- Mevcut view'ı sil
DROP VIEW IF EXISTS magaza_muhasebe_summary_view CASCADE;

-- Doğru sütun adlarıyla view'ı oluştur
CREATE VIEW magaza_muhasebe_summary_view AS
WITH magaza_satis_ozet AS (
  SELECT 
    m.id as magaza_id,
    COALESCE(m.ad, m.name, 'Bilinmeyen Mağaza') as magaza_adi, -- Farklı sütun adlarını dene
    COALESCE(f.adi, f.ad, f.name, 'Bilinmeyen Firma') as firma_adi, -- Farklı sütun adlarını dene
    
    -- Onaylandı satışlar (ana hesaplamalar)
    COALESCE(SUM(CASE WHEN msk.status = 'onaylandi' THEN msk.birim_fiyat * msk.adet ELSE 0 END), 0) as toplam_satis_tutari,
    COALESCE(SUM(CASE WHEN msk.status = 'onaylandi' THEN msk.acente_komisyon_tutari ELSE 0 END), 0) as toplam_komisyon_tutari,
    COALESCE(SUM(CASE WHEN msk.status = 'onaylandi' THEN msk.ofis_komisyonu ELSE 0 END), 0) as toplam_ofis_komisyonu,
    
    -- Bekleyen satışlar (ayrı gösterim)
    COALESCE(SUM(CASE WHEN msk.status = 'beklemede' THEN msk.birim_fiyat * msk.adet ELSE 0 END), 0) as bekleyen_satis_tutari,
    COALESCE(SUM(CASE WHEN msk.status = 'beklemede' THEN msk.acente_komisyon_tutari ELSE 0 END), 0) as bekleyen_komisyon_tutari,
    COALESCE(SUM(CASE WHEN msk.status = 'beklemede' THEN msk.ofis_komisyonu ELSE 0 END), 0) as bekleyen_ofis_komisyonu,
    
    -- İptal satışlar (bilgi için)
    COALESCE(SUM(CASE WHEN msk.status = 'iptal' THEN msk.birim_fiyat * msk.adet ELSE 0 END), 0) as iptal_satis_tutari,
    
    -- Kalem sayıları
    COUNT(CASE WHEN msk.status = 'onaylandi' THEN 1 END) as onaylanan_kalem_sayisi,
    COUNT(CASE WHEN msk.status = 'beklemede' THEN 1 END) as bekleyen_kalem_sayisi,
    COUNT(CASE WHEN msk.status = 'iptal' THEN 1 END) as iptal_kalem_sayisi,
    COUNT(msk.id) as toplam_kalem_sayisi
    
  FROM magazalar m
  LEFT JOIN firmalar f ON m.firma_id = f.id
  LEFT JOIN satislar s ON m.id = s.magaza_id
  LEFT JOIN magaza_satis_kalemleri msk ON s.id = msk.satis_id
  GROUP BY m.id, m.ad, m.name, f.adi, f.ad, f.name
),
tahsilat_ozet AS (
  SELECT 
    t.magaza_id,
    COALESCE(SUM(CASE WHEN t.tahsilat_turu = 'acente' THEN t.tutar ELSE 0 END), 0) as toplam_acente_tahsilat,
    COALESCE(SUM(CASE WHEN t.tahsilat_turu = 'ofis' THEN t.tutar ELSE 0 END), 0) as toplam_ofis_tahsilat,
    COALESCE(SUM(t.tutar), 0) as toplam_tahsilat
  FROM tahsilatlar t
  GROUP BY t.magaza_id
)
SELECT 
  mso.magaza_id,
  mso.magaza_adi,
  mso.firma_adi,
  
  -- Ana hesaplamalar (sadece onaylandı)
  mso.toplam_satis_tutari,
  mso.toplam_komisyon_tutari,
  mso.toplam_ofis_komisyonu,
  
  -- Bekleyen satışlar
  mso.bekleyen_satis_tutari,
  mso.bekleyen_komisyon_tutari,
  mso.bekleyen_ofis_komisyonu,
  
  -- İptal satışlar
  mso.iptal_satis_tutari,
  
  -- Tahsilat bilgileri
  COALESCE(toz.toplam_acente_tahsilat, 0) as toplam_acente_tahsilat,
  COALESCE(toz.toplam_ofis_tahsilat, 0) as toplam_ofis_tahsilat,
  COALESCE(toz.toplam_tahsilat, 0) as toplam_tahsilat,
  
  -- Kalan bakiye (sadece onaylandı satışlar üzerinden)
  (mso.toplam_satis_tutari - COALESCE(toz.toplam_tahsilat, 0)) as kalan_bakiye,
  
  -- Kalem sayıları
  mso.onaylanan_kalem_sayisi,
  mso.bekleyen_kalem_sayisi,
  mso.iptal_kalem_sayisi,
  mso.toplam_kalem_sayisi

FROM magaza_satis_ozet mso
LEFT JOIN tahsilat_ozet toz ON mso.magaza_id = toz.magaza_id
ORDER BY mso.magaza_adi;

-- View'ın çalışıp çalışmadığını test et
SELECT 
  'View oluşturuldu' as durum,
  COUNT(*) as magaza_sayisi,
  SUM(toplam_satis_tutari) as toplam_onaylandi_satis,
  SUM(bekleyen_satis_tutari) as toplam_bekleyen_satis,
  SUM(iptal_satis_tutari) as toplam_iptal_satis
FROM magaza_muhasebe_summary_view;

-- İlk 3 kaydı göster
SELECT * FROM magaza_muhasebe_summary_view LIMIT 3;
