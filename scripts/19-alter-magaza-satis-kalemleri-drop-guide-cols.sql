-- magaza_satis_kalemleri tablosundan rehber bildirimine ait sütunları kaldır
ALTER TABLE magaza_satis_kalemleri
DROP COLUMN IF EXISTS rehber_bildirim_adet,
DROP COLUMN IF EXISTS rehber_bildirim_fiyati,
DROP COLUMN IF EXISTS rehber_bildirim_tarihi,
DROP COLUMN IF EXISTS rehber_bildirim_notu;
