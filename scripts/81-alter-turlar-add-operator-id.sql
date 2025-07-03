-- Add operator_id column to turlar table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turlar' AND column_name = 'operator_id') THEN
        ALTER TABLE public.turlar
        ADD COLUMN operator_id uuid REFERENCES public.operatorler(id);
    END IF;
END
$$;
