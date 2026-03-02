import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';


/**
 * GET /api/public/settings
 * Public route to fetch site settings
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch public site settings from site_settings table
    const [siteSettings] = await pool.query<RowDataPacket[]>(
      'SELECT siteName, siteDescription, defaultLanguage, defaultCurrency FROM site_settings LIMIT 1'
    );
    
    // Fetch theme settings (logo, favicon, colors)
    const [themeSettings] = await pool.query<RowDataPacket[]>(
      'SELECT logoUrl, faviconUrl, colorPalette FROM theme_settings WHERE isActive = 1 LIMIT 1'
    );
    
    // Combine settings
    const settings: any = siteSettings.length > 0 ? siteSettings[0] : {};
    
    if (themeSettings.length > 0) {
      const theme = themeSettings[0];
      settings.logoUrl = theme.logoUrl;
      settings.faviconUrl = theme.faviconUrl;
      
      // Parse colorPalette JSON if it exists
      if (theme.colorPalette) {
        try {
          const colorPalette = typeof theme.colorPalette === 'string' 
            ? JSON.parse(theme.colorPalette) 
            : theme.colorPalette;
          settings.primaryColor = colorPalette.primary || null;
          settings.secondaryColor = colorPalette.secondary || null;
        } catch (e) {
          console.error('Error parsing colorPalette:', e);
        }
      }
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching public site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
} 
