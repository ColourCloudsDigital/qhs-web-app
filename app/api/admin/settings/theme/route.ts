import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { z } from 'zod';

// Theme settings schema validation
const themeSettingsSchema = z.object({
  colorPalette: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
    success: z.string(),
    warning: z.string(),
    error: z.string(),
    info: z.string(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    headingFontFamily: z.string().nullable(),
  }),
  buttons: z.object({
    borderRadius: z.string(),
    primaryBackground: z.string(),
    primaryText: z.string(),
    secondaryBackground: z.string(),
    secondaryText: z.string(),
  }),
  layout: z.object({
    containerWidth: z.string(),
    sidebarWidth: z.string(),
  }),
  customCSS: z.string().nullable(),
  logoUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  loginBannerUrl: z.string().nullable().optional(),
});

// Default theme settings
const defaultThemeSettings = {
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

// Check if ThemeSettings table exists
async function checkThemeSettingsTable() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM ThemeSettings LIMIT 1`;
    return true;
  } catch (error) {
    console.log('ThemeSettings table does not exist yet');
    return false;
  }
}

/**
 * GET /api/admin/settings/theme
 * Fetch theme settings
 */
export async function GET(request: NextRequest) {
  try {
    // Get theme settings from database
    const [settings] = await pool.query(`
      SELECT * FROM theme_settings LIMIT 1
    `);
    
    // If no settings exist, create default settings
    if (!settings || (settings as any[]).length === 0) {
      const [result] = await pool.query(`
        INSERT INTO theme_settings (
          id, activeTheme, fontFamily, primaryColor, secondaryColor,
          accentColor, textColor, backgroundColor, buttonStyle, cardStyle,
          darkModeEnabled
        ) VALUES (
          UUID(), 
          'default',
          'Inter, system-ui, sans-serif',
          '#1E40AF',
          '#60A5FA',
          '#FBBF24',
          '#111827',
          '#FFFFFF',
          'rounded',
          'standard',
          TRUE
        )
      `);
      
      const [newSettings] = await pool.query(`
        SELECT * FROM theme_settings LIMIT 1
      `);
      
      return NextResponse.json((newSettings as any[])[0]);
    }
    
    // Parse any JSON fields if needed
    const themeSettings = (settings as any[])[0];
    if (themeSettings.headerStyle) {
      try {
        themeSettings.headerStyle = JSON.parse(themeSettings.headerStyle);
      } catch (e) {
        themeSettings.headerStyle = null;
      }
    }
    
    if (themeSettings.footerStyle) {
      try {
        themeSettings.footerStyle = JSON.parse(themeSettings.footerStyle);
      } catch (e) {
        themeSettings.footerStyle = null;
      }
    }
    
    return NextResponse.json(themeSettings);
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme settings' }, 
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/theme
 * Update theme settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a super admin
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' }, 
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Process any JSON fields
    if (data.headerStyle && typeof data.headerStyle === 'object') {
      data.headerStyle = JSON.stringify(data.headerStyle);
    }
    
    if (data.footerStyle && typeof data.footerStyle === 'object') {
      data.footerStyle = JSON.stringify(data.footerStyle);
    }
    
    // Get theme settings
    const [settings] = await pool.query(`
      SELECT * FROM theme_settings LIMIT 1
    `);
    
    // Update or create settings
    if (settings && (settings as any[]).length > 0) {
      const settingsId = (settings as any[])[0].id;
      
      // Build UPDATE query dynamically
      let updateQuery = `UPDATE theme_settings SET `;
      const updateValues = [];
      const fieldsToUpdate = [
        'activeTheme', 'fontFamily', 'primaryColor', 'secondaryColor',
        'accentColor', 'textColor', 'backgroundColor', 'headerStyle',
        'footerStyle', 'buttonStyle', 'cardStyle', 'darkModeEnabled', 'customCSS'
      ];
      
      let updateFields = [];
      
      for (const field of fieldsToUpdate) {
        if (data[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(data[field]);
        }
      }
      
      updateQuery += updateFields.join(', ') + ', updatedAt = NOW() WHERE id = ?';
      updateValues.push(settingsId);
      
      await pool.query(updateQuery, updateValues);
      
      const [updatedSettings] = await pool.query(`
        SELECT * FROM theme_settings WHERE id = ?
      `, [settingsId]);
      
      // Parse JSON fields for response
      const themeSettings = (updatedSettings as any[])[0];
      if (themeSettings.headerStyle) {
        try {
          themeSettings.headerStyle = JSON.parse(themeSettings.headerStyle);
        } catch (e) {
          themeSettings.headerStyle = null;
        }
      }
      
      if (themeSettings.footerStyle) {
        try {
          themeSettings.footerStyle = JSON.parse(themeSettings.footerStyle);
        } catch (e) {
          themeSettings.footerStyle = null;
        }
      }
      
      return NextResponse.json({
        message: 'Theme settings updated successfully',
        data: themeSettings
      });
    } else {
      // Create new settings with default values + provided values
      const fields = ['id'];
      const placeholders = ['UUID()'];
      const values = [];
      
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          fields.push(key);
          placeholders.push('?');
          values.push(value);
        }
      }
      
      const query = `
        INSERT INTO theme_settings (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;
      
      const [result] = await pool.query(query, values);
      
      const [newSettings] = await pool.query(`
        SELECT * FROM theme_settings LIMIT 1
      `);
      
      // Parse JSON fields for response
      const themeSettings = (newSettings as any[])[0];
      if (themeSettings.headerStyle) {
        try {
          themeSettings.headerStyle = JSON.parse(themeSettings.headerStyle);
        } catch (e) {
          themeSettings.headerStyle = null;
        }
      }
      
      if (themeSettings.footerStyle) {
        try {
          themeSettings.footerStyle = JSON.parse(themeSettings.footerStyle);
        } catch (e) {
          themeSettings.footerStyle = null;
        }
      }
      
      return NextResponse.json({
        message: 'Theme settings created successfully',
        data: themeSettings
      });
    }
  } catch (error) {
    console.error('Error updating theme settings:', error);
    return NextResponse.json(
      { error: 'Failed to update theme settings' }, 
      { status: 500 }
    );
  }
}