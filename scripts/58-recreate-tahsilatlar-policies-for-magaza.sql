-- Recreate policies for tahsilatlar using magaza_id
DROP POLICY IF EXISTS "Allow admins to manage all tahsilatlar" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Allow standard users to manage their own tahsilatlar" ON public.tahsilatlar;
DROP POLICY IF EXISTS "Allow rehber users to manage tahsilatlar for their assigned store" ON public.tahsilatlar;

CREATE POLICY "Allow admins to manage all tahsilatlar"
ON public.tahsilatlar
FOR ALL
TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Allow standard users to manage their own tahsilatlar"
ON public.tahsilatlar
FOR ALL
TO authenticated
USING (get_user_role() = 'standart' AND auth.uid() IN (SELECT id FROM public.profiles WHERE magaza_id = tahsilatlar.magaza_id))
WITH CHECK (get_user_role() = 'standart' AND auth.uid() IN (SELECT id FROM public.profiles WHERE magaza_id = tahsilatlar.magaza_id));

-- Add a policy for 'rehber' role if they can manage tahsilatlar for their assigned store
-- Assuming rehber can only see/manage sales/tahsilat for their assigned rehber_id,
-- and that rehber_id is linked to a magaza_id (e.g., rehber works for a specific magaza).
-- This might need further refinement based on exact business logic.
CREATE POLICY "Allow rehber users to manage tahsilatlar for their assigned store"
ON public.tahsilatlar
FOR ALL
TO authenticated
USING (get_user_role() = 'rehber' AND auth.uid() IN (SELECT id FROM public.profiles WHERE rehber_id IS NOT NULL AND magaza_id = tahsilatlar.magaza_id))
WITH CHECK (get_user_role() = 'rehber' AND auth.uid() IN (SELECT id FROM public.profiles WHERE rehber_id IS NOT NULL AND magaza_id = tahsilatlar.magaza_id));
