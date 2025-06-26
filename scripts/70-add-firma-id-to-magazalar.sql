-- Add firma_id to magazalar table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'magazalar' AND column_name = 'firma_id') THEN
        ALTER TABLE public.magazalar
        ADD COLUMN firma_id uuid;
        -- Optionally, add a foreign key constraint if 'firmalar' table exists and has 'id' as UUID
        -- ALTER TABLE public.magazalar
        -- ADD CONSTRAINT fk_firma
        -- FOREIGN KEY (firma_id) REFERENCES public.firmalar(id);
    END IF;
END
$$;
