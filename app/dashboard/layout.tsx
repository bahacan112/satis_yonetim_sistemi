"use client";

import type React from "react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Menu,
  Shield,
  Languages,
} from "lucide-react";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { useI18n } from '@/contexts/i18n-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading, signOut } = useAuth();
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
    if (signingOut) return; // Çift tıklamayı önle

    try {
      setSigningOut(true);
      await signOut();
      // Başarılı çıkış sonrası kesin yönlendirme
      window.location.href = "/";
    } catch (error) {
      console.error(t('auth.signOutError'), error);
      // Hata durumunda da yönlendir
      window.location.href = "/";
    } finally {
      setSigningOut(false);
    }
  };

  const switchLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  };

  // Menü öğeleri
  const menuItems = [
    {
      href: "/dashboard",
      icon: Home,
      label: t('navigation.dashboard'),
      show: true,
    },
    // Rehber kullanıcıları için özel menü
    ...(userRole === "rehber"
      ? [
          {
            href: "/dashboard/rehber-satis-bildirimi",
            icon: MessageSquare,
            label: t('navigation.mySalesNotification'),
            show: true,
          },
          {
            href: "/dashboard/rehber-primler",
            icon: DollarSign,
            label: t('navigation.myCommissions'),
            show: true,
          },
          {
            href: "/dashboard/rehber-durum",
            icon: AlertTriangle,
            label: t('navigation.mySalesStatus'),
            show: true,
          },
        ]
      : [
          // Admin ve standart kullanıcılar için menü
          {
            href: "/dashboard/firmalar",
            icon: Building2,
            label: t('navigation.companies'),
            show: userRole === "admin",
          },
          {
            href: "/dashboard/magazalar",
            icon: Store,
            label: t('navigation.stores'),
            show: userRole === "admin",
          },
          {
            href: "/dashboard/urunler",
            icon: Package,
            label: t('navigation.products'),
            show: userRole === "admin",
          },
          {
            href: "/dashboard/magaza-urunler",
            icon: Layers,
            label: t('navigation.storeProducts'),
            show: userRole === "admin",
          },
          {
            href: "/dashboard/operatorler",
            icon: Users,
            label: t('navigation.operators'),
            show: userRole === "admin",
          },
          {
            href: "/dashboard/rehberler",
            icon: BookOpen,
            label: t('navigation.guides'),
            show: userRole === "admin" || userRole === "standart",
          },
          {
            href: "/dashboard/turlar",
            icon: Calendar,
            label: t('navigation.tours'),
            show: userRole === "admin" || userRole === "standart",
          },
          {
            href: "/dashboard/muhasebe",
            icon: Calculator,
            label: t('navigation.accounting'),
            show: userRole === "admin",
          },
          {
            href: "/dashboard/bildirimler",
            icon: Bell,
            label: t('navigation.notifications'),
            show: userRole === "admin",
          },
          {
            href: "/dashboard/satislar",
            icon: ShoppingCart,
            label: t('navigation.sales'),
            show: userRole === "admin" || userRole === "standart",
          },
          {
            href: "/dashboard/bireysel-raporlar",
            icon: BarChart2,
            label: t('navigation.individualReports'),
            show: userRole === "admin",
          },
        ]),
    {
      href: "/dashboard/security",
      icon: Shield,
      label: t('navigation.security'),
      show: userRole === "admin",
    },
  ].filter((item) => item.show);

  // Sidebar içeriği
  const SidebarContent = () => (
    <div className="p-4">
      <div className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
            onClick={() => setSidebarOpen(false)} // Mobilde menü kapansın
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Hamburger menü butonu - sadece mobil ve tablette görünür */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden mr-2"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">{t('navigation.openMenu')}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-lg font-semibold text-gray-900">
                      {t('navigation.menu')}
                    </SheetTitle>
                  </SheetHeader>
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <h1 className="text-xl font-semibold text-gray-900">
                {t('dashboard.title')}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 hidden sm:inline">
                  {user.email}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {userRole === "admin"
                    ? t('userRoles.admin')
                    : userRole === "standart"
                    ? t('userRoles.standard')
                    : t('userRoles.guide')}
                </span>
              </div>
              
              {/* Language Switcher */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={switchLanguage}
                  className="flex items-center space-x-1"
                >
                  <Languages className="h-4 w-4" />
                  <span className="text-xs">{language === 'tr' ? 'EN' : 'TR'}</span>
                </Button>
              </div>
              
              <NotificationsDropdown />
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                disabled={signingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">
                  {signingOut ? t('auth.signingOut') : t('auth.logout')}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar - sadece md ve üzeri ekranlarda görünür */}
        <nav className="hidden md:block w-64 bg-white shadow-sm min-h-screen">
          <SidebarContent />
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
