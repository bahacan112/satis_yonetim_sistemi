-- scripts/92-ensure-toplam-tutar-and-recreate-view.sql

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

-- Eğer magazalar tablosunda magaza_adi sütunu yoksa ekle (varsa zaten sorun yok)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'magazalar' AND column_name = 'magaza_adi') THEN
        ALTER TABLE public.magazalar ADD COLUMN magaza_adi text;
        RAISE NOTICE 'Column magaza_adi added to magazalar table.';
    ELSE
        RAISE NOTICE 'Column magaza_adi already exists in magazalar table.';
    END IF;
END
$$;

-- Eğer firmalar tablosunda firma_adi sütunu yoksa ekle (varsa zaten sorun yok)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firmalar' AND column_name = 'firma_adi') THEN
        ALTER TABLE public.firmalar ADD COLUMN firma_adi text;
        RAISE NOTICE 'Column firma_adi added to firmalar table.';
    ELSE
        RAISE NOTICE 'Column firma_adi already exists in firmalar table.';
    END IF;
END
$$;

-- Eğer turlar tablosunda tur_adi sütunu yoksa ekle (varsa zaten sorun yok)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turlar' AND column_name = 'tur_adi') THEN
        ALTER TABLE public.turlar ADD COLUMN tur_adi text;
        RAISE NOTICE 'Column tur_adi added to turlar table.';
    ELSE
        RAISE NOTICE 'Column tur_adi already exists in turlar table.';
    END IF;
END
$$;

-- Eğer operatorler tablosunda operator_adi sütunu yoksa ekle (varsa zaten sorun yok)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operatorler' AND column_name = 'operator_adi') THEN
        ALTER TABLE public.operatorler ADD COLUMN operator_adi text;
        RAISE NOTICE 'Column operator_adi added to operatorler table.';
    ELSE
        RAISE NOTICE 'Column operator_adi already exists in operatorler table.';
    END IF;
END
$$;

-- Eğer rehberler tablosunda rehber_adi sütunu yoksa ekle (varsa zaten sorun yok)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rehberler' AND column_name = 'rehber_adi') THEN
        ALTER TABLE public.rehberler ADD COLUMN rehber_adi text;
        RAISE NOTICE 'Column rehber_adi added to rehberler table.';
    ELSE
        RAISE NOTICE 'Column rehber_adi already exists in rehberler table.';
    END IF;
END
$$;

-- Eğer magaza_urunler tablosunda urun_adi sütunu yoksa ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'magaza_urunler' AND column_name = 'urun_adi') THEN
        ALTER TABLE public.magaza_urunler ADD COLUMN urun_adi text;
        RAISE NOTICE 'Column urun_adi added to magaza_urunler table.';
    ELSE
        RAISE NOTICE 'Column urun_adi already exists in magaza_urunler table.';
    END IF;
END
$$;

-- Eğer magaza_satis_kalemleri tablosunda toplam_tutar sütunu yoksa ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'magaza_satis_kalemleri' AND column_name = 'toplam_tutar') THEN
        ALTER TABLE public.magaza_satis_kalemleri ADD COLUMN toplam_tutar numeric; -- Veya uygun tip (decimal, float vb.)
        RAISE NOTICE 'Column toplam_tutar added to magaza_satis_kalemleri table.';
    ELSE
        RAISE NOTICE 'Column toplam_tutar already exists in magaza_satis_kalemleri table.';
    END IF;
END
$$;

-- satislar_detay_view'i düşür (eğer varsa)
DROP VIEW IF EXISTS public.satislar_detay_view;

-- satislar_detay_view'i tüm doğru sütun adlarıyla yeniden oluştur
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
    mu.urun_adi,
    sk.adet,
    sk.birim_fiyat,
    sk.toplam_tutar, -- Doğru sütun adı
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
