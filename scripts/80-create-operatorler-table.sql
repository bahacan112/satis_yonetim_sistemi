-- Eğer tablo daha önce oluşturulmadıysa veya yapısı yanlışsa bu script'i kullanın.
-- Mevcut tabloyu silip yeniden oluşturmak için:
-- DROP TABLE IF EXISTS public.operatorler CASCADE;

CREATE TABLE IF NOT EXISTS public.operatorler (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_adi character varying NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- RLS (Row Level Security) etkinleştirme
ALTER TABLE public.operatorler ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılara okuma izni
DROP POLICY IF EXISTS "Enable read access for all users" ON public.operatorler;
CREATE POLICY "Enable read access for all users" ON public.operatorler
FOR SELECT USING (true);

-- Admin rolündeki kullanıcılara tam erişim
DROP POLICY IF EXISTS "Admins can manage operators" ON public.operatorler;
CREATE POLICY "Admins can manage operators" ON public.operatorler
FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Eğer get_user_role() fonksiyonu yoksa, aşağıdaki gibi oluşturulabilir:
-- CREATE OR REPLACE FUNCTION public.get_user_role()
-- RETURNS text
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--   user_role text;
-- BEGIN
--   SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
--   RETURN user_role;
-- END;
-- $$;
