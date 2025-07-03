CREATE OR REPLACE VIEW public.firma_satis_detaylari_view AS
SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    f.id AS firma_id,
    f.firma_adi,
    op.operator_adi,
    t.tur_adi,
    r.rehber_adi,
    m.magaza_adi,
    msk.id AS satis_kalemi_id,
    msk.urun_id AS urun_id,
    u_msk.urun_adi AS urun_adi,
    msk.adet AS adet,
    msk.birim_fiyat AS birim_fiyat,
    (msk.adet * msk.birim_fiyat) AS toplam_tutar,
    msk.acente_komisyonu AS acente_komisyonu,
    msk.rehber_komisyonu AS rehber_komisyonu,
    msk.kaptan_komisyonu AS kaptan_komisyonu,
    msk.ofis_komisyonu AS ofis_komisyonu,
    msk.bekleme AS bekleme,
    msk.vade_tarihi AS vade_tarihi,
    'magaza' AS kalem_tipi
FROM
    public.satislar s
LEFT JOIN
    public.firmalar f ON s.firma_id = f.id
LEFT JOIN
    public.operatorler op ON s.operator_id = op.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
INNER JOIN
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.urunler u_msk ON msk.urun_id = u_msk.id

UNION ALL

SELECT
    s.id AS satis_id,
    s.satis_tarihi,
    s.grup_gelis_tarihi,
    s.magaza_giris_tarihi,
    s.grup_pax,
    s.magaza_pax,
    f.id AS firma_id,
    f.firma_adi,
    op.operator_adi,
    t.tur_adi,
    r.rehber_adi,
    m.magaza_adi,
    rsk.id AS satis_kalemi_id,
    rsk.urun_id AS urun_id,
    u_rsk.urun_adi AS urun_adi,
    rsk.adet AS adet,
    rsk.birim_fiyat AS birim_fiyat,
    (rsk.adet * rsk.birim_fiyat) AS toplam_tutar,
    NULL AS acente_komisyonu,
    NULL AS rehber_komisyonu,
    NULL AS kaptan_komisyonu,
    NULL AS ofis_komisyonu,
    rsk.bekleme AS bekleme,
    rsk.vade_tarihi AS vade_tarihi,
    'rehber' AS kalem_tipi
FROM
    public.satislar s
LEFT JOIN
    public.firmalar f ON s.firma_id = f.id
LEFT JOIN
    public.operatorler op ON s.operator_id = op.id
LEFT JOIN
    public.turlar t ON s.tur_id = t.id
LEFT JOIN
    public.rehberler r ON s.rehber_id = r.id
LEFT JOIN
    public.magazalar m ON s.magaza_id = m.id
INNER JOIN
    public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN
    public.urunler u_rsk ON rsk.urun_id = u_rsk.id;
