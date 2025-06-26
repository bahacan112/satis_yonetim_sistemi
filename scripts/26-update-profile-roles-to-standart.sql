DO $$
BEGIN
    -- 'operator' rolünü 'standart' olarak güncelle
    UPDATE public.profiles
    SET role = 'standart'
    WHERE role = 'operator';

    RAISE NOTICE 'Profiles tablosundaki ''operator'' rolleri ''standart'' olarak güncellendi.';
END;
$$ LANGUAGE plpgsql;
