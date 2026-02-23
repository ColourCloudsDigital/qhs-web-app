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
      // Check if theme_settings table exists by attempting a query
      let tableExists = true;
      try {
        await pool.query('SELECT 1 FROM theme_settings LIMIT 1');
      } catch (error) {
        console.log('theme_settings table might not exist yet, returning defaults');
        tableExists = false;
      }
      
      if (!tableExists) {
        return defaultThemeSettings;
      }

      // Get theme settings from database
      const [rows] = await pool.query(
        'SELECT * FROM theme_settings WHERE isActive = true LIMIT 1'
      );

      const themeSettings = (rows as any[])[0];

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
      // Check if theme_settings table exists by attempting a query
      let tableExists = true;
      try {
        await pool.query('SELECT 1 FROM theme_settings LIMIT 1');
      } catch (error) {
        console.error('theme_settings table does not exist. Please run the migration first.');
        throw new Error('theme_settings table not found in database. Run the migration first.');
      }

      // Find existing settings
      const [existingRows] = await pool.query(
        'SELECT * FROM theme_settings WHERE isActive = true LIMIT 1'
      );

      const existingSettings = (existingRows as any[])[0];

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
        await pool.query(
          `UPDATE theme_settings 
           SET colorPalette = ?, typography = ?, buttons = ?, layout = ?, 
               customCSS = ?, logoUrl = ?, faviconUrl = ?, loginBannerUrl = ?, 
               isActive = ?, updatedAt = NOW() 
           WHERE id = ?`,
          [
            data.colorPalette,
            data.typography,
            data.buttons,
            data.layout,
            data.customCSS,
            data.logoUrl,
            data.faviconUrl,
            data.loginBannerUrl,
            data.isActive,
            existingSettings.id
          ]
        );
        
        const [updatedRows] = await pool.query(
          'SELECT * FROM theme_settings WHERE id = ?',
          [existingSettings.id]
        );
        
        return this.transformThemeSettingsResponse((updatedRows as any[])[0]);
      } else {
        // Create new settings
        await pool.query(
          `INSERT INTO theme_settings (id, colorPalette, typography, buttons, layout, customCSS, logoUrl, faviconUrl, loginBannerUrl, isActive, createdAt, updatedAt) 
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            data.colorPalette,
            data.typography,
            data.buttons,
            data.layout,
            data.customCSS,
            data.logoUrl,
            data.faviconUrl,
            data.loginBannerUrl,
            data.isActive
          ]
        );
        
        const [createdRows] = await pool.query(
          'SELECT * FROM theme_settings WHERE isActive = true LIMIT 1'
        );
        
        return this.transformThemeSettingsResponse((createdRows as any[])[0]);
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
      // Check if theme_settings table exists
      let tableExists = true;
      try {
        await pool.query('SELECT 1 FROM theme_settings LIMIT 1');
      } catch (error) {
        console.log('theme_settings table does not exist yet');
        tableExists = false;
      }
      
      if (tableExists) {
        // Find existing settings
        const [existingRows] = await pool.query(
          'SELECT * FROM theme_settings WHERE isActive = true LIMIT 1'
        );

        const existingSettings = (existingRows as any[])[0];

        if (existingSettings) {
          // Update with default values
          await pool.query(
            `UPDATE theme_settings 
             SET colorPalette = ?, typography = ?, buttons = ?, layout = ?, 
                 customCSS = NULL, logoUrl = NULL, faviconUrl = NULL, loginBannerUrl = NULL, 
                 updatedAt = NOW() 
             WHERE id = ?`,
            [
              JSON.stringify(defaultThemeSettings.colorPalette),
              JSON.stringify(defaultThemeSettings.typography),
              JSON.stringify(defaultThemeSettings.buttons),
              JSON.stringify(defaultThemeSettings.layout),
              existingSettings.id
            ]
          );
        } else {
          // Create default settings if none exist
          await pool.query(
            `INSERT INTO theme_settings (id, colorPalette, typography, buttons, layout, customCSS, logoUrl, faviconUrl, loginBannerUrl, isActive, createdAt, updatedAt) 
             VALUES (UUID(), ?, ?, ?, ?, NULL, NULL, NULL, NULL, true, NOW(), NOW())`,
            [
              JSON.stringify(defaultThemeSettings.colorPalette),
              JSON.stringify(defaultThemeSettings.typography),
              JSON.stringify(defaultThemeSettings.buttons),
              JSON.stringify(defaultThemeSettings.layout)
            ]
          );
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