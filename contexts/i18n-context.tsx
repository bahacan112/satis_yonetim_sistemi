"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'tr' | 'en'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const messages = {
  tr: {
    'common.save': 'Kaydet',
    'common.cancel': 'İptal',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.search': 'Ara',
    'common.loading': 'Yükleniyor...',
    
    'auth.login': 'Giriş Yap',
    'auth.logout': 'Çıkış',
    'auth.email': 'E-posta',
    'auth.password': 'Şifre',
    'auth.remember': 'Beni Hatırla',
    'auth.forgot': 'Şifremi Unuttum',
    'auth.loginTitle': 'Giriş Yap',
    'auth.loginDescription': 'Hesabınıza erişmek için bilgilerinizi girin',
    'auth.emailPlaceholder': 'ornek@email.com',
    'auth.passwordPlaceholder': 'Şifrenizi girin',
    'auth.captchaExpired': 'reCAPTCHA süresi doldu, lütfen tekrar doğrulayın',
    'auth.captchaFailed': 'reCAPTCHA doğrulaması başarısız',
    'auth.fillAllFields': 'Lütfen tüm alanları doldurun',
    'auth.completeCaptcha': 'Lütfen reCAPTCHA doğrulamasını tamamlayın',
    'auth.loginSuccess': 'Giriş başarılı!',
    'auth.loginError': 'Giriş sırasında bir hata oluştu',
    'auth.loggingIn': 'Giriş yapılıyor...',
    
    'nav.dashboard': 'Dashboard',
    'nav.companies': 'Firmalar',
    'nav.stores': 'Mağazalar',
    'nav.products': 'Ürünler',
    'nav.sales': 'Satışlar',
    'nav.reports': 'Raporlar',
    'nav.settings': 'Ayarlar',
    
    'dashboard.title': 'Satış Yönetim Sistemi',
    'dashboard.subtitle': 'Mağaza satış süreçlerinizi kolayca yönetin',
    'dashboard.welcome': 'Hoş Geldiniz',
    'dashboard.overview': 'Genel Bakış',
    'dashboard.recent': 'Son İşlemler',
    'dashboard.systemSetupRequired': 'Sistem Kurulumu Gerekli',
    'dashboard.databaseNotCreated': 'Veritabanı tabloları oluşturulmamış',
    'dashboard.adminUserNeeded': 'Yönetici kullanıcı oluşturulması gerekli',
    'dashboard.setupInstructions': 'Sistemi kullanmaya başlamak için önce kurulum yapmanız gerekiyor.',
    'dashboard.adminInstructions': 'Sisteme giriş yapabilmek için bir yönetici kullanıcı oluşturmanız gerekiyor.',
    'dashboard.setupGuide': 'Kurulum Kılavuzu',
    'dashboard.connectionTest': 'Bağlantı Testi',
    'dashboard.createAdmin': 'Yönetici Oluştur',
    'dashboard.detailedSetup': 'Detaylı Kurulum',
    'dashboard.goToDashboard': 'Dashboard\'a Git',
    'dashboard.exploreFeatures': 'Özellikleri Keşfet',
    'dashboard.systemLogin': 'Sisteme Giriş',
    
    'homepage.specialDesign': 'Turizm Sektörü İçin Özel Tasarım',
    'homepage.salesManagement': 'Satış',
    'homepage.system': 'Yönetim Sistemi',
    'homepage.description': 'Turizm sektöründe faaliyet gösteren firmalar için özel olarak geliştirilmiş kapsamlı satış yönetim sistemi. Rehber yönetiminden komisyon hesaplamalarına, muhasebe takibinden detaylı raporlamaya kadar tüm ihtiyaçlarınızı karşılar.',
    'homepage.powerfulFeatures': 'Güçlü Özellikler',
    'homepage.featuresDescription': 'İşletmenizi büyütmek için ihtiyacınız olan tüm araçlar',
    'homepage.salesManagementTitle': 'Satış Yönetimi',
    'homepage.salesManagementDesc': 'Kapsamlı satış süreçleri yönetimi',
    'homepage.salesRecord': 'Satış kayıt ve takibi',
    'homepage.productTourManagement': 'Ürün ve tur yönetimi',
    'homepage.statusTracking': 'Durum takibi',
    'homepage.accountingCommission': 'Muhasebe & Komisyon',
    'homepage.accountingDesc': 'Otomatik hesaplama ve takip',
    'homepage.agencyCommission': 'Acenta komisyon hesaplama',
    'homepage.collectionTracking': 'Tahsilat takibi',
    'homepage.companySummary': 'Firma özet raporları',
    'homepage.analysisReporting': 'Analiz & Raporlama',
    'homepage.analysisDesc': 'Detaylı analiz ve raporlama araçları',
    'homepage.individualReports': 'Bireysel performans raporları',
    'homepage.comparativeAnalysis': 'Karşılaştırmalı analiz',
    'homepage.pdfExport': 'PDF export özelliği',
    'homepage.userManagement': 'Kullanıcı Yönetimi',
    'homepage.userManagementDesc': 'Güvenli kullanıcı yönetimi',
    'homepage.userRoles': 'Kullanıcı rolleri ve yetkileri',
    'homepage.secureAuth': 'Güvenli kimlik doğrulama',
    'homepage.personalizedDashboard': 'Kişiselleştirilmiş dashboard',
    'homepage.companyStore': 'Firma & Mağaza Yönetimi',
    'homepage.companyStoreDesc': 'Çoklu firma ve mağaza desteği',
    'homepage.multiCompany': 'Çoklu firma yönetimi',
    'homepage.storeProducts': 'Mağaza ve ürün organizasyonu',
    'homepage.hierarchicalOrg': 'Hiyerarşik organizasyon',
    'homepage.mobileCompatible': 'Mobil Uyumlu',
    'homepage.mobileDesc': 'Her cihazdan erişim imkanı',
    'homepage.responsiveDesign': 'Responsive tasarım',
    'homepage.tabletPhoneSupport': 'Tablet ve telefon desteği',
    'homepage.crossPlatform': 'Saha çalışanları için optimize',
    
    'advantages.title': 'Avantajlar',
    'advantages.subtitle': 'Neden bu sistemi tercih etmelisiniz?',
    'advantages.timeSaving': 'Zaman Tasarrufu',
    'advantages.timeSavingDesc': 'Manuel işlemleri otomatikleştirerek zamandan tasarruf edin',
    'advantages.errorMinimization': 'Hata Minimizasyonu',
    'advantages.errorMinimizationDesc': 'Otomatik hesaplamalar ile insan kaynaklı hataları azaltın',
    'advantages.performanceTracking': 'Performans Takibi',
    'advantages.performanceTrackingDesc': 'Detaylı raporlar ile performansınızı sürekli izleyin',
    'advantages.quickDecision': 'Hızlı Karar Alma',
    'advantages.quickDecisionDesc': 'Anlık veriler ile daha hızlı ve doğru kararlar alın',
    
    'about.title': 'Neden Bu Sistem?',
    'about.description': 'Turizm sektöründe faaliyet gösteren firmalar için özel olarak geliştirilmiş bu sistem, satış süreçlerinizi dijitalleştirerek verimliliğinizi artırır. Rehber yönetiminden komisyon hesaplamalarına, muhasebe takibinden detaylı raporlamaya kadar tüm ihtiyaçlarınızı karşılar.',
    'about.secure': 'Güvenli',
    'about.secureDesc': 'Verileriniz güvenli sunucularda korunur',
    'about.support': 'Destek',
    'about.supportDesc': '7/24 teknik destek hizmeti',
    'about.growth': 'Büyüme',
    'about.growthDesc': 'İşletmenizle birlikte büyüyen sistem',
    'about.trySystem': 'Sistemi Deneyin',
    
    'footer.systemName': 'Satış Yönetim Sistemi',
    'footer.description': 'Turizm sektörü için özel olarak tasarlanmış, kapsamlı satış yönetim ve muhasebe sistemi.',
    'footer.features': 'Özellikler',
    'footer.advantages': 'Avantajlar',
    'footer.copyright': 'Tüm hakları saklıdır.',
    
    'landing.title': 'Satış Yönetim Sistemi',
    'landing.subtitle': 'Mağaza satış süreçlerinizi kolayca yönetin',
    'landing.getStarted': 'Başlayın',
    'landing.features': 'Özellikler',
    
    'role.admin': 'Yönetici',
    'role.manager': 'Müdür',
    'role.employee': 'Çalışan',
    
    'navigation.dashboard': 'Dashboard',
    'navigation.companies': 'Firmalar',
    'navigation.stores': 'Mağazalar',
    'navigation.products': 'Ürünler',
    'navigation.storeProducts': 'Mağaza Ürünleri',
    'navigation.operators': 'Operatörler',
    'navigation.guides': 'Rehberler',
    'navigation.tours': 'Turlar',
    'navigation.accounting': 'Muhasebe',
    'navigation.notifications': 'Bildirimler',
    'navigation.sales': 'Satışlar',
    'navigation.individualReports': 'Bireysel Raporlar',
    'navigation.security': 'Güvenlik & İzleme',
    'navigation.mySalesNotification': 'Satış Bildirimim',
    'navigation.myCommissions': 'Primlerim',
    'navigation.mySalesStatus': 'Satış Durumlarım',
    'navigation.openMenu': 'Menüyü aç',
    'navigation.menu': 'Menü',
    
    'userRoles.admin': 'Yönetici',
    'userRoles.standard': 'Standart Kullanıcı',
    'userRoles.guide': 'Rehber',
    
    'auth.signOutError': 'Çıkış hatası:',
    'auth.signingOut': 'Çıkış yapılıyor...'
  },
  en: {
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.remember': 'Remember Me',
    'auth.forgot': 'Forgot Password',
    'auth.loginTitle': 'Login',
    'auth.loginDescription': 'Enter your credentials to access your account',
    'auth.emailPlaceholder': 'example@email.com',
    'auth.passwordPlaceholder': 'Enter your password',
    'auth.captchaExpired': 'reCAPTCHA expired, please verify again',
    'auth.captchaFailed': 'reCAPTCHA verification failed',
    'auth.fillAllFields': 'Please fill in all fields',
    'auth.completeCaptcha': 'Please complete the reCAPTCHA verification',
    'auth.loginSuccess': 'Login successful!',
    'auth.loginError': 'An error occurred during login',
    'auth.loggingIn': 'Logging in...',
    
    'nav.dashboard': 'Dashboard',
    'nav.companies': 'Companies',
    'nav.stores': 'Stores',
    'nav.products': 'Products',
    'nav.sales': 'Sales',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    
    'dashboard.title': 'Sales Management System',
    'dashboard.subtitle': 'Easily manage your store sales processes',
    'dashboard.welcome': 'Welcome',
    'dashboard.overview': 'Overview',
    'dashboard.recent': 'Recent Activities',
    'dashboard.systemSetupRequired': 'System Setup Required',
    'dashboard.databaseNotCreated': 'Database tables not created',
    'dashboard.adminUserNeeded': 'Admin user creation required',
    'dashboard.setupInstructions': 'You need to complete the setup before you can start using the system.',
    'dashboard.adminInstructions': 'You need to create an admin user to be able to log into the system.',
    'dashboard.setupGuide': 'Setup Guide',
    'dashboard.connectionTest': 'Connection Test',
    'dashboard.createAdmin': 'Create Admin',
    'dashboard.detailedSetup': 'Detailed Setup',
    'dashboard.goToDashboard': 'Go to Dashboard',
    'dashboard.exploreFeatures': 'Explore Features',
    'dashboard.systemLogin': 'System Login',
    
    'homepage.specialDesign': 'Special Design for Tourism Industry',
    'homepage.salesManagement': 'Sales',
    'homepage.system': 'Management System',
    'homepage.description': 'Comprehensive sales management system specially developed for companies operating in the tourism sector. It meets all your needs from guide management to commission calculations, from accounting tracking to detailed reporting.',
    'homepage.powerfulFeatures': 'Powerful Features',
    'homepage.featuresDescription': 'All the tools you need to grow your business',
    'homepage.salesManagementTitle': 'Sales Management',
    'homepage.salesManagementDesc': 'Comprehensive sales process management',
    'homepage.salesRecord': 'Sales recording and tracking',
    'homepage.productTourManagement': 'Product and tour management',
    'homepage.statusTracking': 'Status tracking',
    'homepage.accountingCommission': 'Accounting & Commission',
    'homepage.accountingDesc': 'Automatic calculation and tracking',
    'homepage.agencyCommission': 'Agency commission calculation',
    'homepage.collectionTracking': 'Collection tracking',
    'homepage.companySummary': 'Company summary reports',
    'homepage.analysisReporting': 'Analysis & Reporting',
    'homepage.analysisDesc': 'Detailed analysis and reporting tools',
    'homepage.individualReports': 'Individual performance reports',
    'homepage.comparativeAnalysis': 'Comparative analysis',
    'homepage.pdfExport': 'PDF export feature',
    'homepage.userManagement': 'User Management',
    'homepage.userManagementDesc': 'Secure user management',
    'homepage.userRoles': 'User roles and permissions',
    'homepage.secureAuth': 'Secure authentication',
    'homepage.personalizedDashboard': 'Personalized dashboard',
    'homepage.companyStore': 'Company & Store Management',
    'homepage.companyStoreDesc': 'Multi-company and store support',
    'homepage.multiCompany': 'Multi-company management',
    'homepage.storeProducts': 'Store and product organization',
    'homepage.hierarchicalOrg': 'Hierarchical organization',
    'homepage.mobileCompatible': 'Mobile Compatible',
    'homepage.mobileDesc': 'Access from any device',
    'homepage.responsiveDesign': 'Responsive design',
    'homepage.tabletPhoneSupport': 'Tablet and phone support',
    'homepage.crossPlatform': 'Optimized for field workers',
    
    'advantages.title': 'Advantages',
    'advantages.subtitle': 'Why should you choose this system?',
    'advantages.timeSaving': 'Time Saving',
    'advantages.timeSavingDesc': 'Save time by automating manual processes',
    'advantages.errorMinimization': 'Error Minimization',
    'advantages.errorMinimizationDesc': 'Reduce human errors with automatic calculations',
    'advantages.performanceTracking': 'Performance Tracking',
    'advantages.performanceTrackingDesc': 'Continuously monitor your performance with detailed reports',
    'advantages.quickDecision': 'Quick Decision Making',
    'advantages.quickDecisionDesc': 'Make faster and more accurate decisions with real-time data',
    
    'about.title': 'Why This System?',
    'about.description': 'This system, specially developed for companies operating in the tourism sector, increases your efficiency by digitalizing your sales processes. It meets all your needs from guide management to commission calculations, from accounting tracking to detailed reporting.',
    'about.secure': 'Secure',
    'about.secureDesc': 'Your data is protected on secure servers',
    'about.support': 'Support',
    'about.supportDesc': '24/7 technical support service',
    'about.growth': 'Growth',
    'about.growthDesc': 'System that grows with your business',
    'about.trySystem': 'Try the System',
    
    'footer.systemName': 'Sales Management System',
    'footer.description': 'Comprehensive sales management and accounting system specially designed for the tourism sector.',
    'footer.features': 'Features',
    'footer.advantages': 'Advantages',
    'footer.copyright': 'All rights reserved.',
    
    'landing.title': 'Sales Management System',
    'landing.subtitle': 'Easily manage your store sales processes',
    'landing.getStarted': 'Get Started',
    'landing.features': 'Features',
    
    'role.admin': 'Admin',
    'role.manager': 'Manager',
    'role.employee': 'Employee',
    
    'navigation.dashboard': 'Dashboard',
    'navigation.companies': 'Companies',
    'navigation.stores': 'Stores',
    'navigation.products': 'Products',
    'navigation.storeProducts': 'Store Products',
    'navigation.operators': 'Operators',
    'navigation.guides': 'Guides',
    'navigation.tours': 'Tours',
    'navigation.accounting': 'Accounting',
    'navigation.notifications': 'Notifications',
    'navigation.sales': 'Sales',
    'navigation.individualReports': 'Individual Reports',
    'navigation.security': 'Security & Monitoring',
    'navigation.mySalesNotification': 'My Sales Notification',
    'navigation.myCommissions': 'My Commissions',
    'navigation.mySalesStatus': 'My Sales Status',
    'navigation.openMenu': 'Open menu',
    'navigation.menu': 'Menu',
    
    'userRoles.admin': 'Admin',
    'userRoles.standard': 'Standard User',
    'userRoles.guide': 'Guide',
    
    'auth.signOutError': 'Sign out error:',
    'auth.signingOut': 'Signing out...'
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('tr')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'tr' || savedLanguage === 'en')) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key: string): string => {
    return messages[language][key as keyof typeof messages[typeof language]] || key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
