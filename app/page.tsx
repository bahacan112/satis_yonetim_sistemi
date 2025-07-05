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
import { useI18n } from '@/contexts/i18n-context';
import { Languages } from "lucide-react";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const { language, setLanguage, t } = useI18n();
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
          <p className="text-gray-600">{t('common.loading')}</p>
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
              <CardTitle className="text-xl">{t('dashboard.systemSetupRequired')}</CardTitle>
              <CardDescription>
                {!tablesExist
                  ? t('dashboard.databaseNotCreated')
                  : t('dashboard.adminUserNeeded')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-gray-600">
                {!tablesExist
                  ? t('dashboard.setupInstructions')
                  : t('dashboard.adminInstructions')}
              </p>
              <div className="space-y-3">
                {!tablesExist ? (
                  <>
                    <Button
                      asChild
                      className="w-full bg-black hover:bg-gray-800 text-white"
                    >
                      <Link href="/self-hosted-guide">{t('dashboard.setupGuide')}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      <Link href="/test-connection">{t('dashboard.connectionTest')}</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      className="w-full bg-black hover:bg-gray-800 text-white"
                    >
                      <Link href="/simple-setup">{t('dashboard.createAdmin')}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      <Link href="/setup">{t('dashboard.detailedSetup')}</Link>
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
                  {t('dashboard.title')}
                </h1>
                <p className="text-sm text-gray-500">{t('dashboard.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Language Switcher */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                className="flex items-center space-x-1"
              >
                <Languages className="h-4 w-4" />
                <span className="text-xs">{language === 'tr' ? 'EN' : 'TR'}</span>
              </Button>
              
              {user ? (
                <>
                  <Button
                    asChild
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Link href="/dashboard">{t('navigation.dashboard')}</Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    {t('auth.logout')}
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <Link href="/login">{t('auth.login')}</Link>
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
              {t('homepage.specialDesign')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="text-blue-600">{t('homepage.salesManagement')}</span>
              <span className="block text-gray-900">{t('homepage.system')}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              {t('homepage.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Link href="/dashboard">{t('dashboard.goToDashboard')}</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#features">{t('dashboard.exploreFeatures')}</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Link href="/login">{t('dashboard.systemLogin')}</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#features">{t('dashboard.exploreFeatures')}</Link>
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
              {t('homepage.powerfulFeatures')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('homepage.featuresDescription')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Satış Yönetimi */}
            <Card className="hover:shadow-lg transition-shadow duration-300 bg-white border">
              <CardHeader>
                <div className="bg-blue-600 p-3 rounded-md w-fit mb-4">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{t('homepage.salesManagementTitle')}</CardTitle>
                <CardDescription>
                  {t('homepage.salesManagementDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.salesRecord')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.productTourManagement')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.statusTracking')}
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
                <CardTitle className="text-lg">{t('homepage.accountingCommission')}</CardTitle>
                <CardDescription>
                  {t('homepage.accountingDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.agencyCommission')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.collectionTracking')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.companySummary')}
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
                <CardTitle className="text-lg">{t('homepage.analysisReporting')}</CardTitle>
                <CardDescription>
                  {t('homepage.analysisDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.individualReports')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.comparativeAnalysis')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.pdfExport')}
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
                <CardTitle className="text-lg">{t('homepage.userManagement')}</CardTitle>
                <CardDescription>
                  {t('homepage.userManagementDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.userRoles')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.secureAuth')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.personalizedDashboard')}
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
                <CardTitle className="text-lg">{t('homepage.companyStore')}</CardTitle>
                <CardDescription>
                  {t('homepage.companyStoreDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.multiCompany')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.storeProducts')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.hierarchicalOrg')}
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
                <CardTitle className="text-lg">{t('homepage.mobileCompatible')}</CardTitle>
                <CardDescription>{t('homepage.mobileDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.responsiveDesign')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.tabletPhoneSupport')}
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {t('homepage.crossPlatform')}
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
              {t('advantages.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('advantages.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('advantages.timeSaving')}
              </h3>
              <p className="text-gray-600">
                {t('advantages.timeSavingDesc')}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('advantages.errorMinimization')}
              </h3>
              <p className="text-gray-600">
                {t('advantages.errorMinimizationDesc')}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('advantages.performanceTracking')}
              </h3>
              <p className="text-gray-600">
                {t('advantages.performanceTrackingDesc')}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-600 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('advantages.quickDecision')}
              </h3>
              <p className="text-gray-600">
                {t('advantages.quickDecisionDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('about.title')}
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('about.description')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="bg-blue-500 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('about.secure')}</h3>
              <p className="text-blue-100">
                {t('about.secureDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <HeadphonesIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('about.support')}</h3>
              <p className="text-blue-100">{t('about.supportDesc')}</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 rounded-md p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('about.growth')}</h3>
              <p className="text-blue-100">
                {t('about.growthDesc')}
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
                <Link href="/login">{t('about.trySystem')}</Link>
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
                  {t('footer.systemName')}
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                {t('footer.description')}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.features')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors">
                  {t('homepage.salesManagementTitle')}
                </li>
                <li className="hover:text-white transition-colors">
                  {t('homepage.accountingCommission')}
                </li>
                <li className="hover:text-white transition-colors">
                  {t('homepage.analysisReporting')}
                </li>
                <li className="hover:text-white transition-colors">
                  {t('homepage.userManagement')}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.advantages')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors">
                  {t('advantages.timeSaving')}
                </li>
                <li className="hover:text-white transition-colors">
                  {t('advantages.errorMinimization')}
                </li>
                <li className="hover:text-white transition-colors">
                  {t('advantages.performanceTracking')}
                </li>
                <li className="hover:text-white transition-colors">
                  {t('homepage.mobileCompatible')}
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {t('footer.systemName')}. {t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
