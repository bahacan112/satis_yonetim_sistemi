-- Step 1: Drop all foreign key constraints that depend on firmalar.id
ALTER TABLE public.satislar DROP CONSTRAINT IF EXISTS satislar_firma_id_fkey;
ALTER TABLE public.magazalar DROP CONSTRAINT IF EXISTS magazalar_firma_id_fkey;
ALTER TABLE public.magazalar DROP CONSTRAINT IF EXISTS fk_firma_id;

-- Step 2: Add a new UUID column to firmalar
ALTER TABLE public.firmalar ADD COLUMN id_new uuid DEFAULT gen_random_uuid();

-- Step 3: Update the new column to have unique UUIDs for all existing records
UPDATE public.firmalar SET id_new = gen_random_uuid() WHERE id_new IS NULL;

-- Step 4: Set the new column as NOT NULL
ALTER TABLE public.firmalar ALTER COLUMN id_new SET NOT NULL;

-- Step 5: Drop the old primary key constraint
ALTER TABLE public.firmalar DROP CONSTRAINT IF EXISTS firmalar_pkey;

-- Step 6: Drop the old integer 'id' column
ALTER TABLE public.firmalar DROP COLUMN id;

-- Step 7: Rename the new UUID column to 'id'
ALTER TABLE public.firmalar RENAME COLUMN id_new TO id;

-- Step 8: Add primary key constraint to the new 'id' column
ALTER TABLE public.firmalar ADD PRIMARY KEY (id);

-- Step 9: Convert magazalar.firma_id from integer to UUID (if it exists)
-- First, check if the column exists and update it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'magazalar' AND column_name = 'firma_id') THEN
        -- Set all existing values to NULL since they won't match new UUIDs
        UPDATE public.magazalar SET firma_id = NULL WHERE firma_id IS NOT NULL;
        
        -- Then change the column type to UUID
        ALTER TABLE public.magazalar ALTER COLUMN firma_id TYPE uuid USING NULL;
        
        -- Re-add foreign key constraint
        ALTER TABLE public.magazalar
        ADD CONSTRAINT magazalar_firma_id_fkey
        FOREIGN KEY (firma_id) REFERENCES public.firmalar(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 10: Handle satislar table - check if firma_id column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'satislar' AND column_name = 'firma_id') THEN
        -- Set all existing values to NULL since they won't match new UUIDs
        UPDATE public.satislar SET firma_id = NULL WHERE firma_id IS NOT NULL;
        
        -- Then change the column type to UUID
        ALTER TABLE public.satislar ALTER COLUMN firma_id TYPE uuid USING NULL;
        
        -- Re-add foreign key constraint
        ALTER TABLE public.satislar
        ADD CONSTRAINT satislar_firma_id_fkey
        FOREIGN KEY (firma_id) REFERENCES public.firmalar(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 11: Grant necessary permissions
GRANT SELECT ON public.firmalar TO authenticated;
