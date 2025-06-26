-- scripts/90-add-adi-to-magazalar.sql

DO $$
BEGIN
    -- Check if the 'adi' column exists in the 'magazalar' table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'magazalar' AND column_name = 'adi') THEN
        -- If it does not exist, add the 'adi' column
        ALTER TABLE public.magazalar ADD COLUMN adi TEXT;
        RAISE NOTICE 'Column adi added to magazalar table.';
    ELSE
        RAISE NOTICE 'Column adi already exists in magazalar table.';
    END IF;
END
$$;
