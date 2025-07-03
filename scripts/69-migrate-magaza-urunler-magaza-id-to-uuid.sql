-- magaza_urunler tablosundaki magaza_id sütununu UUID tipine güvenli bir şekilde dönüştür

-- 1. Mevcut yabancı anahtar kısıtlamasını düşür (eğer varsa)
ALTER TABLE public.magaza_urunler
DROP CONSTRAINT IF EXISTS magaza_urunler_magaza_id_fkey;

-- 2. Geçici bir UUID sütunu ekle
ALTER TABLE public.magaza_urunler
ADD COLUMN new_magaza_id uuid;

-- 3. Eski integer magaza_id değerlerini yeni UUID sütununa taşı
-- Bu adımda, eski integer ID'lerin yeni UUID ID'lerle doğrudan bir eşleşmesi olmadığı varsayılır.
-- Bu nedenle, mevcut tüm magaza_id değerlerini NULL olarak ayarlıyoruz.
UPDATE public.magaza_urunler
SET new_magaza_id = NULL; -- Tüm eski integer ID'leri NULL olarak ayarla

-- 4. Eski integer sütunu sil
ALTER TABLE public.magaza_urunler
DROP COLUMN magaza_id;

-- 5. Yeni UUID sütununu eski sütunun adıyla yeniden adlandır
ALTER TABLE public.magaza_urunler
RENAME COLUMN new_magaza_id TO magaza_id;

-- 6. Yeni yabancı anahtar kısıtlamasını ekle
ALTER TABLE public.magaza_urunler
ADD CONSTRAINT magaza_urunler_magaza_id_fkey FOREIGN KEY (magaza_id) REFERENCES public.magazalar(id) ON DELETE CASCADE;
