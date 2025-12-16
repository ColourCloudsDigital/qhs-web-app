import pool from '@/lib/db';
import { ThemeSettings } from '@/lib/types/settings';

// Default theme settings
const defaultThemeSettings: ThemeSettings = {
  colorPalette: {
    primary: '#1e40af',
    secondary: '#4b5563',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFontFamily: null,
  },
  buttons: {
    borderRadius: '0.375rem',
    primaryBackground: '#1e40af',
    primaryText: '#ffffff',
    secondaryBackground: '#4b5563',
    secondaryText: '#ffffff',
  },
  layout: {
    containerWidth: '1200px',
    sidebarWidth: '250px',
  },
  customCSS: null,
  logoUrl: null,
  faviconUrl: null,
  loginBannerUrl: null,
};

/**
 * Theme settings service for managing theme and branding
 */
class ThemeService {
  /**
   * Get theme settings
   */
  async getThemeSettings(): Promise<ThemeSettings> {
    try {
      // Check if ThemeSettings table exists by attempting a query
      let tableExists = true;
      try {
        await prisma.$queryRaw`SELECT 1 FROM ThemeSettings LIMIT 1`;
      } catch (error) {
        console.log('ThemeSettings table might not exist yet, returning defaults');
        tableExists = false;
      }
      
      if (!tableExists) {
        return defaultThemeSettings;
      }

      // Get theme settings from database
      const themeSettings = await prisma.themeSettings.findFirst({
        where: { isActive: true }
      });

      // Return default settings if none found
      if (!themeSettings) {
        return defaultThemeSettings;
      }

      try {
        // Transform the data
        return {
          colorPalette: JSON.parse(themeSettings.colorPalette),
          typography: JSON.parse(themeSettings.typography),
          buttons: JSON.parse(themeSettings.buttons),
          layout: JSON.parse(themeSettings.layout),
          customCSS: themeSettings.customCSS,
          logoUrl: themeSettings.logoUrl,
          faviconUrl: themeSettings.faviconUrl,
          loginBannerUrl: themeSettings.loginBannerUrl,
        };
      } catch (parseError) {
        console.error('Error parsing stored JSON settings:', parseError);
        return defaultThemeSettings;
      }
    } catch (error) {
      console.error('Error fetching theme settings:', error);
      return defaultThemeSettings;
    }
  }

  /**
   * Update theme settings
   */
  async updateThemeSettings(settings: ThemeSettings): Promise<ThemeSettings> {
    try {
      // Check if ThemeSettings table exists by attempting a query
      let tableExists = true;
      try {
        await prisma.$queryRaw`SELECT 1 FROM ThemeSettings LIMIT 1`;
      } catch (error) {
        console.error('ThemeSettings table does not exist. Please run the migration first.');
        throw new Error('ThemeSettings table not found in database. Run the migration first.');
      }

      // Find existing settings
      const existingSettings = await prisma.themeSettings.findFirst({
        where: { isActive: true }
      });

      // Prepare data for update or create
      const data = {
        colorPalette: JSON.stringify(settings.colorPalette),
        typography: JSON.stringify(settings.typography),
        buttons: JSON.stringify(settings.buttons),
        layout: JSON.stringify(settings.layout),
        customCSS: settings.customCSS,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        loginBannerUrl: settings.loginBannerUrl,
        isActive: true,
      };

      if (existingSettings) {
        // Update existing settings
        const updated = await prisma.themeSettings.update({
          where: { id: existingSettings.id },
          data: {
            ...data,
            updatedAt: new Date()
          }
        });
        
        return this.transformThemeSettingsResponse(updated);
      } else {
        // Create new settings
        const created = await prisma.themeSettings.create({
          data
        });
        
        return this.transformThemeSettingsResponse(created);
      }
    } catch (error) {
      console.error('Error updating theme settings:', error);
      throw error;
    }
  }

  /**
   * Reset theme settings to defaults
   */
  async resetThemeSettings(): Promise<ThemeSettings> {
    try {
      // Check if ThemeSettings table exists
      let tableExists = true;
      try {
        await prisma.$queryRaw`SELECT 1 FROM ThemeSettings LIMIT 1`;
      } catch (error) {
        console.log('ThemeSettings table does not exist yet');
        tableExists = false;
      }
      
      if (tableExists) {
        // Find existing settings
        const existingSettings = await prisma.themeSettings.findFirst({
          where: { isActive: true }
        });

        if (existingSettings) {
          // Update with default values
          const data = {
            colorPalette: JSON.stringify(defaultThemeSettings.colorPalette),
            typography: JSON.stringify(defaultThemeSettings.typography),
            buttons: JSON.stringify(defaultThemeSettings.buttons),
            layout: JSON.stringify(defaultThemeSettings.layout),
            customCSS: null,
            logoUrl: null,
            faviconUrl: null,
            loginBannerUrl: null,
          };

          await prisma.themeSettings.update({
            where: { id: existingSettings.id },
            data
          });
        } else {
          // Create default settings if none exist
          await prisma.themeSettings.create({
            data: {
              colorPalette: JSON.stringify(defaultThemeSettings.colorPalette),
              typography: JSON.stringify(defaultThemeSettings.typography),
              buttons: JSON.stringify(defaultThemeSettings.buttons),
              layout: JSON.stringify(defaultThemeSettings.layout),
              customCSS: null,
              logoUrl: null,
              faviconUrl: null,
              loginBannerUrl: null,
              isActive: true,
            }
          });
        }
      }

      return defaultThemeSettings;
    } catch (error) {
      console.error('Error resetting theme settings:', error);
      return defaultThemeSettings;
    }
  }

  /**
   * Helper to transform database model to ThemeSettings type
   */
  private transformThemeSettingsResponse(settings: any): ThemeSettings {
    return {
      colorPalette: JSON.parse(settings.colorPalette),
      typography: JSON.parse(settings.typography),
      buttons: JSON.parse(settings.buttons),
      layout: JSON.parse(settings.layout),
      customCSS: settings.customCSS,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      loginBannerUrl: settings.loginBannerUrl,
    };
  }
}

export const themeService = new ThemeService();
export default themeService;