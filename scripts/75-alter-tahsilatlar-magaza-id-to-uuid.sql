-- Drop dependent view before altering the table
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;

-- Drop existing policies on tahsilatlar table before altering the column
DROP POLICY IF EXISTS "Allow all access for admins" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Allow read access for standart users" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Allow insert for standart users linked to their magaza" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Allow update for standart users linked to their magaza" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Allow delete for standart users linked to their magaza" ON public.tahsilatlar;
-- Also drop any other policies that might exist and depend on magaza_id
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Allow standard users to manage their own tahsilatlar" ON public.tahsilatlar; -- Specific policy from error
DROP POLICY IF EXISTS "Allow rehber users to manage tahsilatlar for their assigned sto" ON public.tahsilatlar; -- Specific policy from error


-- Drop existing foreign key constraints on tahsilatlar table if they exist
ALTER TABLE public.tahsilatlar DROP CONSTRAINT IF EXISTS tahsilatlar_firma_id_fkey;
ALTER TABLE public.tahsilatlar DROP CONSTRAINT IF EXISTS tahsilatlar_magaza_id_fkey;

-- Drop the firma_id column as it's being replaced by magaza_id (UUID)
ALTER TABLE public.tahsilatlar DROP COLUMN IF EXISTS firma_id;

-- Alter magaza_id column to UUID type
-- First, add a new UUID column
ALTER TABLE public.tahsilatlar ADD COLUMN magaza_id_new UUID;

-- Update the new column with existing integer IDs converted to UUIDs (if any data exists)
-- This step assumes a mapping or that existing integer IDs are not critical for UUID conversion.
-- If you have existing integer IDs in tahsilatlar.magaza_id that need to be mapped to new UUIDs,
-- you would need a more complex migration logic here, possibly involving a temporary table
-- or a function to look up UUIDs based on old integer IDs.
-- For now, we'll assume new entries will use UUIDs and old ones might need manual correction or a data migration script.
-- If there's no existing data or it's acceptable to lose old links, this is fine.
-- If there is existing data, you would need to populate magaza_id_new based on a lookup from magazalar.id_old_integer_column.
-- Example (if you had a temporary old_id column in magazalar):
-- UPDATE public.tahsilatlar t
-- SET magaza_id_new = m.id
-- FROM public.magazalar m
-- WHERE t.magaza_id = m.old_integer_id_column;

-- Drop the old integer magaza_id column
ALTER TABLE public.tahsilatlar DROP COLUMN IF EXISTS magaza_id;

-- Rename the new UUID column to magaza_id
ALTER TABLE public.tahsilatlar RENAME COLUMN magaza_id_new TO magaza_id;

-- Add NOT NULL constraint if desired (after ensuring data integrity)
-- ALTER TABLE public.tahsilatlar ALTER COLUMN magaza_id SET NOT NULL;

-- Add new foreign key constraint to magazalar table (which now uses UUID for id)
ALTER TABLE public.tahsilatlar ADD CONSTRAINT tahsilatlar_magaza_id_fkey
FOREIGN KEY (magaza_id) REFERENCES public.magazalar(id) ON DELETE CASCADE;

-- Recreate policies for tahsilatlar table to use the new UUID magaza_id
CREATE POLICY "Allow all access for admins" ON public.tahsilatlar
FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Allow read access for standart users" ON public.tahsilatlar
FOR SELECT USING (get_user_role() = 'standart');

CREATE POLICY "Allow insert for standart users linked to their magaza" ON public.tahsilatlar
FOR INSERT WITH CHECK (get_user_role() = 'standart' AND magaza_id IN (SELECT magaza_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Allow update for standart users linked to their magaza" ON public.tahsilatlar
FOR UPDATE USING (get_user_role() = 'standart' AND magaza_id IN (SELECT magaza_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Allow delete for standart users linked to their magaza" ON public.tahsilatlar
FOR DELETE USING (get_user_role() = 'standart' AND magaza_id IN (SELECT magaza_id FROM public.profiles WHERE id = auth.uid()));

-- Grant necessary permissions
GRANT ALL ON public.tahsilatlar TO postgres;
GRANT ALL ON public.tahsilatlar TO anon, authenticated, service_role;
