-- Basit role güncelleme (enum sorununu atlayarak)
UPDATE profiles SET role = 'admin' WHERE role = 'operator' AND id IN (
    SELECT id FROM profiles WHERE role = 'operator' LIMIT 1
);

-- Diğer operator'ları text olarak güncelle
UPDATE profiles SET role = 'standart'::text WHERE role::text = 'operator';
