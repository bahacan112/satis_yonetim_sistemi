-- DIKKAT: Bu script magazalar tablosundaki TUM VERILERI SİLECEKTİR!
-- Lütfen devam etmeden önce verilerinizi yedeklediğinizden emin olun.

-- Mevcut magazalar tablosunu düşür
DROP TABLE IF EXISTS public.magazalar CASCADE;

-- magazalar tablosunu UUID birincil anahtarla yeniden oluştur
CREATE TABLE public.magazalar (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    magaza_adi text NOT NULL,
    adres text,
    telefon text,
    email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Opsiyonel: Eğer yedeklediğiniz veriler varsa, buraya INSERT INTO komutlarını ekleyerek geri yükleyebilirsiniz.
-- Örneğin:
-- INSERT INTO public.magazalar (id, magaza_adi, adres, telefon, email, created_at)
-- VALUES
--   ('uuid-1', 'Mağaza A', 'Adres A', '111', 'a@example.com', '2023-01-01'),
--   ('uuid-2', 'Mağaza B', 'Adres B', '222', 'b@example.com', '2023-01-02');
