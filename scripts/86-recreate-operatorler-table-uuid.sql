-- scripts/86-recreate-operatorler-table-uuid.sql

-- UYARI: Bu script, 'operatorler' tablosunu DÜŞÜRECEK ve YENİDEN OLUŞTURACAKTIR.
-- 'operatorler' tablosundaki tüm mevcut veriler KAYBOLACAKTIR.
-- Gerekirse lütfen tüm kritik verilerinizi yedeklediğinizden emin olun.

DROP TABLE IF EXISTS public.operatorler CASCADE;

CREATE TABLE public.operatorler (
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

-- Not: get_user_role() fonksiyonunun mevcut olduğu varsayılmıştır.
-- Eğer yoksa, ayrıca oluşturulması gerekir.
