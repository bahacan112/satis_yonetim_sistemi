-- Drop existing policies on tahsilatlar first to avoid conflicts
DROP POLICY IF EXISTS "Allow admins to manage all tahsilatlar" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Allow standard users to manage their own tahsilatlar" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Allow rehber users to manage tahsilatlar for their assigned store" ON public.tahsilatlar;

-- Add magaza_id column
ALTER TABLE public.tahsilatlar
ADD COLUMN magaza_id UUID REFERENCES public.magazalar(id); -- Changed INT to UUID here

-- If you have existing data and need to migrate firma_id to magaza_id:
-- This is a placeholder. You need to define how firma_id maps to magaza_id.
-- For example, if each firma has a primary magaza, or if tahsilatlar were always for a specific magaza.
-- UPDATE public.tahsilatlar t
-- SET magaza_id = (SELECT s.magaza_id FROM public.satislar s WHERE s.firma_id = t.firma_id LIMIT 1)
-- WHERE t.firma_id IS NOT NULL AND t.magaza_id IS NULL;

-- Drop firma_id column (after migration if needed, or if starting fresh)
ALTER TABLE public.tahsilatlar
DROP COLUMN firma_id;

-- Make magaza_id NOT NULL if all existing data is migrated or if it's a new setup
-- ALTER TABLE public.tahsilatlar
-- ALTER COLUMN magaza_id SET NOT NULL;
