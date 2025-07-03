-- Bu script tüm belirtilen tabloların ID alanlarını UUID'ye dönüştürür
-- UYARI: Bu işlem geri alınamaz ve mevcut verileri etkileyebilir

-- 1. Önce bağımlı view'ları düşür
DROP VIEW IF EXISTS public.satislar_detay_view;
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view;
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;
DROP VIEW IF EXISTS public.firma_satis_detaylari_view;

-- 2. Foreign key constraint'leri düşür
ALTER TABLE magaza_satis_kalemleri DROP CONSTRAINT IF EXISTS magaza_satis_kalemleri_satis_id_fkey;
ALTER TABLE magaza_satis_kalemleri DROP CONSTRAINT IF EXISTS magaza_satis_kalemleri_urun_id_fkey;
ALTER TABLE rehber_satis_kalemleri DROP CONSTRAINT IF EXISTS rehber_satis_kalemleri_satis_id_fkey;
ALTER TABLE rehber_satis_kalemleri DROP CONSTRAINT IF EXISTS rehber_satis_kalemleri_urun_id_fkey;
ALTER TABLE satislar DROP CONSTRAINT IF EXISTS satislar_tur_id_fkey;
ALTER TABLE satislar DROP CONSTRAINT IF EXISTS satislar_rehber_id_fkey;
ALTER TABLE magaza_urunler DROP CONSTRAINT IF EXISTS magaza_urunler_urun_id_fkey;
ALTER TABLE tahsilatlar DROP CONSTRAINT IF EXISTS tahsilatlar_magaza_id_fkey;

-- 3. UUID extension'ını etkinleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 4. Yedek tablolar oluştur (güvenlik için)
CREATE TABLE IF NOT EXISTS magaza_satis_kalemleri_backup AS SELECT * FROM magaza_satis_kalemleri;
CREATE TABLE IF NOT EXISTS rehberler_backup AS SELECT * FROM rehberler;
CREATE TABLE IF NOT EXISTS urunler_backup AS SELECT * FROM urunler;
CREATE TABLE IF NOT EXISTS satislar_backup AS SELECT * FROM satislar;
CREATE TABLE IF NOT EXISTS tahsilatlar_backup AS SELECT * FROM tahsilatlar;
CREATE TABLE IF NOT EXISTS rehber_satis_kalemleri_backup AS SELECT * FROM rehber_satis_kalemleri;
CREATE TABLE IF NOT EXISTS turlar_backup AS SELECT * FROM turlar;
CREATE TABLE IF NOT EXISTS magaza_urunler_backup AS SELECT * FROM magaza_urunler;

-- 5. Mapping tabloları oluştur (eski ID -> yeni UUID)
CREATE TABLE IF NOT EXISTS id_mapping_rehberler (
    old_id INTEGER,
    new_id UUID DEFAULT uuid_generate_v4()
);

CREATE TABLE IF NOT EXISTS id_mapping_urunler (
    old_id INTEGER,
    new_id UUID DEFAULT uuid_generate_v4()
);

CREATE TABLE IF NOT EXISTS id_mapping_satislar (
    old_id INTEGER,
    new_id UUID DEFAULT uuid_generate_v4()
);

CREATE TABLE IF NOT EXISTS id_mapping_tahsilatlar (
    old_id INTEGER,
    new_id UUID DEFAULT uuid_generate_v4()
);

CREATE TABLE IF NOT EXISTS id_mapping_turlar (
    old_id INTEGER,
    new_id UUID DEFAULT uuid_generate_v4()
);

CREATE TABLE IF NOT EXISTS id_mapping_magaza_satis_kalemleri (
    old_id INTEGER,
    new_id UUID DEFAULT uuid_generate_v4()
);

CREATE TABLE IF NOT EXISTS id_mapping_rehber_satis_kalemleri (
    old_id INTEGER,
    new_id UUID DEFAULT uuid_generate_v4()
);

