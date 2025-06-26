-- satislar tablosundaki magaza_id sütununu UUID tipine güvenli bir şekilde dönüştür
-- Önce mevcut yabancı anahtar kısıtlamasını düşür (eğer varsa)
ALTER TABLE public.satislar
DROP CONSTRAINT IF EXISTS satislar_magaza_id_fkey;

-- Geçersiz integer değerlerini NULL olarak güncelle
-- Bu adım, UUID'ye dönüştürülemeyen eski integer ID'leri temizler.
UPDATE public.satislar
SET magaza_id = NULL
WHERE magaza_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.magazalar WHERE id = magaza_id::uuid);

-- Sütunun tipini UUID olarak değiştir
ALTER TABLE public.satislar
ALTER COLUMN magaza_id TYPE uuid USING (magaza_id::uuid);

-- Yeni yabancı anahtar kısıtlamasını ekle
ALTER TABLE public.satislar
ADD CONSTRAINT satislar_magaza_id_fkey FOREIGN KEY (magaza_id) REFERENCES public.magazalar(id) ON DELETE SET NULL;
