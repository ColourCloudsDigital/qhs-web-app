import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/public/settings/theme
 * Public route to fetch theme settings
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch theme settings from the correct table
    const [themeSettings] = await pool.query<RowDataPacket[]>(`
      SELECT 
        id, colorPalette, typography, buttons, layout, customCSS, 
        logoUrl, faviconUrl, loginBannerUrl
      FROM theme_settings 
      WHERE isActive = 1
      LIMIT 1
    `);
    
    if (themeSettings.length === 0) {
      return NextResponse.json({
        colorPalette: {
          primary: '#1e40af',
          secondary: '#4b5563',
          accent: '#f59e0b',
          background: '#ffffff',
          text: '#111827'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          headingFontFamily: null
        },
        buttons: {
          borderRadius: '0.375rem',
          primaryBackground: '#1e40af',
          primaryText: '#ffffff'
        },
        logoUrl: null,
        faviconUrl: null
      });
    }
    
    // Parse JSON fields
    const settings = themeSettings[0];
    const result = {
      colorPalette: settings.colorPalette ? JSON.parse(settings.colorPalette) : {
        primary: '#1e40af',
        secondary: '#4b5563',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#111827'
      },
      typography: settings.typography ? JSON.parse(settings.typography) : {
        fontFamily: 'Inter, system-ui, sans-serif',
        headingFontFamily: null
      },
      buttons: settings.buttons ? JSON.parse(settings.buttons) : {
        borderRadius: '0.375rem',
        primaryBackground: '#1e40af',
        primaryText: '#ffffff'
      },
      layout: settings.layout ? JSON.parse(settings.layout) : null,
      customCSS: settings.customCSS,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      loginBannerUrl: settings.loginBannerUrl
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    // Return default theme in case of error
    return NextResponse.json({
      colorPalette: {
        primary: '#1e40af',
        secondary: '#4b5563',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#111827'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        headingFontFamily: null
      },
      buttons: {
        borderRadius: '0.375rem',
        primaryBackground: '#1e40af',
        primaryText: '#ffffff'
      },
      logoUrl: null,
      faviconUrl: null
    });
  }
} 