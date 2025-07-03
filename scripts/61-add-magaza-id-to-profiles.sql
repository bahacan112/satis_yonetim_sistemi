ALTER TABLE public.profiles
ADD COLUMN magaza_id uuid REFERENCES public.magazalar(id);

-- Opsiyonel: Mevcut kullanıcıları mağazalarla eşleştirmek için (örneğin, eğer profiles tablosunda magaza_id'yi belirleyebileceğiniz başka bir sütun varsa)
-- UPDATE public.profiles
-- SET magaza_id = (SELECT id FROM public.magazalar WHERE magazalar.magaza_adi = profiles.some_magaza_name_column)
-- WHERE magaza_id IS NULL;
