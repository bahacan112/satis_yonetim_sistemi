-- rehber_bildirimleri tablosundaki satislar foreign key'ini yeniden oluşturur.
-- Bu, Supabase'in şema önbelleğini yenilemeye yardımcı olabilir.

DO $$
BEGIN
  -- Mevcut foreign key kısıtlamasını kontrol et ve varsa sil
  IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'rehber_bildirimleri_satis_id_fkey'
      AND conrelid = 'public.rehber_bildirimleri'::regclass
  ) THEN
      ALTER TABLE public.rehber_bildirimleri
      DROP CONSTRAINT rehber_bildirimleri_satis_id_fkey;
      RAISE NOTICE 'Existing foreign key rehber_bildirimleri_satis_id_fkey dropped.';
  END IF;

  -- Foreign key kısıtlamasını yeniden ekle
  ALTER TABLE public.rehber_bildirimleri
  ADD CONSTRAINT rehber_bildirimleri_satis_id_fkey
  FOREIGN KEY (satis_id) REFERENCES public.satislar(id) ON DELETE CASCADE;
  RAISE NOTICE 'Foreign key rehber_bildirimleri_satis_id_fkey recreated.';

END
$$;
