import pool from '@/lib/db';

interface GoogleAnalyticsSettings {
  enabled: boolean;
  measurementId: string;
  enableDemographics: boolean;
  enableEnhancedLinkAttribution: boolean;
  anonymizeIp: boolean;
}

interface MetaTagsSettings {
  googleSiteVerification: string;
  bingSiteVerification: string;
  yandexSiteVerification: string;
}

interface CustomTrackingSettings {
  enabled: boolean;
  headScripts: string;
  bodyStartScripts: string;
  bodyEndScripts: string;
}

interface AnalyticsSettings {
  googleAnalytics: GoogleAnalyticsSettings;
  metaTags: MetaTagsSettings;
  customTracking: CustomTrackingSettings;
}

// Default analytics settings
const defaultSettings: AnalyticsSettings = {
  googleAnalytics: {
    enabled: false,
    measurementId: '',
    enableDemographics: false,
    enableEnhancedLinkAttribution: true,
    anonymizeIp: true,
  },
  metaTags: {
    googleSiteVerification: '',
    bingSiteVerification: '',
    yandexSiteVerification: '',
  },
  customTracking: {
    enabled: false,
    headScripts: '',
    bodyStartScripts: '',
    bodyEndScripts: '',
  },
};

class AnalyticsService {
  /**
   * Get analytics settings
   */
  async getSettings(): Promise<AnalyticsSettings> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM analytics_settings WHERE isActive = true LIMIT 1'
      );

      const settings = (rows as any[])[0];

      if (!settings) {
        return defaultSettings;
      }

      return {
        googleAnalytics: JSON.parse(settings.googleAnalytics),
        metaTags: JSON.parse(settings.metaTags),
        customTracking: JSON.parse(settings.customTracking),
      };
    } catch (error) {
      console.error('Error fetching analytics settings:', error);
      return defaultSettings;
    }
  }

  /**
   * Update analytics settings
   */
  async updateSettings(settings: AnalyticsSettings): Promise<void> {
    try {
      const [existingRows] = await pool.query(
        'SELECT * FROM analytics_settings WHERE isActive = true LIMIT 1'
      );

      const existingSettings = (existingRows as any[])[0];

      const data = {
        googleAnalytics: JSON.stringify(settings.googleAnalytics),
        metaTags: JSON.stringify(settings.metaTags),
        customTracking: JSON.stringify(settings.customTracking),
        isActive: true,
      };

      if (existingSettings) {
        await pool.query(
          `UPDATE analytics_settings 
           SET googleAnalytics = ?, metaTags = ?, customTracking = ?, isActive = ?, updatedAt = NOW() 
           WHERE id = ?`,
          [data.googleAnalytics, data.metaTags, data.customTracking, data.isActive, existingSettings.id]
        );
      } else {
        await pool.query(
          `INSERT INTO analytics_settings (id, googleAnalytics, metaTags, customTracking, isActive, createdAt, updatedAt) 
           VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())`,
          [data.googleAnalytics, data.metaTags, data.customTracking, data.isActive]
        );
      }
    } catch (error) {
      console.error('Error updating analytics settings:', error);
      throw error;
    }
  }

  /**
   * Get Google Analytics script
   */
  getGoogleAnalyticsScript(): string | null {
    return null; // Implemented on client side
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;