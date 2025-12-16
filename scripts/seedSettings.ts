const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ThemeSettings
  await prisma.themeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      colorPalette: JSON.stringify({
        primary: '#1e40af',
        secondary: '#4b5563',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#111827',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      }),
      typography: JSON.stringify({
        fontFamily: 'Inter, system-ui, sans-serif',
        headingFontFamily: null,
      }),
      buttons: JSON.stringify({
        borderRadius: '0.375rem',
        primaryBackground: '#1e40af',
        primaryText: '#ffffff',
        secondaryBackground: '#4b5563',
        secondaryText: '#ffffff',
      }),
      layout: JSON.stringify({
        containerWidth: '1200px',
        sidebarWidth: '250px',
      }),
      isActive: true,
    },
  });

  // SecuritySettings
  await prisma.securitySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      passwordPolicy: JSON.stringify({
        minLength: 8,
        requireNumbers: true,
        requireSymbols: false,
        requireUppercase: true,
        requireLowercase: true,
      }),
      passwordStrength: 'medium',
      passwordExpiryDays: '0',
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginAttempts: 5,
      lockoutDuration: 30,
      isActive: true,
    },
  });

  // AnalyticsSettings
  await prisma.analyticsSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      googleAnalytics: JSON.stringify({
        enabled: false,
        measurementId: '',
        enableDemographics: false,
        enableEnhancedLinkAttribution: true,
        anonymizeIp: true,
      }),
      metaTags: JSON.stringify({
        googleSiteVerification: '',
        bingSiteVerification: '',
        yandexSiteVerification: '',
      }),
      customTracking: JSON.stringify({
        enabled: false,
        headScripts: '',
        bodyStartScripts: '',
        bodyEndScripts: '',
      }),
      isActive: true,
    },
  });

  // SiteSettings
  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: 'Qaras Hotels',
      siteDescription: 'Your ultimate hotel booking platform',
      defaultLanguage: 'en',
      timezone: 'UTC',
      defaultCurrency: 'NGN',
      maintenanceMode: false,
    },
  });

  // SEOSettings
  await prisma.sEOSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      metaTitle: 'Qaras Hotels - Hotel Booking Platform',
      metaDescription: 'Find and book hotels across Nigeria with Qaras Hotels, the leading hotel booking platform.',
      twitterCardType: 'summary_large_image',
      sitemapEnabled: true,
    },
  });

  // CookieSettings
  await prisma.cookieSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      cookieDialogTitle: 'We value your privacy',
      cookieDialogContent: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.',
      necessaryText: 'Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website.',
      preferencesText: 'Preference cookies enable a website to remember information that changes the way the website behaves or looks.',
      statisticsText: 'Statistic cookies help website owners to understand how visitors interact with websites by collecting and reporting information anonymously.',
      marketingText: 'Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging.',
      acceptButtonText: 'Accept All',
      rejectButtonText: 'Reject All',
      settingsButtonText: 'Cookie Settings',
      saveButtonText: 'Save Preferences',
      expiryDays: 365,
      backgroundColorHex: '#ffffff',
      textColorHex: '#000000',
      accentColorHex: '#1e3a8a',
    },
  });

  console.log('Database seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });