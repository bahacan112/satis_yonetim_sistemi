-- magazalar.id'ye referans veren tüm yabancı anahtar kısıtlamalarını düşür
-- Bu scripti çalıştırmadan önce, magazalar.id'ye referans veren tüm tabloları ve sütunları kontrol edin.
-- Aşağıda yaygın olabilecek bazı örnekler verilmiştir. Kendi şemanıza göre düzenlemeniz gerekebilir.

-- profiles tablosundaki magaza_id yabancı anahtarını düşür (eğer varsa)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_magaza_id_fkey;

-- tahsilatlar tablosundaki magaza_id yabancı anahtarını düşür (eğer varsa)
ALTER TABLE public.tahsilatlar
DROP CONSTRAINT IF EXISTS tahsilatlar_magaza_id_fkey;

-- satislar tablosundaki magaza_id yabancı anahtarını düşür (eğer varsa)
-- Eğer satislar tablosunda magaza_id sütunu varsa ve magazalar.id'ye referans veriyorsa
ALTER TABLE public.satislar
DROP CONSTRAINT IF EXISTS satislar_magaza_id_fkey;

-- magaza_urunler tablosundaki magaza_id yabancı anahtarını düşür (eğer varsa)
-- Eğer magaza_urunler tablosunda magaza_id sütunu varsa ve magazalar.id'ye referans veriyorsa
ALTER TABLE public.magaza_urunler
DROP CONSTRAINT IF EXISTS magaza_urunler_magaza_id_fkey;

-- Diğer tabloları da kontrol edin ve gerekirse buraya ekleyin.
