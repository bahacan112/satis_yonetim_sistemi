-- EMRAH DİKİCİ kullanıcısının profile'ında rehber_id'yi güncelle
UPDATE profiles 
SET rehber_id = 'c39ea6a6-48dc-4229-b002-f7ede337b331'
WHERE id = '58dfb8c2-080c-4ce6-baed-e4161767ccf8' 
AND role = 'rehber';

-- Kontrol sorgusu
SELECT 
    p.id as profile_id,
    p.full_name,
    p.role,
    p.rehber_id,
    r.rehber_adi,
    r.telefon
FROM profiles p
LEFT JOIN rehberler r ON p.rehber_id = r.id
WHERE p.role = 'rehber';

-- Bu rehber_id ile kaç satış var kontrol et
SELECT COUNT(*) as satis_sayisi
FROM satislar 
WHERE rehber_id = 'c39ea6a6-48dc-4229-b002-f7ede337b331';
