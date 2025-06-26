CREATE TABLE turlar (
  id SERIAL PRIMARY KEY,
  tur_adi TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed some initial data for turlar
INSERT INTO turlar (tur_adi) VALUES
('Şehir Turu'),
('Doğa Turu'),
('Kültür Turu'),
('Macera Turu'),
('Yemek Turu')
ON CONFLICT (tur_adi) DO NOTHING;
