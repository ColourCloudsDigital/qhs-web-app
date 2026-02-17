import pool from '@/lib/db';

interface SMTPConfiguration {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail?: string;
  fromName?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const settingsService = {
  /**
   * Get the SMTP configuration
   */
  async getSMTPConfig(): Promise<SMTPConfiguration | null> {
    // Get the default SMTP configuration
    const [rows] = await pool.query(
      `SELECT * FROM smtp_configurations WHERE isDefault = 1 LIMIT 1`
    );
    
    const smtpConfig = (rows as any[])[0] || null;
    return smtpConfig;
  },

  /**
   * Update SMTP configuration
   */
  async updateSMTPConfig(data: {
    host: string;
    port: number;
    username: string;
    password: string;
    fromEmail?: string;
    fromName?: string;
  }): Promise<SMTPConfiguration> {
    // Check if there's an existing default configuration
    const existingConfig = await prisma.sMTPConfiguration.findFirst({
      where: {
        isDefault: true,
      },
    });

    if (existingConfig) {
      // Update existing configuration
      return await prisma.sMTPConfiguration.update({
        where: {
          id: existingConfig.id,
        },
        data,
      });
    } else {
      // Create new configuration
      return await prisma.sMTPConfiguration.create({
        data: {
          ...data,
          isDefault: true,
        },
      });
    }
  },

  /**
   * Test SMTP configuration
   */
  async testSMTPConfig(data: {
    host: string;
    port: number;
    username: string;
    password: string;
    fromEmail?: string;
    fromName?: string;
    testEmail: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // We'll use the email service to send a test email
      // This will be implemented in the email.service.ts
      const { testEmail, ...smtpConfig } = data;
      
      // Import here to avoid circular dependency
      const { emailService } = require('./email.service');
      
      await emailService.sendTestEmail({
        to: testEmail,
        smtpConfig,
      });

      return {
        success: true,
        message: 'Test email sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Get app settings
   */
  async getAppSettings() {
    const settings = await prisma.appSetting.findFirst();
    return settings || {
      defaultTaxRate: 5.0,
      defaultCommissionRate: 10.0,
      isMaintenanceMode: false,
      maintenanceMessage: null,
    };
  },

  /**
   * Update app settings
   */
  async updateAppSettings(data: {
    defaultTaxRate?: number;
    defaultCommissionRate?: number;
    isMaintenanceMode?: boolean;
    maintenanceMessage?: string;
  }) {
    const existingSettings = await prisma.appSetting.findFirst();

    if (existingSettings) {
      return await prisma.appSetting.update({
        where: { id: existingSettings.id },
        data,
      });
    } else {
      return await prisma.appSetting.create({
        data: {
          defaultTaxRate: data.defaultTaxRate ?? 5.0,
          defaultCommissionRate: data.defaultCommissionRate ?? 10.0,
          isMaintenanceMode: data.isMaintenanceMode ?? false,
          maintenanceMessage: data.maintenanceMessage,
        },
      });
    }
  },

  /**
   * Get Paystack configuration
   */
  async getPaystackConfig() {
    const config = await prisma.paystackConfiguration.findFirst({
      where: { isDefault: true },
    });
    return config;
  },

  /**
   * Update Paystack configuration
   */
  async updatePaystackConfig(data: {
    publicKey: string;
    secretKey: string;
    isLive?: boolean;
    webhookSecret?: string;
    splitPaymentCode?: string;
    subaccountCode?: string;
    callbackUrl?: string;
    chargeCardEnabled?: boolean;
    transferEnabled?: boolean;
    subscriptionEnabled?: boolean;
  }) {
    const existingConfig = await prisma.paystackConfiguration.findFirst({
      where: { isDefault: true },
    });

    if (existingConfig) {
      return await prisma.paystackConfiguration.update({
        where: { id: existingConfig.id },
        data,
      });
    } else {
      return await prisma.paystackConfiguration.create({
        data: {
          ...data,
          isDefault: true,
          isLive: data.isLive ?? false,
          chargeCardEnabled: data.chargeCardEnabled ?? true,
          transferEnabled: data.transferEnabled ?? false,
          subscriptionEnabled: data.subscriptionEnabled ?? false,
        },
      });
    }
  },

  /**
   * Get Flutterwave configuration
   */
  async getFlutterwaveConfig() {
    const config = await prisma.flutterwaveConfiguration.findFirst({
      where: { isDefault: true },
    });
    return config;
  },

  /**
   * Update Flutterwave configuration
   */
  async updateFlutterwaveConfig(data: {
    publicKey: string;
    secretKey: string;
    encryptionKey?: string;
    webhookSecret?: string;
    callbackUrl?: string;
    isLive?: boolean;
    isDefault?: boolean;
    chargeCardEnabled?: boolean;
    transferEnabled?: boolean;
  }) {
    // If setting this as default, make sure to unset other default gateways
    if (data.isDefault) {
      await prisma.paystackConfiguration.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const existingConfig = await prisma.flutterwaveConfiguration.findFirst({
      where: { isDefault: true },
    });

    if (existingConfig) {
      return await prisma.flutterwaveConfiguration.update({
        where: { id: existingConfig.id },
        data,
      });
    } else {
      return await prisma.flutterwaveConfiguration.create({
        data: {
          ...data,
          isDefault: data.isDefault ?? false,
          isLive: data.isLive ?? false,
          chargeCardEnabled: data.chargeCardEnabled ?? true,
          transferEnabled: data.transferEnabled ?? false,
        },
      });
    }
  },

  /**
   * Get hotel payment settings
   */
  async getHotelPaymentSettings(hotelId: string) {
    const settings = await prisma.hotelPaymentSetting.findUnique({
      where: { hotelId },
    });
    return settings;
  },

  /**
   * Update hotel payment settings
   */
  async updateHotelPaymentSettings(
    hotelId: string,
    data: {
      allowPayAtHotel?: boolean;
      requirePrePayment?: boolean;
      taxRate?: number;
      commissionRate?: number;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    }
  ) {
    const existingSettings = await prisma.hotelPaymentSetting.findUnique({
      where: { hotelId },
    });

    if (existingSettings) {
      return await prisma.hotelPaymentSetting.update({
        where: { id: existingSettings.id },
        data,
      });
    } else {
      return await prisma.hotelPaymentSetting.create({
        data: {
          hotelId,
          ...data,
        },
      });
    }
  },
  
  /**
   * Get general site settings
   */
  async getGeneralSettings() {
    let settings = await prisma.siteSettings.findFirst();
    
    // Return default settings if none exist
    if (!settings) {
      settings = {
        id: '',
        siteName: 'Qaras Hotels',
        siteDescription: 'Your ultimate hotel booking platform',
        favicon: null,
        logo: null,
        defaultLanguage: 'en',
        timezone: 'UTC',
        defaultCurrency: 'NGN',
        maintenanceMode: false,
        maintenanceMsg: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    return settings;
  },
  
  /**
   * Update general site settings
   */
  async updateGeneralSettings(data: {
    siteName?: string;
    siteDescription?: string;
    favicon?: string;
    logo?: string;
    defaultLanguage?: string;
    timezone?: string;
    defaultCurrency?: string;
    maintenanceMode?: boolean;
    maintenanceMsg?: string;
  }) {
    let settings = await prisma.siteSettings.findFirst();
    
    if (settings) {
      return await prisma.siteSettings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      return await prisma.siteSettings.create({ 
        data: {
          siteName: data.siteName || 'Qaras Hotels',
          siteDescription: data.siteDescription || 'Your ultimate hotel booking platform',
          favicon: data.favicon || null,
          logo: data.logo || null,
          defaultLanguage: data.defaultLanguage || 'en',
          timezone: data.timezone || 'UTC',
          defaultCurrency: data.defaultCurrency || 'NGN',
          maintenanceMode: data.maintenanceMode || false,
          maintenanceMsg: data.maintenanceMsg || null,
        } 
      });
    }
  },
  
  /**
   * Get cookie settings
   */
  async getCookieSettings() {
    let settings = await prisma.cookieSettings.findFirst();
    
    // Return default settings if none exist
    if (!settings) {
      settings = {
        id: '',
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
        cookiePolicyUrl: null,
        privacyPolicyUrl: null,
        termsOfServiceUrl: null,
        expiryDays: 365,
        backgroundColorHex: '#ffffff',
        textColorHex: '#000000',
        accentColorHex: '#1e3a8a',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    return settings;
  },
  
  /**
   * Update cookie settings
   */
  async updateCookieSettings(data: any) {
    let settings = await prisma.cookieSettings.findFirst();
    
    if (settings) {
      return await prisma.cookieSettings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      return await prisma.cookieSettings.create({ data });
    }
  },
  
  /**
   * Get SEO settings
   */
  async getSeoSettings() {
    let settings = await prisma.sEOSettings.findFirst();
    
    // Return default settings if none exist
    if (!settings) {
      settings = {
        id: '',
        metaTitle: 'Qaras Hotels - Hotel Booking Platform',
        metaDescription: 'Find and book hotels across Nigeria with Qaras Hotels, the leading hotel booking platform.',
        ogImageUrl: null,
        twitterCardType: 'summary_large_image',
        googleAnalyticsId: null,
        facebookPixelId: null,
        sitemapEnabled: true,
        robotsTxtContent: null,
        structuredData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    return settings;
  },
  
  /**
   * Update SEO settings
   */
  async updateSeoSettings(data: any) {
    let settings = await prisma.sEOSettings.findFirst();
    
    if (settings) {
      return await prisma.sEOSettings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      return await prisma.sEOSettings.create({ data });
    }
  },
  
  /**
   * Get legal documents
   */
  async getLegalDocuments(type?: string) {
    if (type) {
      return await prisma.legalDocument.findFirst({
        where: { 
          type: type as any, 
          isPublished: true 
        },
        orderBy: { 
          updatedAt: 'desc' 
        }
      });
    } else {
      return await prisma.legalDocument.findMany({
        where: { isPublished: true },
        orderBy: { updatedAt: 'desc' }
      });
    }
  },
  
  /**
   * Get a specific legal document
   */
  async getLegalDocument(id: string, adminOnly: boolean = false) {
    return await prisma.legalDocument.findUnique({
      where: { 
        id,
        // Only admins can see unpublished documents
        ...(adminOnly ? {} : { isPublished: true })
      }
    });
  },
  
  /**
   * Create a new legal document
   */
  async createLegalDocument(data: any) {
    return await prisma.legalDocument.create({
      data: {
        type: data.type,
        title: data.title,
        content: data.content,
        version: data.version || '1.0',
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
      }
    });
  },
  
  /**
   * Update a legal document
   */
  async updateLegalDocument(id: string, data: any) {
    return await prisma.legalDocument.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        version: data.version,
        isPublished: data.isPublished,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
      }
    });
  },
  
  /**
   * Delete a legal document
   */
  async deleteLegalDocument(id: string) {
    return await prisma.legalDocument.delete({
      where: { id }
    });
  },
};

// Export individual functions for backwards compatibility
export const { 
  getSMTPConfig, 
  updateSMTPConfig, 
  testSMTPConfig, 
  getAppSettings, 
  updateAppSettings,
  getPaystackConfig,
  updatePaystackConfig,
  getFlutterwaveConfig,
  updateFlutterwaveConfig,
  getHotelPaymentSettings,
  updateHotelPaymentSettings,
  getGeneralSettings,
  updateGeneralSettings,
  getCookieSettings,
  updateCookieSettings,
  getSeoSettings,
  updateSeoSettings,
  getLegalDocuments,
  getLegalDocument,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument
} = settingsService;

export default settingsService;