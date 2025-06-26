-- Debug script to check status values in the database

-- Check all unique status values in magaza_satis_kalemleri
SELECT DISTINCT status, COUNT(*) as count
FROM public.magaza_satis_kalemleri 
GROUP BY status
ORDER BY status;

-- Check all unique status values in rehber_satis_kalemleri  
SELECT DISTINCT status, COUNT(*) as count
FROM public.rehber_satis_kalemleri 
GROUP BY status
ORDER BY status;

-- Check satislar_detay_view for specific magaza
SELECT 
    status, 
    bildirim_tipi,
    COUNT(*) as count,
    SUM(toplam_tutar) as total_amount
FROM public.satislar_detay_view 
WHERE magaza_id = '678ddcd6-d4ed-4adb-b0a8-8e6ca195059c'
GROUP BY status, bildirim_tipi
ORDER BY status, bildirim_tipi;

-- Check raw data for the specific magaza
SELECT 
    s.id as satis_id,
    s.magaza_giris_tarihi,
    msk.status as magaza_status,
    rsk.status as rehber_status,
    msk.urun_id as magaza_urun_id,
    rsk.urun_id as rehber_urun_id,
    u1.urun_adi as magaza_urun_adi,
    u2.urun_adi as rehber_urun_adi
FROM public.satislar s
LEFT JOIN public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN public.urunler u1 ON msk.urun_id = u1.id
LEFT JOIN public.urunler u2 ON rsk.urun_id = u2.id
WHERE s.magaza_id = '678ddcd6-d4ed-4adb-b0a8-8e6ca195059c'
ORDER BY s.magaza_giris_tarihi DESC;