CREATE TABLE IF NOT EXISTS id_mapping_magaza_urunler (
    old_id INTEGER,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- 6. Mapping tablolarını doldur
INSERT INTO id_mapping_rehberler (old_id) SELECT id FROM rehberler ON CONFLICT DO NOTHING;
INSERT INTO id_mapping_urunler (old_id) SELECT id FROM urunler ON CONFLICT DO NOTHING;
INSERT INTO id_mapping_satislar (old_id) SELECT id FROM satislar ON CONFLICT DO NOTHING;
INSERT INTO id_mapping_tahsilatlar (old_id) SELECT id FROM tahsilatlar ON CONFLICT DO NOTHING;
INSERT INTO id_mapping_turlar (old_id) SELECT id FROM turlar ON CONFLICT DO NOTHING;
INSERT INTO id_mapping_magaza_satis_kalemleri (old_id) SELECT id FROM magaza_satis_kalemleri ON CONFLICT DO NOTHING;
INSERT INTO id_mapping_rehber_satis_kalemleri (old_id) SELECT id FROM rehber_satis_kalemleri ON CONFLICT DO NOTHING;
INSERT INTO id_mapping_magaza_urunler (old_id) SELECT id FROM magaza_urunler ON CONFLICT DO NOTHING;

-- 7. Yeni tablolar oluştur (UUID ID'li)
CREATE TABLE rehberler_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rehber_adi VARCHAR(255) NOT NULL,
    telefon VARCHAR(20),
    email VARCHAR(255),
    adres TEXT,
    notlar TEXT,
    aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE urunler_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    urun_adi VARCHAR(255) NOT NULL,
    urun_aciklamasi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE turlar_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tur_adi VARCHAR(255) NOT NULL,
    tur_aciklamasi TEXT,
    operator_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE satislar_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID,
    firma_id UUID,
    grup_gelis_tarihi DATE,
    magaza_giris_tarihi DATE,
    satis_tarihi DATE,
    grup_pax INTEGER DEFAULT 0,
    magaza_pax INTEGER DEFAULT 0,
    tur_id UUID,
    rehber_id UUID,
    magaza_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tahsilatlar_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    magaza_id UUID NOT NULL,
    tahsilat_tarihi DATE NOT NULL,
    odeme_kanali VARCHAR(100) NOT NULL,
    acente_payi DECIMAL(15,2) DEFAULT 0,
    ofis_payi DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE magaza_satis_kalemleri_new (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rehber_satis_kalemleri_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    satis_id UUID NOT NULL,
    urun_id UUID NOT NULL,
    adet INTEGER DEFAULT 0,
    birim_fiyat DECIMAL(10,2) DEFAULT 0,
    bekleme BOOLEAN DEFAULT FALSE,
    vade_tarihi DATE,
    status VARCHAR(20) DEFAULT 'onaylandı',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE magaza_urunler_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    magaza_id UUID NOT NULL,
    urun_id UUID NOT NULL,
    acente_komisyonu DECIMAL(5,2) DEFAULT 0,
    rehber_komisyonu DECIMAL(5,2) DEFAULT 0,
    kaptan_komisyonu DECIMAL(5,2) DEFAULT 0,
    ofis_komisyonu DECIMAL(5,2) DEFAULT 0,
    aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Verileri yeni tablolara kopyala
INSERT INTO rehberler_new (id, rehber_adi, telefon, email, adres, notlar, aktif, created_at)
SELECT 
    m.new_id,
    r.rehber_adi,
    r.telefon,
    r.email,
    r.adres,
    r.notlar,
    r.aktif,
    r.created_at
FROM rehberler r
JOIN id_mapping_rehberler m ON r.id = m.old_id;

INSERT INTO urunler_new (id, urun_adi, urun_aciklamasi, created_at)
SELECT 
    m.new_id,
    u.urun_adi,
    u.urun_aciklamasi,
    u.created_at
FROM urunler u
JOIN id_mapping_urunler m ON u.id = m.old_id;

INSERT INTO turlar_new (id, tur_adi, tur_aciklamasi, operator_id, created_at)
SELECT 
    m.new_id,
    t.tur_adi,
    t.tur_aciklamasi,
    t.operator_id,
    t.created_at
FROM turlar t
JOIN id_mapping_turlar m ON t.id = m.old_id;

INSERT INTO satislar_new (id, operator_id, firma_id, grup_gelis_tarihi, magaza_giris_tarihi, satis_tarihi, grup_pax, magaza_pax, tur_id, rehber_id, magaza_id, created_at)
SELECT 
    ms.new_id,
    s.operator_id,
    s.firma_id,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.satis_tarihi,
    s.grup_pax,
    s.magaza_pax,
    mt.new_id,
    mr.new_id,
    s.magaza_id,
    s.created_at
FROM satislar s
JOIN id_mapping_satislar ms ON s.id = ms.old_id
LEFT JOIN id_mapping_turlar mt ON s.tur_id = mt.old_id
LEFT JOIN id_mapping_rehberler mr ON s.rehber_id = mr.old_id;

INSERT INTO tahsilatlar_new (id, magaza_id, tahsilat_tarihi, odeme_kanali, acente_payi, ofis_payi, created_at)
SELECT 
    m.new_id,
    t.magaza_id,
    t.tahsilat_tarihi,
    t.odeme_kanali,
    t.acente_payi,
    t.ofis_payi,
    t.created_at
FROM tahsilatlar t
JOIN id_mapping_tahsilatlar m ON t.id = m.old_id;

INSERT INTO magaza_satis_kalemleri_new (id, satis_id, urun_id, adet, birim_fiyat, acente_komisyonu, rehber_komisyonu, kaptan_komisyonu, ofis_komisyonu, bekleme, vade_tarihi, status, created_at)
SELECT 
    mmsk.new_id,
    ms.new_id,
    mu.new_id,
    msk.adet,
    msk.birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    msk.ofis_komisyonu,
    msk.bekleme,
    msk.vade_tarihi,
    msk.status,
    msk.created_at
FROM magaza_satis_kalemleri msk
JOIN id_mapping_magaza_satis_kalemleri mmsk ON msk.id = mmsk.old_id
JOIN id_mapping_satislar ms ON msk.satis_id = ms.old_id
JOIN id_mapping_urunler mu ON msk.urun_id = mu.old_id;

INSERT INTO rehber_satis_kalemleri_new (id, satis_id, urun_id, adet, birim_fiyat, bekleme, vade_tarihi, status, created_at)
SELECT 
    mrsk.new_id,
    ms.new_id,
    mu.new_id,
    rsk.adet,
    rsk.birim_fiyat,
    rsk.bekleme,
    rsk.vade_tarihi,
    rsk.status,
    rsk.created_at
FROM rehber_satis_kalemleri rsk
JOIN id_mapping_rehber_satis_kalemleri mrsk ON rsk.id = mrsk.old_id
JOIN id_mapping_satislar ms ON rsk.satis_id = ms.old_id
JOIN id_mapping_urunler mu ON rsk.urun_id = mu.old_id;

INSERT INTO magaza_urunler_new (id, magaza_id, urun_id, acente_komisyonu, rehber_komisyonu, kaptan_komisyonu, ofis_komisyonu, aktif, created_at)
SELECT 
    mmu.new_id,
    mu_old.magaza_id,
    mu_new.new_id,
    mu_old.acente_komisyonu,
    mu_old.rehber_komisyonu,
    mu_old.kaptan_komisyonu,
    mu_old.ofis_komisyonu,
    mu_old.aktif,
    mu_old.created_at
FROM magaza_urunler mu_old
JOIN id_mapping_magaza_urunler mmu ON mu_old.id = mmu.old_id
JOIN id_mapping_urunler mu_new ON mu_old.urun_id = mu_new.old_id;

-- 9. Eski tabloları düşür ve yenilerini yeniden adlandır
DROP TABLE magaza_satis_kalemleri CASCADE;
DROP TABLE rehber_satis_kalemleri CASCADE;
DROP TABLE rehberler CASCADE;
DROP TABLE urunler CASCADE;
DROP TABLE satislar CASCADE;
DROP TABLE tahsilatlar CASCADE;
DROP TABLE turlar CASCADE;
DROP TABLE magaza_urunler CASCADE;

ALTER TABLE rehberler_new RENAME TO rehberler;
ALTER TABLE urunler_new RENAME TO urunler;
ALTER TABLE turlar_new RENAME TO turlar;
ALTER TABLE satislar_new RENAME TO satislar;
ALTER TABLE tahsilatlar_new RENAME TO tahsilatlar;
ALTER TABLE magaza_satis_kalemleri_new RENAME TO magaza_satis_kalemleri;
ALTER TABLE rehber_satis_kalemleri_new RENAME TO rehber_satis_kalemleri;
ALTER TABLE magaza_urunler_new RENAME TO magaza_urunler;

-- 10. Foreign key constraint'leri yeniden oluştur
ALTER TABLE magaza_satis_kalemleri ADD CONSTRAINT magaza_satis_kalemleri_satis_id_fkey FOREIGN KEY (satis_id) REFERENCES satislar(id) ON DELETE CASCADE;
ALTER TABLE magaza_satis_kalemleri ADD CONSTRAINT magaza_satis_kalemleri_urun_id_fkey FOREIGN KEY (urun_id) REFERENCES urunler(id) ON DELETE CASCADE;
ALTER TABLE rehber_satis_kalemleri ADD CONSTRAINT rehber_satis_kalemleri_satis_id_fkey FOREIGN KEY (satis_id) REFERENCES satislar(id) ON DELETE CASCADE;
ALTER TABLE rehber_satis_kalemleri ADD CONSTRAINT rehber_satis_kalemleri_urun_id_fkey FOREIGN KEY (urun_id) REFERENCES urunler(id) ON DELETE CASCADE;
ALTER TABLE satislar ADD CONSTRAINT satislar_tur_id_fkey FOREIGN KEY (tur_id) REFERENCES turlar(id);
ALTER TABLE satislar ADD CONSTRAINT satislar_rehber_id_fkey FOREIGN KEY (rehber_id) REFERENCES rehberler(id);
ALTER TABLE magaza_urunler ADD CONSTRAINT magaza_urunler_urun_id_fkey FOREIGN KEY (urun_id) REFERENCES urunler(id) ON DELETE CASCADE;

-- 11. İndeksleri yeniden oluştur
CREATE INDEX IF NOT EXISTS idx_magaza_satis_kalemleri_satis_id ON magaza_satis_kalemleri(satis_id);
CREATE INDEX IF NOT EXISTS idx_magaza_satis_kalemleri_urun_id ON magaza_satis_kalemleri(urun_id);
CREATE INDEX IF NOT EXISTS idx_rehber_satis_kalemleri_satis_id ON rehber_satis_kalemleri(satis_id);
CREATE INDEX IF NOT EXISTS idx_rehber_satis_kalemleri_urun_id ON rehber_satis_kalemleri(urun_id);
CREATE INDEX IF NOT EXISTS idx_satislar_tur_id ON satislar(tur_id);
CREATE INDEX IF NOT EXISTS idx_satislar_rehber_id ON satislar(rehber_id);
CREATE INDEX IF NOT EXISTS idx_satislar_magaza_id ON satislar(magaza_id);
CREATE INDEX IF NOT EXISTS idx_magaza_urunler_magaza_id ON magaza_urunler(magaza_id);
CREATE INDEX IF NOT EXISTS idx_magaza_urunler_urun_id ON magaza_urunler(urun_id);
CREATE INDEX IF NOT EXISTS idx_tahsilatlar_magaza_id ON tahsilatlar(magaza_id);

-- 12. RLS politikalarını yeniden oluştur
ALTER TABLE rehberler ENABLE ROW LEVEL SECURITY;
ALTER TABLE urunler ENABLE ROW LEVEL SECURITY;
ALTER TABLE turlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE satislar ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahsilatlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE magaza_satis_kalemleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehber_satis_kalemleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE magaza_urunler ENABLE ROW LEVEL SECURITY;

-- Basit politikalar (tüm authenticated kullanıcılar için)
CREATE POLICY "Allow all for authenticated users" ON rehberler FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON urunler FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON turlar FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON satislar FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON tahsilatlar FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON magaza_satis_kalemleri FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON rehber_satis_kalemleri FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON magaza_urunler FOR ALL TO authenticated USING (true);

-- 13. View'ları yeniden oluştur (basitleştirilmiş)
CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
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
    s.satis_tarihi,
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

-- Temizlik: Mapping tablolarını sil (isteğe bağlı)
-- DROP TABLE id_mapping_rehberler;
-- DROP TABLE id_mapping_urunler;
-- DROP TABLE id_mapping_satislar;
-- DROP TABLE id_mapping_tahsilatlar;
-- DROP TABLE id_mapping_turlar;
-- DROP TABLE id_mapping_magaza_satis_kalemleri;
-- DROP TABLE id_mapping_rehber_satis_kalemleri;
-- DROP TABLE id_mapping_magaza_urunler;
