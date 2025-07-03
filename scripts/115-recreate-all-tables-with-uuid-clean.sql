-- Tüm tabloları UUID ile yeniden oluştur (veriler silinecek)
-- profiles tablosu korunacak

-- 1. Önce bağımlı view'ları düşür
DROP VIEW IF EXISTS public.satislar_detay_view CASCADE;
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view CASCADE;
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view CASCADE;
DROP VIEW IF EXISTS public.firma_satis_detaylari_view CASCADE;

-- 2. UUID extension'ını etkinleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Tüm tabloları düşür (profiles hariç)
DROP TABLE IF EXISTS public.magaza_satis_kalemleri CASCADE;
DROP TABLE IF EXISTS public.rehber_satis_kalemleri CASCADE;
DROP TABLE IF EXISTS public.tahsilatlar CASCADE;
DROP TABLE IF EXISTS public.satislar CASCADE;
DROP TABLE IF EXISTS public.magaza_urunler CASCADE;
DROP TABLE IF EXISTS public.rehberler CASCADE;
DROP TABLE IF EXISTS public.urunler CASCADE;
DROP TABLE IF EXISTS public.turlar CASCADE;

-- 4. Tabloları UUID ile yeniden oluştur

-- Rehberler tablosu
CREATE TABLE public.rehberler (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rehber_adi VARCHAR(255) NOT NULL,
    telefon VARCHAR(20),
    email VARCHAR(255),
    adres TEXT,
    notlar TEXT,
    aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ürünler tablosu
CREATE TABLE public.urunler (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    urun_adi VARCHAR(255) NOT NULL,
    urun_aciklamasi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turlar tablosu
CREATE TABLE public.turlar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tur_adi VARCHAR(255) NOT NULL,
    tur_aciklamasi TEXT,
    operator_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (operator_id) REFERENCES public.operatorler(id)
);

-- Satışlar tablosu
CREATE TABLE public.satislar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID,
    firma_id UUID,
    grup_gelis_tarihi DATE,
    magaza_giris_tarihi DATE,
    grup_pax INTEGER DEFAULT 0,
    magaza_pax INTEGER DEFAULT 0,
    tur_id UUID,
    rehber_id UUID,
    magaza_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (operator_id) REFERENCES public.operatorler(id),
    FOREIGN KEY (firma_id) REFERENCES public.firmalar(id),
    FOREIGN KEY (tur_id) REFERENCES public.turlar(id),
    FOREIGN KEY (rehber_id) REFERENCES public.rehberler(id),
    FOREIGN KEY (magaza_id) REFERENCES public.magazalar(id)
);

-- Tahsilatlar tablosu
CREATE TABLE public.tahsilatlar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    magaza_id UUID NOT NULL,
    tahsilat_tarihi DATE NOT NULL,
    odeme_kanali VARCHAR(100) NOT NULL,
    acente_payi DECIMAL(15,2) DEFAULT 0,
    ofis_payi DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (magaza_id) REFERENCES public.magazalar(id)
);

-- Mağaza satış kalemleri tablosu
CREATE TABLE public.magaza_satis_kalemleri (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    satis_id UUID NOT NULL,
    urun_id UUID NOT NULL,
    adet INTEGER DEFAULT 0,
    birim_fiyat DECIMAL(10,2) DEFAULT 0,
    acente_komisyonu DECIMAL(5,2) DEFAULT 0,
    rehber_komisyonu DECIMAL(5,2) DEFAULT 0,
    kaptan_komisyonu DECIMAL(5,2) DEFAULT 0,
    ofis_komisyonu DECIMAL(5,2) DEFAULT 0,
    bekleme BOOLEAN DEFAULT FALSE,
    vade_tarihi DATE,
    status VARCHAR(20) DEFAULT 'onaylandı',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (satis_id) REFERENCES public.satislar(id) ON DELETE CASCADE,
    FOREIGN KEY (urun_id) REFERENCES public.urunler(id) ON DELETE CASCADE
);

-- Rehber satış kalemleri tablosu
CREATE TABLE public.rehber_satis_kalemleri (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    satis_id UUID NOT NULL,
    urun_id UUID NOT NULL,
    adet INTEGER DEFAULT 0,
    birim_fiyat DECIMAL(10,2) DEFAULT 0,
    bekleme BOOLEAN DEFAULT FALSE,
    vade_tarihi DATE,
    status VARCHAR(20) DEFAULT 'onaylandı',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (satis_id) REFERENCES public.satislar(id) ON DELETE CASCADE,
    FOREIGN KEY (urun_id) REFERENCES public.urunler(id) ON DELETE CASCADE
);

-- Mağaza ürünler tablosu
CREATE TABLE public.magaza_urunler (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    magaza_id UUID NOT NULL,
    urun_id UUID NOT NULL,
    acente_komisyonu DECIMAL(5,2) DEFAULT 0,
    rehber_komisyonu DECIMAL(5,2) DEFAULT 0,
    kaptan_komisyonu DECIMAL(5,2) DEFAULT 0,
    ofis_komisyonu DECIMAL(5,2) DEFAULT 0,
    aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (magaza_id) REFERENCES public.magazalar(id) ON DELETE CASCADE,
    FOREIGN KEY (urun_id) REFERENCES public.urunler(id) ON DELETE CASCADE,
    UNIQUE(magaza_id, urun_id)
);

