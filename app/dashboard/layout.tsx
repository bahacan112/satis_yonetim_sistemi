"use client";

import type React from "react";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  User,
  Home,
  Building2,
  Store,
  Package,
  ShoppingCart,
  Users,
  BookOpen,
  Layers,
  BarChart2,
  Calendar,
  Calculator,
  MessageSquare,
  DollarSign,
  AlertTriangle,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Auth yüklendikten sonra kontrol et
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Loading durumunda spinner göster
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Kullanıcı yoksa login'e yönlendir
  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Çıkış hatası:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Satış Yönetim Sistemi
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.email}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {userRole === "admin"
                    ? "Yönetici"
                    : userRole === "standart"
                    ? "Standart Kullanıcı"
                    : "Rehber"}
                </span>
              </div>
              <NotificationsDropdown />
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              {userRole === "rehber" ? (
                // Rehber kullanıcıları için özel menü
                <>
                  <Link
                    href="/dashboard/rehber-satis-bildirimi"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Satış Bildirimim</span>
                  </Link>
                  <Link
                    href="/dashboard/rehber-primler"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Primlerim</span>
                  </Link>
                  <Link
                    href="/dashboard/rehber-durum"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Satış Durumlarım</span>
                  </Link>
                </>
              ) : (
                // Admin ve standart kullanıcılar için tüm menü
                <>
                  {(userRole === "admin" || userRole === "standart") && (
                    <>
                      <Link
                        href="/dashboard/firmalar"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <Building2 className="h-4 w-4" />
                        <span>Firmalar</span>
                      </Link>
                      <Link
                        href="/dashboard/magazalar"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <Store className="h-4 w-4" />
                        <span>Mağazalar</span>
                      </Link>
                      <Link
                        href="/dashboard/urunler"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <Package className="h-4 w-4" />
                        <span>Ürünler</span>
                      </Link>
                      <Link
                        href="/dashboard/magaza-urunler"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <Layers className="h-4 w-4" />
                        <span>Mağaza Ürünleri</span>
                      </Link>
                      <Link
                        href="/dashboard/operatorler"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <Users className="h-4 w-4" />
                        <span>Operatörler</span>
                      </Link>
                      <Link
                        href="/dashboard/rehberler"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Rehberler</span>
                      </Link>
                      <Link
                        href="/dashboard/turlar"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Turlar</span>
                      </Link>
                      {/* New Muhasebe Link */}
                      {userRole === "admin" && (
                        <Link
                          href="/dashboard/muhasebe"
                          className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                        >
                          <Calculator className="h-4 w-4" />
                          <span>Muhasebe</span>
                        </Link>
                      )}
                      {userRole === "admin" && (
                        <Link
                          href="/dashboard/bildirimler"
                          className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                        >
                          <Bell className="h-4 w-4" />
                          <span>Bildirimler</span>
                        </Link>
                      )}
                    </>
                  )}

                  {(userRole === "admin" || userRole === "standart") && (
                    <Link
                      href="/dashboard/satislar"
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Satışlar</span>
                    </Link>
                  )}

                  {userRole === "admin" && ( // Sadece admin için analizler butonu
                    <>
                      <Link
                        href="/dashboard/bireysel-raporlar"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <BarChart2 className="h-4 w-4" />
                        <span>Bireysel Raporlar</span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
