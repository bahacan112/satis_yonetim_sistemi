-- scripts/105-fix-final-group-by.sql
-- Fix GROUP BY clause in magaza_muhasebe_summary_view

-- Drop existing views
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view CASCADE;
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view CASCADE;
DROP VIEW IF EXISTS public.satislar_detay_view CASCADE;

-- Step 1: Ensure satislar.operator_id is UUID type
DO $$
DECLARE
    col_type TEXT;
    fk_name TEXT;
BEGIN
    -- Check current data type of operator_id
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'satislar' AND column_name = 'operator_id';
    
    IF col_type IS NOT NULL AND col_type != 'uuid' THEN
        -- Drop foreign key constraint if exists
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public' 
          AND tc.table_name = 'satislar' 
          AND kcu.column_name = 'operator_id';

        IF fk_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.satislar DROP CONSTRAINT ' || quote_ident(fk_name);
        END IF;

        -- Change column type to UUID
        ALTER TABLE public.satislar ALTER COLUMN operator_id TYPE UUID USING NULL;
        
        -- Recreate foreign key constraint
        ALTER TABLE public.satislar
        ADD CONSTRAINT satislar_operator_id_fkey 
        FOREIGN KEY (operator_id) REFERENCES public.operatorler(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Step 2: Create satislar_detay_view
CREATE VIEW public.satislar_detay_view AS
-- Mağaza satış kalemleri
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.tur_id,
    t.tur_adi AS tur,
    s.operator_id,
    o.operator_adi,
    s.rehber_id,
    r.rehber_adi,
    s.magaza_id,
    m.magaza_adi,
    s.firma_id,
    f.firma_adi,
    msk.urun_id,
    u.urun_adi,
    msk.adet,
    msk.birim_fiyat,
    msk.acente_komisyonu,
    msk.rehber_komisyonu,
    msk.kaptan_komisyonu,
    msk.ofis_komisyonu,
    COALESCE(msk.adet * msk.birim_fiyat, 0) AS toplam_tutar,
    COALESCE(msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100, 0) AS acente_komisyon_tutari,
    COALESCE(msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100, 0) AS rehber_komisyon_tutari,
    COALESCE(msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100, 0) AS kaptan_komisyon_tutari,
    COALESCE(msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100, 0) AS ofis_komisyon_tutari,
    'magaza'::text AS bildirim_tipi,
    msk.bekleme,
    msk.vade_tarihi,
    s.created_at
FROM
    public.satislar s
INNER JOIN public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN public.turlar t ON s.tur_id = t.id
LEFT JOIN public.operatorler o ON s.operator_id = o.id
LEFT JOIN public.rehberler r ON s.rehber_id = r.id
LEFT JOIN public.magazalar m ON s.magaza_id = m.id
LEFT JOIN public.firmalar f ON s.firma_id = f.id
LEFT JOIN public.urunler u ON msk.urun_id = u.id

UNION ALL

-- Rehber satış kalemleri
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.tur_id,
    t.tur_adi AS tur,
    s.operator_id,
    o.operator_adi,
    s.rehber_id,
    r.rehber_adi,
    s.magaza_id,
    m.magaza_adi,
    s.firma_id,
    f.firma_adi,
    rsk.urun_id,
    u.urun_adi,
    rsk.adet,
    rsk.birim_fiyat,
    NULL AS acente_komisyonu,
    NULL AS rehber_komisyonu,
    NULL AS kaptan_komisyonu,
    NULL AS ofis_komisyonu,
    COALESCE(rsk.adet * rsk.birim_fiyat, 0) AS toplam_tutar,
    NULL AS acente_komisyon_tutari,
    NULL AS rehber_komisyon_tutari,
    NULL AS kaptan_komisyon_tutari,
    NULL AS ofis_komisyon_tutari,
    'rehber'::text AS bildirim_tipi,
    rsk.bekleme,
    rsk.vade_tarihi,
    s.created_at
FROM
    public.satislar s
INNER JOIN public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN public.turlar t ON s.tur_id = t.id
LEFT JOIN public.operatorler o ON s.operator_id = o.id
LEFT JOIN public.rehberler r ON s.rehber_id = r.id
LEFT JOIN public.magazalar m ON s.magaza_id = m.id
LEFT JOIN public.firmalar f ON s.firma_id = f.id
LEFT JOIN public.urunler u ON rsk.urun_id = u.id;

-- Step 3: Create magaza_satis_detaylari_view
CREATE VIEW public.magaza_satis_detaylari_view AS
SELECT
    satis_id,
    satis_tarihi,
    grup_gelis_tarihi,
    magaza_giris_tarihi,
    grup_pax,
    magaza_pax,
    tur_id,
    tur AS tur_adi,
    rehber_id,
    rehber_adi,
    magaza_id,
    magaza_adi,
    firma_id,
    firma_adi,
    operator_id,
    operator_adi,
    urun_id,
    urun_adi,
    adet,
    birim_fiyat,
    acente_komisyonu,
    rehber_komisyonu,
    kaptan_komisyonu,
    ofis_komisyonu,
    toplam_tutar,
    acente_komisyon_tutari,
    rehber_komisyon_tutari,
    kaptan_komisyon_tutari,
    ofis_komisyon_tutari,
    bekleme,
    vade_tarihi,
    created_at
FROM
    public.satislar_detay_view
WHERE
    bildirim_tipi = 'magaza';

-- Step 4: Create magaza_muhasebe_summary_view with corrected GROUP BY
CREATE VIEW public.magaza_muhasebe_summary_view AS
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'magaza' THEN sdv.toplam_tutar ELSE 0 END), 0) AS toplam_magaza_satis,
    COALESCE(SUM(CASE WHEN sdv.bildirim_tipi = 'rehber' THEN sdv.toplam_tutar ELSE 0 END), 0) AS toplam_rehber_satis,
    COALESCE(SUM(sdv.toplam_tutar), 0) AS genel_toplam_satis,
    COALESCE(SUM(sdv.acente_komisyon_tutari), 0) AS toplam_acente_komisyonu,
    COALESCE(SUM(sdv.rehber_komisyon_tutari), 0) AS toplam_rehber_komisyonu,
    COALESCE(SUM(sdv.kaptan_komisyon_tutari), 0) AS toplam_kaptan_komisyonu,
    COALESCE(SUM(sdv.ofis_komisyon_tutari), 0) AS toplam_ofis_komisyonu,
    COALESCE(tf.total_tahsilat_for_firm, 0) AS toplam_tahsilat,
    COALESCE(SUM(sdv.toplam_tutar), 0) - COALESCE(tf.total_tahsilat_for_firm, 0) AS kalan_bakiye,
    COALESCE(SUM(sdv.grup_pax), 0) AS toplam_grup_pax,
    COALESCE(SUM(sdv.magaza_pax), 0) AS toplam_magaza_pax
FROM
    public.magazalar m
LEFT JOIN
    public.satislar_detay_view sdv ON m.id = sdv.magaza_id
LEFT JOIN (
    SELECT
        firma_id,
        SUM(acente_payi + ofis_payi) AS total_tahsilat_for_firm
    FROM
        public.tahsilatlar
    GROUP BY
        firma_id
) AS tf ON m.firma_id = tf.firma_id
GROUP BY
    m.id, m.magaza_adi, m.firma_id, tf.total_tahsilat_for_firm;

-- Step 5: Grant permissions
GRANT SELECT ON public.satislar_detay_view TO authenticated;
GRANT SELECT ON public.magaza_satis_detaylari_view TO authenticated;
GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
