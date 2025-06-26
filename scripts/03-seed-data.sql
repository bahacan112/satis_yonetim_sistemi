-- Sample data for testing

-- Insert sample firmalar
INSERT INTO firmalar (firma_adi, il, sektor) VALUES
('Antalya Turizm A.Ş.', 'Antalya', 'Turizm'),
('İstanbul Ticaret Ltd.', 'İstanbul', 'Ticaret'),
('Bodrum Denizcilik', 'Muğla', 'Denizcilik');

-- Insert sample magazalar
INSERT INTO magazalar (magaza_adi, il, ilce, sektor, firma_id) VALUES
('Antalya Merkez Mağaza', 'Antalya', 'Muratpaşa', 'Turizm', 1),
('Kaleici Şubesi', 'Antalya', 'Muratpaşa', 'Turizm', 1),
('İstanbul Taksim', 'İstanbul', 'Beyoğlu', 'Ticaret', 2),
('Bodrum Marina', 'Muğla', 'Bodrum', 'Denizcilik', 3);

-- Insert sample urunler
INSERT INTO urunler (urun_adi, firma_id, satis_cirosu, acente_komisyonu, rehber_komisyonu, kaptan_komisyonu) VALUES
('Antalya Şehir Turu', 1, 150.00, 10.00, 15.00, 5.00),
('Pamukkale Turu', 1, 200.00, 12.00, 18.00, 7.00),
('Bosphorus Cruise', 2, 100.00, 8.00, 12.00, 4.00),
('Bodrum Tekne Turu', 3, 300.00, 15.00, 20.00, 10.00);

-- Insert sample operatorler
INSERT INTO operatorler (operator_adi) VALUES
('Ahmet Yılmaz'),
('Fatma Kaya'),
('Mehmet Demir');

-- Insert sample rehberler
INSERT INTO rehberler (rehber_adi) VALUES
('Ali Özkan'),
('Ayşe Şahin'),
('Mustafa Çelik');

-- Insert sample satislar
INSERT INTO satislar (operator_id, grup_gelis_tarihi, magaza_giris_tarihi, grup_pax, magaza_pax, tur, rehber_id, magaza_id, bekleme) VALUES
(1, '2024-01-15', '2024-01-15', 25, 20, 'Günübirlik Tur', 1, 1, false),
(2, '2024-01-16', '2024-01-16', 30, 25, 'İki Günlük Tur', 2, 2, true),
(3, '2024-01-17', '2024-01-17', 15, 12, 'Özel Tur', 3, 3, false);

-- Insert sample satis_kalemleri
INSERT INTO satis_kalemleri (satis_id, urun_id, adet, birim_fiyat, acente_komisyonu, rehber_komisyonu, kaptan_komisyonu) VALUES
(1, 1, 20, 150.00, 10.00, 15.00, 5.00),
(1, 2, 15, 200.00, 12.00, 18.00, 7.00),
(2, 3, 25, 100.00, 8.00, 12.00, 4.00),
(3, 4, 12, 300.00, 15.00, 20.00, 10.00);
