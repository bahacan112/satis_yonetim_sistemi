ALTER TABLE satislar
DROP COLUMN IF EXISTS urun_id,
DROP COLUMN IF EXISTS adet,
DROP COLUMN IF EXISTS birim_fiyat,
DROP COLUMN IF EXISTS acente_komisyonu,
DROP COLUMN IF EXISTS rehber_komisyonu,
DROP COLUMN IF EXISTS kaptan_komisyonu,
DROP COLUMN IF EXISTS bildirim_tipi;
