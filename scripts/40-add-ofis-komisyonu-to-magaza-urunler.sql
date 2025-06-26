ALTER TABLE public.magaza_urunler
ADD COLUMN ofis_komisyonu NUMERIC(5, 2) DEFAULT 0;

COMMENT ON COLUMN public.magaza_urunler.ofis_komisyonu IS 'Mağaza ürünündeki ofis komisyon oranı (yüzde).';
