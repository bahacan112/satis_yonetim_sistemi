-- scripts/89-fix-satislar-detay-view-rehber-id-type.sql

-- Eğer turlar tablosunda operator_id sütunu yoksa ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turlar' AND column_name = 'operator_id') THEN
        ALTER TABLE public.turlar ADD COLUMN operator_id uuid;
        -- Eğer operatorler tablosunun id'si uuid ise bu FK'yı ekle
        ALTER TABLE public.turlar ADD CONSTRAINT fk_operator FOREIGN KEY (operator_id) REFERENCES public.operatorler(id) ON DELETE SET NULL;
        RAISE NOTICE 'Column operator_id added to turlar table.';
    ELSE
        RAISE NOTICE 'Column operator_id already exists in turlar table.';
    END IF;
END
$$;

-- satislar_detay_view'i düşür (eğer varsa)
DROP VIEW IF EXISTS public.satislar_detay_view;

-- satislar_detay_view'i rehber bilgileriyle yeniden oluştur
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
    r.rehber_adi, -- Düzeltme: r.adi yerine r.rehber_adi kullanıldı
    sk.urun_id,
    mu.urun_adi,
    sk.adet,
    sk.birim_fiyat,
    sk.toplam_tutar,
    sk.bekleme_suresi,
    sk.vade_tarihi,
    sk.ofis_komisyonu
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
    public.magaza_urunler mu ON sk.urun_id = mu.id AND s.magaza_id = mu.magaza_id;
