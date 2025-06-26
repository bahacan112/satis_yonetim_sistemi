-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'operator');

-- Profiles table for user roles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'operator',
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Firmalar tablosu
CREATE TABLE firmalar (
  id SERIAL PRIMARY KEY,
  firma_adi VARCHAR(255) NOT NULL,
  kayit_tarihi DATE DEFAULT CURRENT_DATE,
  il VARCHAR(100),
  sektor VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mağazalar tablosu
CREATE TABLE magazalar (
  id SERIAL PRIMARY KEY,
  magaza_adi VARCHAR(255) NOT NULL,
  kayit_tarihi DATE DEFAULT CURRENT_DATE,
  il VARCHAR(100),
  ilce VARCHAR(100),
  sektor VARCHAR(100),
  firma_id INTEGER REFERENCES firmalar(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ürünler tablosu
CREATE TABLE urunler (
  id SERIAL PRIMARY KEY,
  urun_adi VARCHAR(255) NOT NULL,
  firma_id INTEGER REFERENCES firmalar(id) ON DELETE CASCADE,
  satis_cirosu DECIMAL(15,2) DEFAULT 0,
  acente_komisyonu DECIMAL(5,2) DEFAULT 0,
  rehber_komisyonu DECIMAL(5,2) DEFAULT 0,
  kaptan_komisyonu DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operatörler tablosu
CREATE TABLE operatorler (
  id SERIAL PRIMARY KEY,
  operator_adi VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rehberler tablosu
CREATE TABLE rehberler (
  id SERIAL PRIMARY KEY,
  rehber_adi VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Satışlar tablosu
CREATE TABLE satislar (
  id SERIAL PRIMARY KEY,
  operator_id INTEGER REFERENCES operatorler(id),
  grup_gelis_tarihi DATE,
  magaza_giris_tarihi DATE,
  grup_pax INTEGER DEFAULT 0,
  magaza_pax INTEGER DEFAULT 0,
  tur VARCHAR(255),
  rehber_id INTEGER REFERENCES rehberler(id),
  magaza_id INTEGER REFERENCES magazalar(id),
  bekleme BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Satış Kalemleri tablosu
CREATE TABLE satis_kalemleri (
  id SERIAL PRIMARY KEY,
  satis_id INTEGER REFERENCES satislar(id) ON DELETE CASCADE,
  urun_id INTEGER REFERENCES urunler(id),
  adet INTEGER DEFAULT 0,
  birim_fiyat DECIMAL(10,2) DEFAULT 0,
  acente_komisyonu DECIMAL(5,2) DEFAULT 0,
  rehber_komisyonu DECIMAL(5,2) DEFAULT 0,
  kaptan_komisyonu DECIMAL(5,2) DEFAULT 0,
  rehber_bildirim_adet INTEGER DEFAULT 0,
  rehber_bildirim_fiyati DECIMAL(10,2) DEFAULT 0,
  rehber_bildirim_tarihi TIMESTAMP WITH TIME ZONE,
  rehber_bildirim_notu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE firmalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE magazalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE urunler ENABLE ROW LEVEL SECURITY;
ALTER TABLE operatorler ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehberler ENABLE ROW LEVEL SECURITY;
ALTER TABLE satislar ENABLE ROW LEVEL SECURITY;
ALTER TABLE satis_kalemleri ENABLE ROW LEVEL SECURITY;
