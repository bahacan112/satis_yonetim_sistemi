-- Satislar detay view'ında operatör bilgilerini kontrol et
SELECT 
    s.id as satis_id,
    s.tur_id,
    t.operator_id,
    o.operator_adi,
    s.satis_tarihi,
    t.tur_adi
FROM satislar s
LEFT JOIN turlar t ON s.tur_id = t.id
LEFT JOIN operatorler o ON t.operator_id = o.id
LIMIT 5;

-- View'ın yapısını kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'satislar_detay_view' 
AND column_name LIKE '%operator%'
ORDER BY ordinal_position;

-- View'dan örnek veri çek
SELECT 
    satis_id,
    tur_id,
    operator_id,
    operator_adi,
    satis_tarihi,
    urun_adi
FROM satislar_detay_view 
LIMIT 5;

-- Turlar tablosunda operator_id kontrolü
SELECT 
    id,
    tur_adi,
    operator_id
FROM turlar
LIMIT 5;

-- Operatorler tablosunu kontrol et
SELECT 
    id,
    operator_adi
FROM operatorler
LIMIT 5;
