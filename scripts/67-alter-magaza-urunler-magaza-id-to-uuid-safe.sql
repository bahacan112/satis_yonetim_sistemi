-- magaza_urunler tablosundaki magaza_id sütununu UUID tipine güvenli bir şekilde dönüştür
-- Önce mevcut yabancı anahtar kısıtlamasını düşür (eğer varsa)
ALTER TABLE public.magaza_urunler
DROP CONSTRAINT IF EXISTS magaza_urunler_magaza_id_fkey;

-- Geçersiz integer değerlerini NULL olarak güncelle
UPDATE public.magaza_urunler
SET magaza_id = NULL
WHERE magaza_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.magazalar WHERE id = magaza_id::uuid);

-- Sütunun tipini UUID olarak değiştir
ALTER TABLE public.magaza_urunler
ALTER COLUMN magaza_id TYPE uuid USING (magaza_id::uuid);

-- Yeni yabancı anahtar kısıtlamasını ekle
ALTER TABLE public.magaza_urunler
ADD CONSTRAINT magaza_urunler_magaza_id_fkey FOREIGN KEY (magaza_id) REFERENCES public.magazalar(id) ON DELETE CASCADE;
