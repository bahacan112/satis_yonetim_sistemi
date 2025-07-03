-- scripts/101-final-view-recreation.sql

-- Step 1: Drop dependent views in the correct order
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view;
DROP VIEW IF EXISTS public.satislar_detay_view;
RAISE NOTICE 'Dependent views dropped if they existed.';

-- Step 2: Ensure satislar.operator_id is UUID
DO $$
DECLARE
    fk_name TEXT;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'satislar' AND column_name = 'operator_id' AND data_type <> 'uuid'
    ) THEN
        RAISE NOTICE 'Altering satislar.operator_id to UUID. Existing integer values will become NULL.';

        -- Find and drop the foreign key constraint on operator_id if it's not referencing operatorler(id) correctly
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public' AND tc.table_name = 'satislar' AND kcu.column_name = 'operator_id';

        IF fk_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.satislar DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_name);
            RAISE NOTICE 'Dropped existing foreign key constraint % on satislar.operator_id.', fk_name;
        END IF;

        ALTER TABLE public.satislar
        ALTER COLUMN operator_id TYPE UUID USING NULL;

        ALTER TABLE public.satislar
        ADD CONSTRAINT satislar_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operatorler(id) ON DELETE SET NULL;
        RAISE NOTICE 'satislar.operator_id altered to UUID and new FK satislar_operator_id_fkey recreated.';
    ELSE
        RAISE NOTICE 'satislar.operator_id is already UUID or column does not exist.';
        -- Ensure FK exists even if type was already UUID
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'satislar' AND column_name = 'operator_id' AND data_type = 'uuid')
           AND NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'satislar' AND kcu.column_name = 'operator_id'
              AND tc.table_schema = 'public'
        ) THEN
            ALTER TABLE public.satislar
            ADD CONSTRAINT satislar_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operatorler(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added missing FK satislar_operator_id_fkey on satislar.operator_id.';
        END IF;
    END IF;
END
$$;

-- Step 3: Recreate satislar_detay_view
CREATE OR REPLACE VIEW public.satislar_detay_view AS
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
    s.operator_id, -- Assuming this is now UUID
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
LEFT JOIN public.operatorler o ON s.operator_id = o.id -- No more ::uuid cast
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
    s.operator_id, -- Assuming this is now UUID
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
LEFT JOIN public.operatorler o ON s.operator_id = o.id -- No more ::uuid cast
LEFT JOIN public.rehberler r ON s.rehber_id = r.id
LEFT JOIN public.magazalar m ON s.magaza_id = m.id
LEFT JOIN public.firmalar f ON s.firma_id = f.id
LEFT JOIN public.urunler u ON rsk.urun_id = u.id;

GRANT SELECT ON public.satislar_detay_view TO authenticated;
RAISE NOTICE 'satislar_detay_view recreated successfully.';

-- Step 4: Recreate magaza_satis_detaylari_view
CREATE OR REPLACE VIEW public.magaza_satis_detaylari_view AS
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

GRANT SELECT ON public.magaza_satis_detaylari_view TO authenticated;
RAISE NOTICE 'magaza_satis_detaylari_view recreated successfully.';

-- Step 5: Recreate magaza_muhasebe_summary_view
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
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
        SUM(acente_payi + ofis_payi) AS total_tahsilat_for_firm -- Assuming acente_payi and ofis_payi are the correct columns for sum
    FROM
        public.tahsilatlar
    GROUP BY
        firma_id
) AS tf ON m.firma_id = tf.firma_id
GROUP BY
    m.id, m.magaza_adi, tf.total_tahsilat_for_firm;

GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;
RAISE NOTICE 'magaza_muhasebe_summary_view recreated successfully.';
