CREATE TABLE magaza_satis_kalemleri (
  id SERIAL PRIMARY KEY,
  satis_id INTEGER REFERENCES satislar(id) ON DELETE CASCADE,
  urun_id INTEGER REFERENCES urunler(id),
  adet INTEGER DEFAULT 0,
  birim_fiyat DECIMAL(10,2) DEFAULT 0,
  acente_komisyonu DECIMAL(5,2) DEFAULT 0,
  rehber_komisyonu DECIMAL(5,2) DEFAULT 0,
  kaptan_komisyonu DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE magaza_satis_kalemleri ENABLE ROW LEVEL SECURITY;
