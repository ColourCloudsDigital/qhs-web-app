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
      const settings = await prisma.analyticsSettings.findFirst({
        where: { isActive: true },
      });

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
      const existingSettings = await prisma.analyticsSettings.findFirst({
        where: { isActive: true },
      });

      const data = {
        googleAnalytics: JSON.stringify(settings.googleAnalytics),
        metaTags: JSON.stringify(settings.metaTags),
        customTracking: JSON.stringify(settings.customTracking),
        isActive: true,
        updatedAt: new Date(),
      };

      if (existingSettings) {
        await prisma.analyticsSettings.update({
          where: { id: existingSettings.id },
          data,
        });
      } else {
        await prisma.analyticsSettings.create({
          data: {
            ...data,
            createdAt: new Date(),
          },
        });
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