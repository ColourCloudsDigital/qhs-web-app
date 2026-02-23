const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  socketPath: process.env.DB_SOCKET,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function main() {
  try {
    // ThemeSettings
    await pool.query(`
      INSERT INTO theme_settings (id, colorPalette, typography, buttons, layout, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      colorPalette = VALUES(colorPalette),
      typography = VALUES(typography),
      buttons = VALUES(buttons),
      layout = VALUES(layout),
      isActive = VALUES(isActive),
      updatedAt = NOW()
    `, [
      'default',
      JSON.stringify({
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
      JSON.stringify({
        fontFamily: 'Inter, system-ui, sans-serif',
        headingFontFamily: null,
      }),
      JSON.stringify({
        borderRadius: '0.375rem',
        primaryBackground: '#1e40af',
        primaryText: '#ffffff',
        secondaryBackground: '#4b5563',
        secondaryText: '#ffffff',
      }),
      JSON.stringify({
        containerWidth: '1200px',
        sidebarWidth: '250px',
      }),
      true
    ]);

    // SecuritySettings
    await pool.query(`
      INSERT INTO security_settings (id, passwordPolicy, passwordStrength, passwordExpiryDays, twoFactorAuth, sessionTimeout, loginAttempts, lockoutDuration, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      passwordPolicy = VALUES(passwordPolicy),
      passwordStrength = VALUES(passwordStrength),
      passwordExpiryDays = VALUES(passwordExpiryDays),
      twoFactorAuth = VALUES(twoFactorAuth),
      sessionTimeout = VALUES(sessionTimeout),
      loginAttempts = VALUES(loginAttempts),
      lockoutDuration = VALUES(lockoutDuration),
      isActive = VALUES(isActive),
      updatedAt = NOW()
    `, [
      'default',
      JSON.stringify({
        minLength: 8,
        requireNumbers: true,
        requireSymbols: false,
        requireUppercase: true,
        requireLowercase: true,
      }),
      'medium',
      '0',
      false,
      30,
      5,
      30,
      true
    ]);

    // AnalyticsSettings
    await pool.query(`
      INSERT INTO analytics_settings (id, googleAnalytics, metaTags, customTracking, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      googleAnalytics = VALUES(googleAnalytics),
      metaTags = VALUES(metaTags),
      customTracking = VALUES(customTracking),
      isActive = VALUES(isActive),
      updatedAt = NOW()
    `, [
      'default',
      JSON.stringify({
        enabled: false,
        measurementId: '',
        enableDemographics: false,
        enableEnhancedLinkAttribution: true,
        anonymizeIp: true,
      }),
      JSON.stringify({
        googleSiteVerification: '',
        bingSiteVerification: '',
        yandexSiteVerification: '',
      }),
      JSON.stringify({
        enabled: false,
        headScripts: '',
        bodyStartScripts: '',
        bodyEndScripts: '',
      }),
      true
    ]);

    // SiteSettings
    await pool.query(`
      INSERT INTO site_settings (id, siteName, siteDescription, defaultLanguage, timezone, defaultCurrency, maintenanceMode, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      siteName = VALUES(siteName),
      siteDescription = VALUES(siteDescription),
      defaultLanguage = VALUES(defaultLanguage),
      timezone = VALUES(timezone),
      defaultCurrency = VALUES(defaultCurrency),
      maintenanceMode = VALUES(maintenanceMode),
      updatedAt = NOW()
    `, [
      'default',
      'Qaras Hotels',
      'Your ultimate hotel booking platform',
      'en',
      'UTC',
      'NGN',
      false
    ]);

    // SEOSettings
    await pool.query(`
      INSERT INTO seo_settings (id, metaTitle, metaDescription, twitterCardType, sitemapEnabled, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      metaTitle = VALUES(metaTitle),
      metaDescription = VALUES(metaDescription),
      twitterCardType = VALUES(twitterCardType),
      sitemapEnabled = VALUES(sitemapEnabled),
      updatedAt = NOW()
    `, [
      'default',
      'Qaras Hotels - Hotel Booking Platform',
      'Find and book hotels across Nigeria with Qaras Hotels, the leading hotel booking platform.',
      'summary_large_image',
      true
    ]);

    // CookieSettings
    await pool.query(`
      INSERT INTO cookie_settings (id, cookieDialogTitle, cookieDialogContent, necessaryText, preferencesText, statisticsText, marketingText, acceptButtonText, rejectButtonText, settingsButtonText, saveButtonText, expiryDays, backgroundColorHex, textColorHex, accentColorHex, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      cookieDialogTitle = VALUES(cookieDialogTitle),
      cookieDialogContent = VALUES(cookieDialogContent),
      necessaryText = VALUES(necessaryText),
      preferencesText = VALUES(preferencesText),
      statisticsText = VALUES(statisticsText),
      marketingText = VALUES(marketingText),
      acceptButtonText = VALUES(acceptButtonText),
      rejectButtonText = VALUES(rejectButtonText),
      settingsButtonText = VALUES(settingsButtonText),
      saveButtonText = VALUES(saveButtonText),
      expiryDays = VALUES(expiryDays),
      backgroundColorHex = VALUES(backgroundColorHex),
      textColorHex = VALUES(textColorHex),
      accentColorHex = VALUES(accentColorHex),
      updatedAt = NOW()
    `, [
      'default',
      'We value your privacy',
      'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.',
      'Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website.',
      'Preference cookies enable a website to remember information that changes the way the website behaves or looks.',
      'Statistic cookies help website owners to understand how visitors interact with websites by collecting and reporting information anonymously.',
      'Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging.',
      'Accept All',
      'Reject All',
      'Cookie Settings',
      'Save Preferences',
      365,
      '#ffffff',
      '#000000',
      '#1e3a8a'
    ]);

    console.log('Database seeded!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });