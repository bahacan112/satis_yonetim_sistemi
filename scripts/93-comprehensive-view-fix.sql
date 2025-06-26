-- scripts/93-comprehensive-view-fix.sql

-- Function to add a column if it does not exist
DROP FUNCTION IF EXISTS add_column_if_not_exists(text, text, text, text, boolean);
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    p_table_name text,
    p_column_name text,
    p_column_type text,
    p_default_value text DEFAULT NULL,
    p_is_nullable boolean DEFAULT TRUE
)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = p_table_name
          AND column_name = p_column_name
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s %s %s',
                       p_table_name,
                       p_column_name,
                       p_column_type,
                       CASE WHEN p_default_value IS NOT NULL THEN 'DEFAULT ' || p_default_value ELSE '' END,
                       CASE WHEN NOT p_is_nullable THEN 'NOT NULL' ELSE '' END);
        RAISE NOTICE 'Column %I added to table %I.', p_column_name, p_table_name;
    ELSE
        RAISE NOTICE 'Column %I already exists in table %I.', p_column_name, p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure column type and migrate data if necessary
DROP FUNCTION IF EXISTS ensure_column_type(text, text, text);
CREATE OR REPLACE FUNCTION ensure_column_type(
    p_table_name text,
    p_column_name text,
    p_target_type text
)
RETURNS void AS $$
DECLARE
    current_type text;
BEGIN
    SELECT data_type INTO current_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_name;

    IF current_type IS NOT NULL AND current_type <> p_target_type THEN
        RAISE NOTICE 'Column %I.%I current type is %s, converting to %s.', p_table_name, p_column_name, current_type, p_target_type;
        IF p_target_type = 'boolean' AND current_type IN ('integer', 'numeric', 'text') THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE boolean USING CASE WHEN %I::text = ''1'' THEN TRUE WHEN %I::text = ''0'' THEN FALSE ELSE FALSE END',
                           p_table_name, p_column_name, p_column_name, p_column_name);
        ELSIF p_target_type = 'numeric' AND current_type IN ('integer', 'text', 'boolean') THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE numeric USING %I::numeric',
                           p_table_name, p_column_name, p_column_name);
        ELSIF p_target_type = 'text' AND current_type IN ('integer', 'numeric', 'boolean', 'uuid') THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE text USING %I::text',
                           p_table_name, p_column_name, p_column_name);
        ELSIF p_target_type = 'uuid' AND current_type IN ('text') THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE uuid USING %I::uuid',
                           p_table_name, p_column_name, p_column_name);
        ELSE
            RAISE WARNING 'Unsupported type conversion from %s to %s for column %I.%I. Manual intervention may be required.', current_type, p_target_type, p_table_name, p_column_name;
        END IF;
    ELSIF current_type IS NOT NULL AND current_type = p_target_type THEN
        RAISE NOTICE 'Column %I.%I already has target type %s.', p_table_name, p_column_name, p_target_type;
    ELSE
        RAISE NOTICE 'Column %I.%I does not exist or could not determine type.', p_table_name, p_column_name;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- Drop dependent views first
DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;
DROP VIEW IF EXISTS public.magaza_satis_detaylari_view;
DROP VIEW IF EXISTS public.satislar_detay_view;


-- Ensure columns exist in 'magaza_satis_kalemleri'
SELECT add_column_if_not_exists('magaza_satis_kalemleri', 'bekleme_suresi', 'boolean', 'FALSE');
SELECT add_column_if_not_exists('magaza_satis_kalemleri', 'toplam_tutar', 'numeric', '0.00');
SELECT add_column_if_not_exists('magaza_satis_kalemleri', 'vade_tarihi', 'date');
SELECT add_column_if_not_exists('magaza_satis_kalemleri', 'ofis_komisyonu', 'numeric', '0.00');
SELECT add_column_if_not_exists('magaza_satis_kalemleri', 'acente_komisyonu', 'numeric', '0.00');
SELECT add_column_if_not_exists('magaza_satis_kalemleri', 'rehber_komisyonu', 'numeric', '0.00');
SELECT add_column_if_not_exists('magaza_satis_kalemleri', 'kaptan_komisyonu', 'numeric', '0.00');
SELECT add_column_if_not_exists('magaza_satis_kalemleri', 'urun_id', 'uuid');
SELECT add_column_if_not_exists('magaza_satis_kalemleri', 'satis_id', 'uuid');

