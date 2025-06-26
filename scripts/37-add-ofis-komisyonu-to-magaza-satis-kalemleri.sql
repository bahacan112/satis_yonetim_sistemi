ALTER TABLE public.magaza_satis_kalemleri
ADD COLUMN ofis_komisyonu NUMERIC(5, 2) DEFAULT 0;

COMMENT ON COLUMN public.magaza_satis_kalemleri.ofis_komisyonu IS 'Mağaza satış kalemindeki ofis komisyon oranı (yüzde).';
