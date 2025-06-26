-- Eski satışlar tablosunu geri yükle ve rehber bildirimleri için ayrı tablo oluştur

-- 1. Önce mevcut satışlar tablosunu yedekle
CREATE TABLE IF NOT EXISTS satislar_backup AS SELECT * FROM satislar;

-- 2. Satışlar tablosunu eski haline döndür (ürün bazında)
DROP TABLE IF EXISTS satislar CASCADE;

CREATE TABLE satislar (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER REFERENCES operatorler(id),
    firma_id INTEGER REFERENCES firmalar(id),
    grup_gelis_tarihi DATE,
    magaza_giris_tarihi DATE,
    satis_tarihi DATE,
    grup_pax INTEGER DEFAULT 0,
    magaza_pax INTEGER DEFAULT 0,
    tur TEXT,
    rehber_id INTEGER REFERENCES rehberler(id),
    magaza_id INTEGER REFERENCES magazalar(id),
    urun_id INTEGER REFERENCES urunler(id),
    adet INTEGER DEFAULT 1,
    birim_fiyat DECIMAL(10,2) DEFAULT 0,
    acente_komisyonu DECIMAL(5,2) DEFAULT 0,
    rehber_komisyonu DECIMAL(5,2) DEFAULT 0,
    kaptan_komisyonu DECIMAL(5,2) DEFAULT 0,
    satis_tutari DECIMAL(10,2) DEFAULT 0,
    bekleme BOOLEAN DEFAULT FALSE,
    bildirim_tipi TEXT CHECK (bildirim_tipi IN ('magaza', 'rehber')) DEFAULT 'magaza',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Rehber bildirimleri için ayrı tablo oluştur
CREATE TABLE IF NOT EXISTS rehber_bildirimleri (
    id SERIAL PRIMARY KEY,
    satis_id INTEGER REFERENCES satislar(id) ON DELETE CASCADE,
    rehber_id INTEGER REFERENCES rehberler(id),
    bildirim_tarihi DATE NOT NULL,
    bildirim_tutari DECIMAL(10,2) NOT NULL DEFAULT 0,
    notlar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(satis_id) -- Her satış için sadece bir rehber bildirimi
);

-- 4. Satış karşılaştırma view'ı oluştur
CREATE OR REPLACE VIEW satis_karsilastirma AS
WITH magaza_satislari AS (
    SELECT 
        s.satis_tarihi,
        s.firma_id,
        f.firma_adi,
        s.magaza_id,
        m.magaza_adi,
        s.operator_id,
        o.operator_adi,
        s.rehber_id,
        r.rehber_adi,
        s.tur,
        s.grup_pax,
        s.magaza_pax,
        SUM(s.satis_tutari) as magaza_toplam
    FROM satislar s
    LEFT JOIN firmalar f ON s.firma_id = f.id
    LEFT JOIN magazalar m ON s.magaza_id = m.id
    LEFT JOIN operatorler o ON s.operator_id = o.id
    LEFT JOIN rehberler r ON s.rehber_id = r.id
    WHERE s.bildirim_tipi = 'magaza'
    GROUP BY s.satis_tarihi, s.firma_id, f.firma_adi, s.magaza_id, m.magaza_adi, 
             s.operator_id, o.operator_adi, s.rehber_id, r.rehber_adi, s.tur, s.grup_pax, s.magaza_pax
),
rehber_satislari AS (
    SELECT 
        s.satis_tarihi,
        s.firma_id,
        s.magaza_id,
        s.operator_id,
        s.rehber_id,
        s.tur,
        SUM(rb.bildirim_tutari) as rehber_toplam
    FROM satislar s
    INNER JOIN rehber_bildirimleri rb ON s.id = rb.satis_id
    WHERE s.bildirim_tipi = 'magaza'
    GROUP BY s.satis_tarihi, s.firma_id, s.magaza_id, s.operator_id, s.rehber_id, s.tur
)
SELECT 
    ms.*,
    COALESCE(rs.rehber_toplam, 0) as rehber_toplam,
    CASE 
        WHEN rs.rehber_toplam IS NULL THEN 'REHBER_BILDIRIMI_YOK'
        WHEN ABS(ms.magaza_toplam - rs.rehber_toplam) < 0.01 THEN 'UYUMLU'
        ELSE 'UYUMSUZ'
    END as durum,
    ABS(ms.magaza_toplam - COALESCE(rs.rehber_toplam, 0)) as tutar_farki
FROM magaza_satislari ms
LEFT JOIN rehber_satislari rs ON (
    ms.satis_tarihi = rs.satis_tarihi AND
    ms.firma_id = rs.firma_id AND
    ms.magaza_id = rs.magaza_id AND
    ms.operator_id = rs.operator_id AND
    ms.rehber_id = rs.rehber_id AND
    ms.tur = rs.tur
)
ORDER BY ms.satis_tarihi DESC;

-- 5. İndeksler oluştur
CREATE INDEX IF NOT EXISTS idx_satislar_satis_tarihi ON satislar(satis_tarihi);
CREATE INDEX IF NOT EXISTS idx_satislar_firma_id ON satislar(firma_id);
CREATE INDEX IF NOT EXISTS idx_satislar_magaza_id ON satislar(magaza_id);
CREATE INDEX IF NOT EXISTS idx_satislar_rehber_id ON satislar(rehber_id);
CREATE INDEX IF NOT EXISTS idx_satislar_bildirim_tipi ON satislar(bildirim_tipi);

CREATE INDEX IF NOT EXISTS idx_rehber_bildirimleri_satis_id ON rehber_bildirimleri(satis_id);
CREATE INDEX IF NOT EXISTS idx_rehber_bildirimleri_rehber_id ON rehber_bildirimleri(rehber_id);
CREATE INDEX IF NOT EXISTS idx_rehber_bildirimleri_bildirim_tarihi ON rehber_bildirimleri(bildirim_tarihi);

-- 6. Örnek veri ekle
INSERT INTO satislar (
    operator_id, firma_id, satis_tarihi, grup_pax, magaza_pax, tur, 
    rehber_id, magaza_id, urun_id, adet, birim_fiyat, 
    acente_komisyonu, rehber_komisyonu, kaptan_komisyonu, 
    satis_tutari, bildirim_tipi
) VALUES 
(1, 1, '2024-01-15', 25, 20, 'Günübirlik Tur', 1, 1, 1, 15, 50.00, 15.0, 10.0, 5.0, 750.00, 'magaza'),
(1, 1, '2024-01-15', 25, 20, 'Günübirlik Tur', 1, 1, 2, 8, 30.00, 15.0, 10.0, 5.0, 240.00, 'magaza'),
(2, 2, '2024-01-16', 30, 25, 'Tekne Turu', 2, 2, 1, 20, 45.00, 15.0, 10.0, 5.0, 900.00, 'magaza');

-- 7. Örnek rehber bildirimi ekle
INSERT INTO rehber_bildirimleri (satis_id, rehber_id, bildirim_tarihi, bildirim_tutari, notlar)
SELECT 
    s.id,
    s.rehber_id,
    s.satis_tarihi,
    s.satis_tutari * 0.95, -- %5 fark ile
    'Örnek rehber bildirimi'
FROM satislar s 
WHERE s.id = 1;

COMMIT;
