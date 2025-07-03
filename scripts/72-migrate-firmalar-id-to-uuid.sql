-- Drop foreign key constraints that depend on firmalar.id
ALTER TABLE public.magazalar DROP CONSTRAINT IF EXISTS fk_firma_id;

-- Add a new UUID column, copy data, drop old, rename new
ALTER TABLE public.firmalar ADD COLUMN id_new uuid;

-- For existing integer IDs, generate new UUIDs.
-- If you had a way to map old integer IDs to specific UUIDs, you'd do it here.
-- For a fresh start, we'll just generate new UUIDs.
UPDATE public.firmalar SET id_new = gen_random_uuid();

-- Set the new column as NOT NULL
ALTER TABLE public.firmalar ALTER COLUMN id_new SET NOT NULL;

-- Drop the old primary key constraint
ALTER TABLE public.firmalar DROP CONSTRAINT IF EXISTS firmalar_pkey;

-- Drop the old integer 'id' column
ALTER TABLE public.firmalar DROP COLUMN id;

-- Rename the new UUID column to 'id'
ALTER TABLE public.firmalar RENAME COLUMN id_new TO id;

-- Add primary key constraint to the new 'id' column
ALTER TABLE public.firmalar ADD PRIMARY KEY (id);

-- Re-add foreign key constraint for magazalar.firma_id
-- This assumes magazalar.firma_id is already UUID type.
-- If there are existing values in magazalar.firma_id that were based on old integer IDs,
-- they will now be invalid and will need to be updated or set to NULL.
-- For now, we'll just re-add the constraint.
ALTER TABLE public.magazalar
ADD CONSTRAINT fk_firma_id
FOREIGN KEY (firma_id) REFERENCES public.firmalar(id)
ON DELETE SET NULL;
