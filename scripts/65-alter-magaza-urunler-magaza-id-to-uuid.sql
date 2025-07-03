-- magaza_urunler tablosundaki magaza_id sütununu UUID tipine dönüştür
-- Önce mevcut yabancı anahtar kısıtlamasını düşür (eğer varsa)
ALTER TABLE public.magaza_urunler
DROP CONSTRAINT IF EXISTS magaza_urunler_magaza_id_fkey;

-- Sütunun tipini UUID olarak değiştir
ALTER TABLE public.magaza_urunler
ALTER COLUMN magaza_id TYPE uuid USING (magaza_id::uuid);

-- Yeni yabancı anahtar kısıtlamasını ekle
ALTER TABLE public.magaza_urunler
ADD CONSTRAINT magaza_urunler_magaza_id_fkey FOREIGN KEY (magaza_id) REFERENCES public.magazalar(id) ON DELETE CASCADE;