-- 5. İndeksleri oluştur
CREATE INDEX idx_magaza_satis_kalemleri_satis_id ON public.magaza_satis_kalemleri(satis_id);
CREATE INDEX idx_magaza_satis_kalemleri_urun_id ON public.magaza_satis_kalemleri(urun_id);
CREATE INDEX idx_rehber_satis_kalemleri_satis_id ON public.rehber_satis_kalemleri(satis_id);
CREATE INDEX idx_rehber_satis_kalemleri_urun_id ON public.rehber_satis_kalemleri(urun_id);
CREATE INDEX idx_satislar_tur_id ON public.satislar(tur_id);
CREATE INDEX idx_satislar_rehber_id ON public.satislar(rehber_id);
CREATE INDEX idx_satislar_magaza_id ON public.satislar(magaza_id);
CREATE INDEX idx_satislar_firma_id ON public.satislar(firma_id);
CREATE INDEX idx_satislar_operator_id ON public.satislar(operator_id);
CREATE INDEX idx_magaza_urunler_magaza_id ON public.magaza_urunler(magaza_id);
CREATE INDEX idx_magaza_urunler_urun_id ON public.magaza_urunler(urun_id);
CREATE INDEX idx_tahsilatlar_magaza_id ON public.tahsilatlar(magaza_id);
CREATE INDEX idx_turlar_operator_id ON public.turlar(operator_id);

-- 6. RLS politikalarını etkinleştir
ALTER TABLE public.rehberler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urunler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satislar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahsilatlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magaza_satis_kalemleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehber_satis_kalemleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magaza_urunler ENABLE ROW LEVEL SECURITY;

-- 7. RLS politikalarını oluştur (basit - tüm authenticated kullanıcılar)
CREATE POLICY "Allow all for authenticated users" ON public.rehberler FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.urunler FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.turlar FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.satislar FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.tahsilatlar FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.magaza_satis_kalemleri FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.rehber_satis_kalemleri FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.magaza_urunler FOR ALL TO authenticated USING (true);

-- 8. Ana view'ı yeniden oluştur
CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.magaza_giris_tarihi AS satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.tur_id,
    t.tur_adi AS tur,
    s.rehber_id,
    r.rehber_adi,
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.operator_id,
    o.operator_adi,
    msk.id AS kalem_id,
    msk.urun_id,
    u_msk.urun_adi,
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
    msk.bekleme,
    msk.vade_tarihi,
    msk.status,
    s.created_at,
    'magaza' AS bildirim_tipi,
    CASE
        WHEN msk.bekleme = TRUE THEN 'Uyumsuz'
        ELSE 'Uyumlu'
    END AS uyum_durumu
FROM
    public.satislar s
LEFT JOIN
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.urunler u_msk ON msk.urun_id = u_msk.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.operatorler o ON s.operator_id = o.id
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
    s.tur_id,
    t.tur_adi AS tur,
    s.rehber_id,
    r.rehber_adi,
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.operator_id,
    o.operator_adi,
    rsk.id AS kalem_id,
    rsk.urun_id,
    u_rsk.urun_adi,
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
    rsk.bekleme,
    rsk.vade_tarihi,
    rsk.status,
    s.created_at,
    'rehber' AS bildirim_tipi,
    CASE
        WHEN rsk.bekleme = TRUE THEN 'Uyumsuz'
        ELSE 'Uyumlu'
    END AS uyum_durumu
FROM
    public.satislar s
LEFT JOIN
    public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.urunler u_rsk ON rsk.urun_id = u_rsk.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.operatorler o ON s.operator_id = o.id
WHERE
    rsk.id IS NOT NULL;

-- Grant permissions
GRANT SELECT ON public.satislar_detay_view TO authenticated;

-- 9. Basit muhasebe view'ı oluştur
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    COALESCE(SUM(msk.adet * msk.birim_fiyat), 0) AS toplam_satis,
    COALESCE(SUM(msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100), 0) AS toplam_acente_komisyonu,
    COALESCE(SUM(msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100), 0) AS toplam_rehber_komisyonu,
    COALESCE(SUM(msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100), 0) AS toplam_kaptan_komisyonu,
    COALESCE(SUM(msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100), 0) AS toplam_ofis_komisyonu,
    COALESCE(SUM(t.acente_payi + t.ofis_payi), 0) AS toplam_tahsilat,
    COUNT(DISTINCT s.id) AS toplam_satis_sayisi
FROM
    public.magazalar m
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.satislar s ON m.id = s.magaza_id
LEFT JOIN
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.tahsilatlar t ON m.id = t.magaza_id
GROUP BY
    m.id, m.magaza_adi, m.firma_id, f.firma_adi;

-- Grant permissions
GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
