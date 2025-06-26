-- scripts/99-alter-satislar-operator-id-type.sql

-- Step 1: Drop dependent views to avoid conflicts during column alteration
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view;
DROP VIEW IF EXISTS public.satislar_detay_view;

-- Step 2: Drop foreign key constraint on satislar.operator_id if it exists
ALTER TABLE public.satislar
DROP CONSTRAINT IF EXISTS satislar_operator_id_fkey;

-- Step 3: Alter column type to UUID
-- IMPORTANT: This will set existing INTEGER values in operator_id to NULL
-- because a direct cast from INTEGER to UUID is not possible.
-- If you have existing integer operator IDs that need to be preserved and mapped
-- to UUIDs, a more complex data migration strategy would be required.
ALTER TABLE public.satislar
ALTER COLUMN operator_id TYPE UUID USING NULL;

-- Step 4: Add back the foreign key constraint
ALTER TABLE public.satislar
ADD CONSTRAINT satislar_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operatorler(id);

-- Step 5: Grant permissions (if necessary, usually handled by RLS policies)
-- This ensures that authenticated users can update the operator_id column if needed.
GRANT UPDATE (operator_id) ON public.satislar TO authenticated;
