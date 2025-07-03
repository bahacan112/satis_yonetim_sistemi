"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  ShoppingCart,
  Calculator,
  Building2,
  TrendingUp,
  Shield,
  Database,
  CheckCircle,
  Globe,
  PieChart,
  Clock,
  Smartphone,
  Zap,
  HeadphonesIcon,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const [hasAdminUser, setHasAdminUser] = useState<boolean | null>(null);
  const [tablesExist, setTablesExist] = useState<boolean | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    checkSystemSetup();
  }, []);

  const checkSystemSetup = async () => {
    try {
      setCheckingSetup(true);
      console.log("Checking system setup...");

      const res = await fetch("/api/system-setup");
      console.log("API response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("API request failed:", {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
        });

        // Set default values on API failure
        setTablesExist(false);
        setHasAdminUser(false);
        return;
      }

      const data = await res.json();
      console.log("API response data:", data);

      setTablesExist(data.tablesExist || false);
      setHasAdminUser(data.hasAdminUser || false);
    } catch (error) {
      console.error("Setup check error:", error);
      // Set default values on any error
      setTablesExist(false);
      setHasAdminUser(false);
    } finally {
      setCheckingSetup(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Loading state
  if (loading || checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Sistem kurulumu tamamlanmamışsa kurulum sayfalarına yönlendir
  if (!tablesExist || !hasAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-blue-600 p-2 rounded-md">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-gray-900">
                    Satış Yönetim Sistemi
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Setup Required Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-blue-600 p-3 rounded-md w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Database className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Sistem Kurulumu Gerekli</CardTitle>
              <CardDescription>
                {!tablesExist
                  ? "Veritabanı tabloları henüz oluşturulmamış"
                  : "Admin kullanıcısı oluşturulması gerekiyor"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-gray-600">
                {!tablesExist
                  ? "Sistemi kullanmaya başlamak için önce veritabanı tablolarını oluşturun."
                  : "Veritabanı hazır! Şimdi bir admin kullanıcısı oluşturun."}
              </p>
              <div className="space-y-3">
                {!tablesExist ? (
                  <>
                    <Button
                      asChild
                      className="w-full bg-black hover:bg-gray-800 text-white"
                    >
                      <Link href="/self-hosted-guide">Kurulum Rehberi</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      <Link href="/test-connection">Bağlantı Testi</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      className="w-full bg-black hover:bg-gray-800 text-white"
                    >
                      <Link href="/simple-setup">Admin Oluştur</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      <Link href="/setup">Detaylı Kurulum</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Ana landing page - giriş yapılsın ya da yapılmasın göster
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-600 p-2 rounded-md">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  Satış Yönetim Sistemi
                </h1>
                <p className="text-sm text-gray-500">Turizm Sektörü Çözümü</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <Button
                    asChild
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    Çıkış
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <Link href="/login">Giriş Yap</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge
              variant="secondary"
              className="mb-6 bg-blue-50 text-blue-700 border-blue-200"
            >
              <Globe className="w-4 h-4 mr-2" />
              Turizm Sektörü İçin Özel Tasarım
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="text-blue-600">Satış Yönetim</span>
              <span className="block text-gray-900">Sistemi</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Turizm sektörü için özel olarak tasarlanmış, kapsamlı satış
              yönetim ve muhasebe sistemi. Rehberler, mağazalar, satışlar ve
              komisyonları tek platformda yönetin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Link href="/dashboard">Dashboard'a Git</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#features">Özellikleri Keşfet</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Link href="/login">Sisteme Giriş Yap</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#features">Özellikleri Keşfet</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Güçlü Özellikler
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Turizm sektörünün ihtiyaçlarına özel olarak tasarlanmış kapsamlı
              çözümler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Satış Yönetimi */}
            <Card className="hover:shadow-lg transition-shadow duration-300 bg-white border">
              <CardHeader>
                <div className="bg-blue-600 p-3 rounded-md w-fit mb-4">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Satış Yönetimi</CardTitle>
                <CardDescription>
                  Tüm satış süreçlerinizi dijitalleştirin ve takip edin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Satış kaydı ve onay süreci
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Ürün ve tur yönetimi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Durum takibi (Beklemede, Onaylandı, İptal)
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Muhasebe */}
            <Card className="hover:shadow-lg transition-shadow duration-300 bg-white border">
              <CardHeader>
                <div className="bg-green-600 p-3 rounded-md w-fit mb-4">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Muhasebe & Komisyon</CardTitle>
                <CardDescription>
                  Otomatik komisyon hesaplama ve muhasebe takibi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Acente ve ofis komisyonu hesaplama
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Tahsilat takibi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Firma bazlı muhasebe özeti
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Analiz ve Raporlama */}
            <Card className="hover:shadow-lg transition-shadow duration-300 bg-white border">
              <CardHeader>
                <div className="bg-purple-600 p-3 rounded-md w-fit mb-4">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Analiz & Raporlama</CardTitle>
                <CardDescription>
                  Detaylı analizler ve görsel raporlar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Bireysel performans raporları
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Karşılaştırmalı analizler
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    PDF rapor dışa aktarma
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Kullanıcı Yönetimi */}
            <Card className="hover:shadow-lg transition-shadow duration-300 bg-white border">
              <CardHeader>
                <div className="bg-orange-600 p-3 rounded-md w-fit mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Kullanıcı Yönetimi</CardTitle>
                <CardDescription>
                  Rol tabanlı erişim kontrolü ve kullanıcı yönetimi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Admin, Standart, Rehber rolleri
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Güvenli kimlik doğrulama
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Kişiselleştirilmiş dashboard
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Firma & Mağaza Yönetimi */}
            <Card className="hover:shadow-lg transition-shadow duration-300 bg-white border">
              <CardHeader>
                <div className="bg-red-600 p-3 rounded-md w-fit mb-4">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Firma & Mağaza</CardTitle>
                <CardDescription>
                  Merkezi firma ve mağaza yönetimi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Çoklu firma desteği
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Mağaza bazlı ürün yönetimi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Hiyerarşik organizasyon yapısı
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Mobil Uyumlu */}
            <Card className="hover:shadow-lg transition-shadow duration-300 bg-white border">
              <CardHeader>
                <div className="bg-teal-600 p-3 rounded-md w-fit mb-4">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Mobil Uyumlu</CardTitle>
                <CardDescription>Her cihazdan erişim imkanı</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Responsive tasarım
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Tablet ve telefon desteği
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Saha çalışanları için optimize
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Avantajlar
            </h2>
            <p className="text-lg text-gray-600">
              Neden bu sistemi tercih etmelisiniz?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Zaman Tasarrufu
              </h3>
              <p className="text-gray-600">
                Manuel işlemleri otomatikleştirerek zamandan tasarruf edin
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Hata Minimizasyonu
              </h3>
              <p className="text-gray-600">
                Otomatik hesaplamalar ile insan kaynaklı hataları azaltın
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Performans Takibi
              </h3>
              <p className="text-gray-600">
                Detaylı raporlar ile performansınızı sürekli izleyin
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-600 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Hızlı Karar Alma
              </h3>
              <p className="text-gray-600">
                Anlık veriler ile daha hızlı ve doğru kararlar alın
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Neden Bu Sistem?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Turizm sektöründe faaliyet gösteren firmalar için özel olarak
            geliştirilmiş bu sistem, satış süreçlerinizi dijitalleştirerek
            verimliliğinizi artırır. Rehber yönetiminden komisyon
            hesaplamalarına, muhasebe takibinden detaylı raporlamaya kadar tüm
            ihtiyaçlarınızı karşılar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="bg-blue-500 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Güvenli</h3>
              <p className="text-blue-100">
                Verileriniz güvenli sunucularda korunur
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <HeadphonesIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Destek</h3>
              <p className="text-blue-100">7/24 teknik destek hizmeti</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Büyüme</h3>
              <p className="text-blue-100">
                İşletmenizle birlikte büyüyen sistem
              </p>
            </div>
          </div>
          {!user && (
            <div className="mt-12">
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-gray-100"
              >
                <Link href="/login">Sistemi Deneyin</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-2 rounded-md">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-lg font-semibold">
                  Satış Yönetim Sistemi
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Turizm sektörü için özel olarak tasarlanmış, kapsamlı satış
                yönetim ve muhasebe sistemi.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Özellikler</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors">
                  Satış Yönetimi
                </li>
                <li className="hover:text-white transition-colors">
                  Muhasebe & Komisyon
                </li>
                <li className="hover:text-white transition-colors">
                  Analiz & Raporlama
                </li>
                <li className="hover:text-white transition-colors">
                  Kullanıcı Yönetimi
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Avantajlar</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors">
                  Zaman Tasarrufu
                </li>
                <li className="hover:text-white transition-colors">
                  Hata Minimizasyonu
                </li>
                <li className="hover:text-white transition-colors">
                  Performans Takibi
                </li>
                <li className="hover:text-white transition-colors">
                  Mobil Uyumlu
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Satış Yönetim Sistemi. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
