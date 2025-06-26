-- Profiles tablosundaki rehber_id sütununun tipini kontrol et ve düzelt

-- Önce mevcut yapıyı kontrol et
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Rehber_id sütununun tipini UUID olarak değiştir
DO $$
BEGIN
    -- Önce foreign key constraint'i kaldır (varsa)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%profiles_rehber_id%' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rehber_id_fkey;
    END IF;

    -- Sütun tipini değiştir
    BEGIN
        ALTER TABLE profiles ALTER COLUMN rehber_id TYPE UUID USING rehber_id::text::uuid;
        RAISE NOTICE 'rehber_id sütunu UUID tipine dönüştürüldü';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'rehber_id sütunu zaten UUID tipinde veya dönüştürülemedi: %', SQLERRM;
    END;

    -- Foreign key constraint'i yeniden ekle
    BEGIN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_rehber_id_fkey 
        FOREIGN KEY (rehber_id) REFERENCES rehberler(id) ON DELETE SET NULL;
        RAISE NOTICE 'Foreign key constraint eklendi';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Foreign key constraint eklenemedi: %', SQLERRM;
    END;
END $$;

-- Son durumu kontrol et
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'rehber_id';

-- Test için rehberler tablosundan bir UUID al
SELECT id, rehber_adi FROM rehberler LIMIT 3;

RAISE NOTICE 'Profiles tablosu rehber_id sütunu düzeltildi!';