-- Ensure columns exist in 'rehber_satis_kalemleri'
SELECT add_column_if_not_exists('rehber_satis_kalemleri', 'bekleme_suresi', 'boolean', 'FALSE');
SELECT add_column_if_not_exists('rehber_satis_kalemleri', 'vade_tarihi', 'date');
SELECT add_column_if_not_exists('rehber_satis_kalemleri', 'urun_id', 'uuid');
SELECT add_column_if_not_exists('rehber_satis_kalemleri', 'satis_id', 'uuid');

-- Ensure columns exist in 'satislar'
SELECT add_column_if_not_exists('satislar', 'tur_id', 'uuid');
SELECT add_column_if_not_exists('satislar', 'magaza_id', 'uuid');
SELECT add_column_if_not_exists('satislar', 'rehber_id', 'uuid');

-- Ensure columns exist in 'turlar'
SELECT add_column_if_not_exists('turlar', 'tur_adi', 'text');
SELECT add_column_if_not_exists('turlar', 'operator_id', 'uuid');

-- Ensure columns exist in 'magazalar'
SELECT add_column_if_not_exists('magazalar', 'magaza_adi', 'text');
SELECT add_column_if_not_exists('magazalar', 'firma_id', 'uuid');

-- Ensure columns exist in 'urunler'
SELECT add_column_if_not_exists('urunler', 'urun_adi', 'text');

-- Ensure columns exist in 'firmalar'
SELECT add_column_if_not_exists('firmalar', 'firma_adi', 'text');

-- Ensure columns exist in 'rehberler'
SELECT add_column_if_not_exists('rehberler', 'rehber_adi', 'text');

-- Ensure columns exist in 'operatorler'
SELECT add_column_if_not_exists('operatorler', 'operator_adi', 'text');


-- Ensure correct types for existing columns
SELECT ensure_column_type('magaza_satis_kalemleri', 'bekleme_suresi', 'boolean');
SELECT ensure_column_type('magaza_satis_kalemleri', 'toplam_tutar', 'numeric');
SELECT ensure_column_type('magaza_satis_kalemleri', 'ofis_komisyonu', 'numeric');
SELECT ensure_column_type('rehber_satis_kalemleri', 'bekleme_suresi', 'boolean');


-- Recreate satislar_detay_view
CREATE OR REPLACE VIEW public.satislar_detay_view AS
SELECT
    s.id AS satis_id,
    s.created_at AS satis_tarihi,
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.tur_id,
    t.tur_adi,
    t.operator_id,
    o.operator_adi,
    s.rehber_id,
    r.rehber_adi,
    sk.urun_id,
    u.urun_adi,
    sk.adet,
    sk.birim_fiyat,
    sk.toplam_tutar,
    sk.bekleme_suresi,
    sk.vade_tarihi,
    sk.ofis_komisyonu,
    'magaza' AS bildirim_tipi,
    sk.acente_komisyonu,
    sk.rehber_komisyonu,
    sk.kaptan_komisyonu,
    (sk.adet * sk.birim_fiyat * sk.acente_komisyonu / 100) AS acente_komisyon_tutari,
    (sk.adet * sk.birim_fiyat * sk.rehber_komisyonu / 100) AS rehber_komisyon_tutari,
    (sk.adet * sk.birim_fiyat * sk.kaptan_komisyonu / 100) AS kaptan_komisyon_tutari,
    (sk.adet * sk.birim_fiyat * sk.ofis_komisyonu / 100) AS ofis_komisyon_tutari
FROM
    public.satislar s
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.operatorler o ON t.operator_id = o.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.magaza_satis_kalemleri sk ON s.id = sk.satis_id
LEFT JOIN
    public.urunler u ON sk.urun_id = u.id
WHERE sk.satis_id IS NOT NULL

UNION ALL

