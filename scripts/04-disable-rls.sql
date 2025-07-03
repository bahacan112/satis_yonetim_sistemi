-- RLS'i geçici olarak devre dışı bırak (Development için)
-- Production'da RLS kullanılmalıdır!

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE firmalar DISABLE ROW LEVEL SECURITY;
ALTER TABLE magazalar DISABLE ROW LEVEL SECURITY;
ALTER TABLE urunler DISABLE ROW LEVEL SECURITY;
ALTER TABLE operatorler DISABLE ROW LEVEL SECURITY;
ALTER TABLE rehberler DISABLE ROW LEVEL SECURITY;
ALTER TABLE satislar DISABLE ROW LEVEL SECURITY;
ALTER TABLE satis_kalemleri DISABLE ROW LEVEL SECURITY;

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything on firmalar" ON firmalar;
DROP POLICY IF EXISTS "Operators can view firmalar" ON firmalar;
DROP POLICY IF EXISTS "Admins can do everything on magazalar" ON magazalar;
DROP POLICY IF EXISTS "Operators can view magazalar" ON magazalar;
DROP POLICY IF EXISTS "Admins can do everything on urunler" ON urunler;
DROP POLICY IF EXISTS "Operators can view urunler" ON urunler;
DROP POLICY IF EXISTS "Admins can do everything on operatorler" ON operatorler;
DROP POLICY IF EXISTS "Operators can view operatorler" ON operatorler;
DROP POLICY IF EXISTS "Admins can do everything on rehberler" ON rehberler;
DROP POLICY IF EXISTS "Operators can view rehberler" ON rehberler;
DROP POLICY IF EXISTS "Admins can do everything on satislar" ON satislar;
DROP POLICY IF EXISTS "Operators can view satislar" ON satislar;
DROP POLICY IF EXISTS "Admins can do everything on satis_kalemleri" ON satis_kalemleri;
DROP POLICY IF EXISTS "Operators can view satis_kalemleri" ON satis_kalemleri;
DROP POLICY IF EXISTS "Operators can update rehber bildirim on satis_kalemleri" ON satis_kalemleri;

-- Helper fonksiyonları kaldır
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_operator();

-- Test için admin profili oluştur (UUID'yi kendi kullanıcı ID'nizle değiştirin)
-- INSERT INTO profiles (id, role, full_name) 
-- VALUES ('your-user-id-here', 'admin', 'Test Admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
