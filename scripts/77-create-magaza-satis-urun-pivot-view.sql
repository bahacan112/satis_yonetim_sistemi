-- Drop existing view if it exists
DROP VIEW IF EXISTS magaza_satis_urun_pivot_view;

CREATE OR REPLACE VIEW magaza_satis_urun_pivot_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    s.magaza_id,
    m.magaza_adi,
    m.firma_id,
    f.firma_adi,
    s.operator_id,
    o.operator_adi,
    s.tur_id,
    t.tur_adi,
    s.rehber_id,
    r.rehber_adi,
    s.created_at,
    -- Pivoted product columns (assuming these are your main product categories)
    COALESCE(SUM(CASE WHEN u.urun_adi = 'Altın' THEN msk.adet * msk.birim_fiyat ELSE 0 END), 0) AS altin_satis,
    COALESCE(SUM(CASE WHEN u.urun_adi = 'Gümüş' THEN msk.adet * msk.birim_fiyat ELSE 0 END), 0) AS gumus_satis,
    COALESCE(SUM(CASE WHEN u.urun_adi = 'Saat' THEN msk.adet * msk.birim_fiyat ELSE 0 END), 0) AS saat_satis,
    COALESCE(SUM(CASE WHEN u.urun_adi = 'Sade Taş' THEN msk.adet * msk.birim_fiyat ELSE 0 END), 0) AS sade_tas_satis,
    COALESCE(SUM(CASE WHEN u.urun_adi = 'Tek Taş' THEN msk.adet * msk.birim_fiyat ELSE 0 END), 0) AS tek_tas_satis,
    COALESCE(SUM(CASE WHEN u.urun_adi = 'Pırlanta' THEN msk.adet * msk.birim_fiyat ELSE 0 END), 0) AS pirlanta_satis,
    COALESCE(SUM(CASE WHEN u.urun_adi = 'Fantezi' THEN msk.adet * msk.birim_fiyat ELSE 0 END), 0) AS fantezi_satis,
    -- Totals and commissions for the entire sale
    SUM(msk.adet * msk.birim_fiyat) AS toplam_satis_tutari,
    SUM(msk.adet * msk.birim_fiyat * msk.acente_komisyonu / 100) AS acente_komisyon_tutari,
    SUM(msk.adet * msk.birim_fiyat * msk.rehber_komisyonu / 100) AS rehber_komisyon_tutari,
    SUM(msk.adet * msk.birim_fiyat * msk.kaptan_komisyonu / 100) AS kaptan_komisyon_tutari,
    SUM(msk.adet * msk.birim_fiyat * msk.ofis_komisyonu / 100) AS ofis_komisyon_tutari,
    -- Assuming bekleme and vade_tarihi are per sale, not per item.
    MAX(msk.bekleme) AS bekleme,
    MAX(msk.vade_tarihi) AS vade_tarihi
FROM
    satislar s
JOIN
    magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    urunler u ON msk.urun_id = u.id
LEFT JOIN
    magazalar m ON s.magaza_id = m.id
LEFT JOIN
    firmalar f ON m.firma_id = f.id
LEFT JOIN
    operatorler o ON s.operator_id = o.id
LEFT JOIN
    turlar t ON s.tur_id = t.id
LEFT JOIN
    rehberler r ON s.rehber_id = r.id
GROUP BY
    s.id, s.satis_tarihi, s.grup_gelis_tarihi, s.magaza_giris_tarihi, s.grup_pax, s.magaza_pax,
    s.magaza_id, m.magaza_adi, m.firma_id, f.firma_adi, s.operator_id, o.operator_adi,
    s.tur_id, t.tur_adi, s.rehber_id, r.rehber_adi, s.created_at
ORDER BY
    s.satis_tarihi DESC, s.id DESC;

GRANT SELECT ON magaza_satis_urun_pivot_view TO authenticated;