SELECT
    s.id AS satis_id,
    s.created_at AS satis_tarihi,
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.tur_id,
    t.tur_adi,
    t.operator_id,
    o.operator_adi,
    s.rehber_id,
    r.rehber_adi,
    rsk.urun_id,
    u.urun_adi,
    rsk.adet,
    rsk.birim_fiyat,
    (rsk.adet * rsk.birim_fiyat)::numeric AS toplam_tutar,
    rsk.bekleme_suresi,
    rsk.vade_tarihi,
    NULL::numeric AS ofis_komisyonu,
    'rehber' AS bildirim_tipi,
    NULL::numeric AS acente_komisyonu,
    NULL::numeric AS rehber_komisyonu,
    NULL::numeric AS kaptan_komisyonu,
    NULL::numeric AS acente_komisyon_tutari,
    NULL::numeric AS rehber_komisyon_tutari,
    NULL::numeric AS kaptan_komisyon_tutari,
    NULL::numeric AS ofis_komisyon_tutari
FROM
    public.satislar s
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.operatorler o ON t.operator_id = o.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN
    public.urunler u ON rsk.urun_id = u.id
WHERE rsk.satis_id IS NOT NULL;


-- Recreate magaza_muhasebe_summary_view
CREATE OR REPLACE VIEW public.magaza_muhasebe_summary_view AS
SELECT
    m.id AS magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    COALESCE(SUM(sdv.toplam_tutar), 0) AS toplam_satis_tutari,
    COALESCE(SUM(sdv.acente_komisyon_tutari), 0) AS toplam_acente_komisyonu,
    COALESCE(SUM(sdv.rehber_komisyon_tutari), 0) AS toplam_rehber_komisyonu,
    COALESCE(SUM(sdv.kaptan_komisyon_tutari), 0) AS toplam_kaptan_komisyonu,
    COALESCE(SUM(sdv.ofis_komisyon_tutari), 0) AS toplam_ofis_komisyonu,
    COALESCE(SUM(t.acente_payi), 0) AS toplam_acente_tahsilat,
    COALESCE(SUM(t.ofis_payi), 0) AS toplam_ofis_tahsilat,
    (COALESCE(SUM(sdv.acente_komisyon_tutari), 0) - COALESCE(SUM(t.acente_payi), 0)) AS kalan_acente_alacagi,
    (COALESCE(SUM(sdv.ofis_komisyon_tutari), 0) - COALESCE(SUM(t.ofis_payi), 0)) AS kalan_ofis_alacagi
FROM
    public.magazalar m
LEFT JOIN
    public.satislar_detay_view sdv ON m.id = sdv.magaza_id AND sdv.bildirim_tipi = 'magaza'
LEFT JOIN
    public.tahsilatlar t ON m.id = t.magaza_id
LEFT JOIN
    public.firmalar f ON m.firma_id = f.id
GROUP BY
    m.id, m.magaza_adi, m.firma_id, f.firma_adi
ORDER BY
    m.magaza_adi;

-- Grant select privileges to authenticated users
GRANT SELECT ON public.satislar_detay_view TO authenticated;
GRANT SELECT ON public.magaza_muhasebe_summary_view TO authenticated;

-- Recreate magaza_satis_detaylari_view (depends on satislar_detay_view)
CREATE OR REPLACE VIEW public.magaza_satis_detaylari_view AS
SELECT
    sdv.satis_id,
    sdv.satis_tarihi,
    NULL AS grup_gelis_tarihi,
    NULL AS magaza_giris_tarihi,
    NULL AS grup_pax,
    NULL AS magaza_pax,
    sdv.tur_id,
    sdv.tur_adi,
    sdv.rehber_id,
    sdv.rehber_adi,
    sdv.magaza_id,
    sdv.magaza_adi,
    sdv.firma_id,
    sdv.firma_adi,
    sdv.operator_id,
    sdv.operator_adi,
    sdv.urun_id,
    sdv.urun_adi,
    sdv.adet,
    sdv.birim_fiyat,
    sdv.acente_komisyonu,
    sdv.rehber_komisyonu,
    sdv.kaptan_komisyonu,
    sdv.toplam_tutar,
    sdv.acente_komisyon_tutari,
    sdv.rehber_komisyon_tutari,
    sdv.kaptan_komisyon_tutari,
    sdv.ofis_komisyon_tutari,
    sdv.bekleme_suresi AS bekleme,
    sdv.vade_tarihi,
    sdv.satis_tarihi AS created_at
FROM
    public.satislar_detay_view sdv
WHERE
    sdv.bildirim_tipi = 'magaza';

GRANT SELECT ON public.magaza_satis_detaylari_view TO authenticated;
