-- 1. Yeni ENUM tipini oluştur
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'satis_kalem_durum') THEN
        CREATE TYPE public.satis_kalem_durum AS ENUM ('onaylandı', 'beklemede', 'iptal');
    END IF;
END$$;

-- 2. magaza_satis_kalemleri tablosunu güncelle
ALTER TABLE public.magaza_satis_kalemleri
DROP COLUMN IF EXISTS bekleme,
DROP COLUMN IF EXISTS vade_tarihi;

ALTER TABLE public.magaza_satis_kalemleri
ADD COLUMN IF NOT EXISTS status public.satis_kalem_durum NOT NULL DEFAULT 'onaylandı';

-- 3. rehber_satis_kalemleri tablosunu güncelle
ALTER TABLE public.rehber_satis_kalemleri
DROP COLUMN IF EXISTS bekleme,
DROP COLUMN IF EXISTS vade_tarihi;

ALTER TABLE public.rehber_satis_kalemleri
ADD COLUMN IF NOT EXISTS status public.satis_kalem_durum NOT NULL DEFAULT 'onaylandı';
