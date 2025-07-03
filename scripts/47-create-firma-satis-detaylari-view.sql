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
    msk.id AS magaza_satis_kalemi_id,
    msk.urun_id AS magaza_urun_id,
    u_msk.urun_adi AS magaza_urun_adi,
    msk.adet AS magaza_adet,
    msk.birim_fiyat AS magaza_birim_fiyat,
    msk.acente_komisyonu AS magaza_acente_komisyonu,
    msk.rehber_komisyonu AS magaza_rehber_komisyonu,
    msk.kaptan_komisyonu AS magaza_kaptan_komisyonu,
    msk.ofis_komisyonu AS magaza_ofis_komisyonu,
    msk.bekleme AS magaza_bekleme,
    msk.vade_tarihi AS magaza_vade_tarihi,
    rsk.id AS rehber_satis_kalemi_id,
    rsk.urun_id AS rehber_urun_id,
    u_rsk.urun_adi AS rehber_urun_adi,
    rsk.adet AS rehber_adet,
    rsk.birim_fiyat AS rehber_birim_fiyat,
    rsk.bekleme AS rehber_bekleme,
    rsk.vade_tarihi AS rehber_vade_tarihi
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
LEFT JOIN
    public.magaza_satis_kalemleri msk ON s.id = msk.satis_id
LEFT JOIN
    public.urunler u_msk ON msk.urun_id = u_msk.id
LEFT JOIN
    public.rehber_satis_kalemleri rsk ON s.id = rsk.satis_id
LEFT JOIN
    public.urunler u_rsk ON rsk.urun_id = u_rsk.id;
