-- profiles tablosuna rehberler tablosundaki bir kayda referans veren rehber_id sütunu ekler.
-- Bu, bir profilin hangi rehber kaydına ait olduğunu belirtmek için kullanılır.
ALTER TABLE profiles
ADD COLUMN rehber_id INT REFERENCES rehberler(id);

-- Not: Eğer mevcut rehber kullanıcılarınız varsa ve onları profiles tablosundaki
-- rehber_id ile eşleştirmek isterseniz, aşağıdaki UPDATE sorgusunu
-- kendi verinize göre düzenleyip çalıştırabilirsiniz.
-- Örneğin, profiles.full_name ile rehberler.rehber_adi eşleşiyorsa:
-- UPDATE profiles
-- SET rehber_id = (SELECT id FROM rehberler WHERE rehber_adi = profiles.full_name LIMIT 1)
-- WHERE role = 'rehber' AND rehber_id IS NULL;
