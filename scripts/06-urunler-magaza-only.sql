-- Ürünler tablosundan firma_id kaldır
ALTER TABLE urunler DROP COLUMN IF EXISTS firma_id;

-- Mağaza-ürün ilişkilerini yeniden oluştur (önceki veriler varsa temizle)
DELETE FROM magaza_urunler;

-- Örnek ürünler ekle (mağaza bağımsız)
INSERT INTO urunler (urun_adi, acente_komisyonu, rehber_komisyonu, kaptan_komisyonu) VALUES
('Deri Ceket', 15.0, 10.0, 5.0),
('Halı', 20.0, 15.0, 8.0),
('Takı', 25.0, 12.0, 6.0),
('Seramik', 18.0, 8.0, 4.0),
('Tekstil', 22.0, 14.0, 7.0)
ON CONFLICT DO NOTHING;
