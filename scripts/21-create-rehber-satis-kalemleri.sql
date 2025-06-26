-- Rehber Satış Kalemleri tablosu
CREATE TABLE rehber_satis_kalemleri (
  id SERIAL PRIMARY KEY,
  satis_id INTEGER REFERENCES satislar(id) ON DELETE CASCADE,
  urun_id INTEGER REFERENCES urunler(id),
  adet INTEGER DEFAULT 0,
  birim_fiyat DECIMAL(10,2) DEFAULT 0,
  bildirim_tarihi DATE DEFAULT CURRENT_DATE,
  bildirim_notu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS'i etkinleştir
ALTER TABLE rehber_satis_kalemleri ENABLE ROW LEVEL SECURITY;
