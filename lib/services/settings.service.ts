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
      'SELECT * FROM smtp_configurations WHERE isDefault = 1 LIMIT 1'
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
    const [existingRows] = await pool.query(
      'SELECT * FROM smtp_configurations WHERE isDefault = true LIMIT 1'
    );

    const existingConfig = (existingRows as any[])[0];

    if (existingConfig) {
      // Update existing configuration
      await pool.query(
        `UPDATE smtp_configurations 
         SET host = ?, port = ?, username = ?, password = ?, fromEmail = ?, fromName = ?, updatedAt = NOW() 
         WHERE id = ?`,
        [data.host, data.port, data.username, data.password, data.fromEmail, data.fromName, existingConfig.id]
      );

      const [updatedRows] = await pool.query(
        'SELECT * FROM smtp_configurations WHERE id = ?',
        [existingConfig.id]
      );

      return (updatedRows as any[])[0];
    } else {
      // Create new configuration
      const [result] = await pool.query(
        `INSERT INTO smtp_configurations (id, host, port, username, password, fromEmail, fromName, isDefault, createdAt, updatedAt) 
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
        [data.host, data.port, data.username, data.password, data.fromEmail, data.fromName]
      );

      const [newRows] = await pool.query(
        'SELECT * FROM smtp_configurations WHERE id = ?',
        [(result as any).insertId]
      );

      return (newRows as any[])[0];
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
    const [rows] = await pool.query('SELECT * FROM app_settings LIMIT 1');
    const settings = (rows as any[])[0];
    
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
    const [existingRows] = await pool.query('SELECT * FROM app_settings LIMIT 1');
    const existingSettings = (existingRows as any[])[0];

    if (existingSettings) {
      const updateFields = [];
      const updateValues = [];
      
      if (data.defaultTaxRate !== undefined) {
        updateFields.push('defaultTaxRate = ?');
        updateValues.push(data.defaultTaxRate);
      }
      if (data.defaultCommissionRate !== undefined) {
        updateFields.push('defaultCommissionRate = ?');
        updateValues.push(data.defaultCommissionRate);
      }
      if (data.isMaintenanceMode !== undefined) {
        updateFields.push('isMaintenanceMode = ?');
        updateValues.push(data.isMaintenanceMode);
      }
      if (data.maintenanceMessage !== undefined) {
        updateFields.push('maintenanceMessage = ?');
        updateValues.push(data.maintenanceMessage);
      }
      
      updateFields.push('updatedAt = NOW()');
      updateValues.push(existingSettings.id);

      await pool.query(
        `UPDATE app_settings SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      const [updatedRows] = await pool.query('SELECT * FROM app_settings WHERE id = ?', [existingSettings.id]);
      return (updatedRows as any[])[0];
    } else {
      await pool.query(
        `INSERT INTO app_settings (id, defaultTaxRate, defaultCommissionRate, isMaintenanceMode, maintenanceMessage, createdAt, updatedAt) 
         VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.defaultTaxRate ?? 5.0,
          data.defaultCommissionRate ?? 10.0,
          data.isMaintenanceMode ?? false,
          data.maintenanceMessage
        ]
      );

      const [newRows] = await pool.query('SELECT * FROM app_settings LIMIT 1');
      return (newRows as any[])[0];
    }
  },

  /**
   * Get Paystack configuration
   */
  async getPaystackConfig() {
    const [rows] = await pool.query(
      'SELECT * FROM paystack_configurations WHERE isDefault = true LIMIT 1'
    );
    return (rows as any[])[0] || null;
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
    const [existingRows] = await pool.query(
      'SELECT * FROM paystack_configurations WHERE isDefault = true LIMIT 1'
    );
    const existingConfig = (existingRows as any[])[0];

    if (existingConfig) {
      const updateFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(data);
      
      await pool.query(
        `UPDATE paystack_configurations SET ${updateFields}, updatedAt = NOW() WHERE id = ?`,
        [...updateValues, existingConfig.id]
      );

      const [updatedRows] = await pool.query(
        'SELECT * FROM paystack_configurations WHERE id = ?',
        [existingConfig.id]
      );
      return (updatedRows as any[])[0];
    } else {
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      await pool.query(
        `INSERT INTO paystack_configurations (id, ${fields}, isDefault, isLive, chargeCardEnabled, transferEnabled, subscriptionEnabled, createdAt, updatedAt) 
         VALUES (UUID(), ${placeholders}, true, ?, ?, ?, ?, NOW(), NOW())`,
        [
          ...values,
          data.isLive ?? false,
          data.chargeCardEnabled ?? true,
          data.transferEnabled ?? false,
          data.subscriptionEnabled ?? false
        ]
      );

      const [newRows] = await pool.query(
        'SELECT * FROM paystack_configurations WHERE isDefault = true LIMIT 1'
      );
      return (newRows as any[])[0];
    }
  },

  /**
   * Get Flutterwave configuration
   */
  async getFlutterwaveConfig() {
    const [rows] = await pool.query(
      'SELECT * FROM flutterwave_configurations WHERE isDefault = true LIMIT 1'
    );
    return (rows as any[])[0] || null;
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
      await pool.query(
        'UPDATE paystack_configurations SET isDefault = false WHERE isDefault = true'
      );
    }

    const [existingRows] = await pool.query(
      'SELECT * FROM flutterwave_configurations WHERE isDefault = true LIMIT 1'
    );
    const existingConfig = (existingRows as any[])[0];

    if (existingConfig) {
      const updateFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(data);
      
      await pool.query(
        `UPDATE flutterwave_configurations SET ${updateFields}, updatedAt = NOW() WHERE id = ?`,
        [...updateValues, existingConfig.id]
      );

      const [updatedRows] = await pool.query(
        'SELECT * FROM flutterwave_configurations WHERE id = ?',
        [existingConfig.id]
      );
      return (updatedRows as any[])[0];
    } else {
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      await pool.query(
        `INSERT INTO flutterwave_configurations (id, ${fields}, isDefault, isLive, chargeCardEnabled, transferEnabled, createdAt, updatedAt) 
         VALUES (UUID(), ${placeholders}, ?, ?, ?, ?, NOW(), NOW())`,
        [
          ...values,
          data.isDefault ?? false,
          data.isLive ?? false,
          data.chargeCardEnabled ?? true,
          data.transferEnabled ?? false
        ]
      );

      const [newRows] = await pool.query(
        'SELECT * FROM flutterwave_configurations WHERE isDefault = true LIMIT 1'
      );
      return (newRows as any[])[0];
    }
  },

  /**
   * Get hotel payment settings
   */
  async getHotelPaymentSettings(hotelId: string) {
    const [rows] = await pool.query(
      'SELECT * FROM hotel_payment_settings WHERE hotelId = ? LIMIT 1',
      [hotelId]
    );
    return (rows as any[])[0] || null;
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
    const [existingRows] = await pool.query(
      'SELECT * FROM hotel_payment_settings WHERE hotelId = ? LIMIT 1',
      [hotelId]
    );
    const existingSettings = (existingRows as any[])[0];

    if (existingSettings) {
      const updateFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(data);
      
      await pool.query(
        `UPDATE hotel_payment_settings SET ${updateFields}, updatedAt = NOW() WHERE id = ?`,
        [...updateValues, existingSettings.id]
      );

      const [updatedRows] = await pool.query(
        'SELECT * FROM hotel_payment_settings WHERE id = ?',
        [existingSettings.id]
      );
      return (updatedRows as any[])[0];
    } else {
      const fields = ['hotelId', ...Object.keys(data)];
      const placeholders = fields.map(() => '?').join(', ');
      const values = [hotelId, ...Object.values(data)];

      await pool.query(
        `INSERT INTO hotel_payment_settings (id, ${fields.join(', ')}, createdAt, updatedAt) 
         VALUES (UUID(), ${placeholders}, NOW(), NOW())`,
        values
      );

      const [newRows] = await pool.query(
        'SELECT * FROM hotel_payment_settings WHERE hotelId = ? LIMIT 1',
        [hotelId]
      );
      return (newRows as any[])[0];
    }
  },
  
  /**
   * Get general site settings
   */
  async getGeneralSettings() {
    const [rows] = await pool.query('SELECT * FROM site_settings LIMIT 1');
    let settings = (rows as any[])[0];
    
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
    const [rows] = await pool.query('SELECT * FROM site_settings LIMIT 1');
    let settings = (rows as any[])[0];
    
    if (settings) {
      const updateFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(data);
      
      await pool.query(
        `UPDATE site_settings SET ${updateFields}, updatedAt = NOW() WHERE id = ?`,
        [...updateValues, settings.id]
      );

      const [updatedRows] = await pool.query('SELECT * FROM site_settings WHERE id = ?', [settings.id]);
      return (updatedRows as any[])[0];
    } else {
      await pool.query(
        `INSERT INTO site_settings (id, siteName, siteDescription, favicon, logo, defaultLanguage, timezone, defaultCurrency, maintenanceMode, maintenanceMsg, createdAt, updatedAt) 
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.siteName || 'Qaras Hotels',
          data.siteDescription || 'Your ultimate hotel booking platform',
          data.favicon || null,
          data.logo || null,
          data.defaultLanguage || 'en',
          data.timezone || 'UTC',
          data.defaultCurrency || 'NGN',
          data.maintenanceMode || false,
          data.maintenanceMsg || null
        ]
      );

      const [newRows] = await pool.query('SELECT * FROM site_settings LIMIT 1');
      return (newRows as any[])[0];
    }
  },
  
  /**
   * Get cookie settings
   */
  async getCookieSettings() {
    const [rows] = await pool.query('SELECT * FROM cookie_settings LIMIT 1');
    let settings = (rows as any[])[0];
    
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
    const [rows] = await pool.query('SELECT * FROM cookie_settings LIMIT 1');
    let settings = (rows as any[])[0];
    
    if (settings) {
      const updateFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(data);
      
      await pool.query(
        `UPDATE cookie_settings SET ${updateFields}, updatedAt = NOW() WHERE id = ?`,
        [...updateValues, settings.id]
      );

      const [updatedRows] = await pool.query('SELECT * FROM cookie_settings WHERE id = ?', [settings.id]);
      return (updatedRows as any[])[0];
    } else {
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      await pool.query(
        `INSERT INTO cookie_settings (id, ${fields}, createdAt, updatedAt) 
         VALUES (UUID(), ${placeholders}, NOW(), NOW())`,
        values
      );

      const [newRows] = await pool.query('SELECT * FROM cookie_settings LIMIT 1');
      return (newRows as any[])[0];
    }
  },
  
  /**
   * Get SEO settings
   */
  async getSeoSettings() {
    const [rows] = await pool.query('SELECT * FROM seo_settings LIMIT 1');
    let settings = (rows as any[])[0];
    
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
    const [rows] = await pool.query('SELECT * FROM seo_settings LIMIT 1');
    let settings = (rows as any[])[0];
    
    if (settings) {
      const updateFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(data);
      
      await pool.query(
        `UPDATE seo_settings SET ${updateFields}, updatedAt = NOW() WHERE id = ?`,
        [...updateValues, settings.id]
      );

      const [updatedRows] = await pool.query('SELECT * FROM seo_settings WHERE id = ?', [settings.id]);
      return (updatedRows as any[])[0];
    } else {
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      await pool.query(
        `INSERT INTO seo_settings (id, ${fields}, createdAt, updatedAt) 
         VALUES (UUID(), ${placeholders}, NOW(), NOW())`,
        values
      );

      const [newRows] = await pool.query('SELECT * FROM seo_settings LIMIT 1');
      return (newRows as any[])[0];
    }
  },
  
  /**
   * Get legal documents
   */
  async getLegalDocuments(type?: string) {
    if (type) {
      const [rows] = await pool.query(
        'SELECT * FROM legal_documents WHERE type = ? AND isPublished = true ORDER BY updatedAt DESC LIMIT 1',
        [type]
      );
      return (rows as any[])[0] || null;
    } else {
      const [rows] = await pool.query(
        'SELECT * FROM legal_documents WHERE isPublished = true ORDER BY updatedAt DESC'
      );
      return rows as any[];
    }
  },
  
  /**
   * Get a specific legal document
   */
  async getLegalDocument(id: string, adminOnly: boolean = false) {
    let query = 'SELECT * FROM legal_documents WHERE id = ?';
    const params = [id];
    
    if (!adminOnly) {
      query += ' AND isPublished = true';
    }
    
    const [rows] = await pool.query(query, params);
    return (rows as any[])[0] || null;
  },
  
  /**
   * Create a new legal document
   */
  async createLegalDocument(data: any) {
    await pool.query(
      `INSERT INTO legal_documents (id, type, title, content, version, isPublished, effectiveDate, createdAt, updatedAt) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.type,
        data.title,
        data.content,
        data.version || '1.0',
        data.isPublished !== undefined ? data.isPublished : true,
        data.effectiveDate ? new Date(data.effectiveDate) : new Date()
      ]
    );

    const [rows] = await pool.query(
      'SELECT * FROM legal_documents WHERE title = ? ORDER BY createdAt DESC LIMIT 1',
      [data.title]
    );
    return (rows as any[])[0];
  },
  
  /**
   * Update a legal document
   */
  async updateLegalDocument(id: string, data: any) {
    const updateFields = [];
    const updateValues = [];
    
    if (data.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(data.title);
    }
    if (data.content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(data.content);
    }
    if (data.version !== undefined) {
      updateFields.push('version = ?');
      updateValues.push(data.version);
    }
    if (data.isPublished !== undefined) {
      updateFields.push('isPublished = ?');
      updateValues.push(data.isPublished);
    }
    if (data.effectiveDate !== undefined) {
      updateFields.push('effectiveDate = ?');
      updateValues.push(data.effectiveDate ? new Date(data.effectiveDate) : null);
    }
    
    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    await pool.query(
      `UPDATE legal_documents SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [rows] = await pool.query('SELECT * FROM legal_documents WHERE id = ?', [id]);
    return (rows as any[])[0];
  },
  
  /**
   * Delete a legal document
   */
  async deleteLegalDocument(id: string) {
    await pool.query('DELETE FROM legal_documents WHERE id = ?', [id]);
    return { success: true };
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