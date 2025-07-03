-- Önce eski tabloları temizle
DROP TABLE IF EXISTS satis_kalemleri CASCADE;

-- Ürünler tablosunu güncelle (satış cirosu kaldır)
ALTER TABLE urunler DROP COLUMN IF EXISTS satis_cirosu;

-- Mağaza-Ürün ilişki tablosu oluştur
CREATE TABLE IF NOT EXISTS magaza_urunler (
  id SERIAL PRIMARY KEY,
  magaza_id INTEGER REFERENCES magazalar(id) ON DELETE CASCADE,
  urun_id INTEGER REFERENCES urunler(id) ON DELETE CASCADE,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(magaza_id, urun_id)
);

-- Satışlar tablosuna ürün bilgilerini ekle
ALTER TABLE satislar 
ADD COLUMN IF NOT EXISTS urun_id INTEGER REFERENCES urunler(id),
ADD COLUMN IF NOT EXISTS adet INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS birim_fiyat DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS acente_komisyonu DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rehber_komisyonu DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS kaptan_komisyonu DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS satis_tutari DECIMAL(10,2) DEFAULT 0;

-- Enum'u tamamen yeniden oluştur
DO $$ 
BEGIN
    -- Eğer user_role enum'u varsa, önce profiles tablosunu text'e çevir
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Profiles tablosundaki role sütununu geçici olarak text yap
        ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;
        
        -- Eski enum'u sil
        DROP TYPE user_role;
    END IF;
    
    -- Yeni enum'u oluştur
    CREATE TYPE user_role AS ENUM ('admin', 'standart');
    
    -- Profiles tablosunu yeni enum'a çevir
    ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
    
    -- operator'ları standart'a çevir
    UPDATE profiles SET role = 'standart' WHERE role::text = 'operator';
    
EXCEPTION
    WHEN others THEN
        -- Hata durumunda sadece text güncelleme yap
        UPDATE profiles SET role = 'standart' WHERE role::text = 'operator';
END $$;

-- İndeksler ekle
CREATE INDEX IF NOT EXISTS idx_magaza_urunler_magaza ON magaza_urunler(magaza_id);
CREATE INDEX IF NOT EXISTS idx_magaza_urunler_urun ON magaza_urunler(urun_id);
CREATE INDEX IF NOT EXISTS idx_satislar_urun ON satislar(urun_id);

-- Örnek mağaza-ürün ilişkileri ekle
INSERT INTO magaza_urunler (magaza_id, urun_id, aktif) 
SELECT m.id, u.id, true 
FROM magazalar m 
CROSS JOIN urunler u 
ON CONFLICT (magaza_id, urun_id) DO NOTHING;
