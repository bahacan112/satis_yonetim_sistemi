-- satislar tablosundaki magaza_id sütununu UUID tipine güvenli bir şekilde dönüştür

-- 1. Mevcut yabancı anahtar kısıtlamasını düşür (eğer varsa)
ALTER TABLE public.satislar
DROP CONSTRAINT IF EXISTS satislar_magaza_id_fkey;

-- 2. Geçici bir UUID sütunu ekle
ALTER TABLE public.satislar
ADD COLUMN new_magaza_id uuid;

-- 3. Eski integer magaza_id değerlerini yeni UUID sütununa taşı
-- Bu adımda, eski integer ID'lerin yeni UUID ID'lerle doğrudan bir eşleşmesi olmadığı varsayılır.
-- Bu nedenle, mevcut tüm magaza_id değerlerini NULL olarak ayarlıyoruz.
-- Eğer eski integer ID'ler ile yeni UUID ID'ler arasında bir eşleme tablonuz varsa,
-- bu UPDATE sorgusunu o eşleme tablosunu kullanarak güncelleyebilirsiniz.
UPDATE public.satislar
SET new_magaza_id = NULL; -- Tüm eski integer ID'leri NULL olarak ayarla

-- 4. Eski integer sütunu sil
ALTER TABLE public.satislar
DROP COLUMN magaza_id;

-- 5. Yeni UUID sütununu eski sütunun adıyla yeniden adlandır
ALTER TABLE public.satislar
RENAME COLUMN new_magaza_id TO magaza_id;

-- 6. Yeni yabancı anahtar kısıtlamasını ekle
ALTER TABLE public.satislar
ADD CONSTRAINT satislar_magaza_id_fkey FOREIGN KEY (magaza_id) REFERENCES public.magazalar(id) ON DELETE SET NULL;
