-- satislar tablosundaki magaza_id sütununu UUID tipine dönüştür
-- Önce mevcut yabancı anahtar kısıtlamasını düşür (eğer varsa)
ALTER TABLE public.satislar
DROP CONSTRAINT IF EXISTS satislar_magaza_id_fkey;

-- Sütunun tipini UUID olarak değiştir
-- Eğer sütunda mevcut veri varsa ve bu veriler UUID formatında değilse, bu adım hata verebilir.
-- Bu durumda, önce verileri temizlemeniz veya dönüştürmeniz gerekebilir.
-- Ancak, daha önce magazalar tablosunu sıfırladığımız için, satislar tablosunda
-- henüz magazalar.id'ye referans veren geçerli bir veri olmaması beklenir.
ALTER TABLE public.satislar
ALTER COLUMN magaza_id TYPE uuid USING (magaza_id::uuid);

-- Yeni yabancı anahtar kısıtlamasını ekle
ALTER TABLE public.satislar
ADD CONSTRAINT satislar_magaza_id_fkey FOREIGN KEY (magaza_id) REFERENCES public.magazalar(id) ON DELETE SET NULL;
