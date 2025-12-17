import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { z } from 'zod';

// Analytics settings schema validation
const analyticsSettingsSchema = z.object({
  googleAnalytics: z.object({
    enabled: z.boolean(),
    measurementId: z.string(),
    enableDemographics: z.boolean(),
    enableEnhancedLinkAttribution: z.boolean(),
    anonymizeIp: z.boolean(),
  }),
  metaTags: z.object({
    googleSiteVerification: z.string(),
    bingSiteVerification: z.string(),
    yandexSiteVerification: z.string(),
  }),
  customTracking: z.object({
    enabled: z.boolean(),
    headScripts: z.string(),
    bodyStartScripts: z.string(),
    bodyEndScripts: z.string(),
  }),
});

// Default settings object
const defaultSettings = {
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

/**
 * GET /api/admin/settings/analytics
 * Fetch analytics settings
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a SUPER_ADMIN
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get analytics settings from database
    const [analyticsSettings] = await pool.query(`
      SELECT * FROM analytics_settings
      WHERE isActive = TRUE
      LIMIT 1
    `);

    // Return default settings if none found
    if (!analyticsSettings || (analyticsSettings as any[]).length === 0) {
      // Create default settings
      const googleAnalyticsJSON = JSON.stringify(defaultSettings.googleAnalytics);
      const metaTagsJSON = JSON.stringify(defaultSettings.metaTags);
      const customTrackingJSON = JSON.stringify(defaultSettings.customTracking);
      
      await pool.query(`
        INSERT INTO analytics_settings (
          id,
          googleAnalyticsEnabled,
          metaTags,
          customTracking,
          isActive
        ) VALUES (
          UUID(),
          ?,
          ?,
          ?,
          TRUE
        )
      `, [googleAnalyticsJSON, metaTagsJSON, customTrackingJSON]);
      
      return NextResponse.json(defaultSettings);
    }

    // Transform the data if needed
    try {
      const settings = (analyticsSettings as any[])[0];
      const transformedSettings = {
        googleAnalytics: JSON.parse(settings.googleAnalytics || '{}'),
        metaTags: JSON.parse(settings.metaTags || '{}'),
        customTracking: JSON.parse(settings.customTracking || '{}'),
      };

      return NextResponse.json(transformedSettings);
    } catch (parseError) {
      console.error('Error parsing stored JSON settings:', parseError);
      return NextResponse.json(defaultSettings);
    }
  } catch (error) {
    console.error('Error fetching analytics settings:', error);
    return NextResponse.json(defaultSettings);
  }
}

/**
 * PUT /api/admin/settings/analytics
 * Update analytics settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a SUPER_ADMIN
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await request.json();
    const validatedData = analyticsSettingsSchema.parse(body);

    // Check if analytics settings exist
    const [existingSettings] = await pool.query(`
      SELECT * FROM analytics_settings
      WHERE isActive = TRUE
      LIMIT 1
    `);
    
    const googleAnalyticsJSON = JSON.stringify(validatedData.googleAnalytics);
    const metaTagsJSON = JSON.stringify(validatedData.metaTags);
    const customTrackingJSON = JSON.stringify(validatedData.customTracking);
    
    // Update or create analytics settings
    if (existingSettings && (existingSettings as any[]).length > 0) {
      const settingId = (existingSettings as any[])[0].id;
      
      await pool.query(`
        UPDATE analytics_settings SET
          googleAnalyticsEnabled = ?,
          metaTags = ?,
          customTracking = ?,
          updatedAt = NOW()
        WHERE id = ?
      `, [googleAnalyticsJSON, metaTagsJSON, customTrackingJSON, settingId]);
    } else {
      await pool.query(`
        INSERT INTO analytics_settings (
          id,
          googleAnalyticsEnabled,
          metaTags,
          customTracking,
          isActive
        ) VALUES (
          UUID(),
          ?,
          ?,
          ?,
          TRUE
        )
      `, [googleAnalyticsJSON, metaTagsJSON, customTrackingJSON]);
    }
    
    // Get the updated settings
    const [updatedSettings] = await pool.query(`
      SELECT * FROM analytics_settings
      WHERE isActive = TRUE
      LIMIT 1
    `);
    
    if (updatedSettings && (updatedSettings as any[]).length > 0) {
      const settings = (updatedSettings as any[])[0];
      
      // Transform for response
      const responseData = {
        googleAnalytics: JSON.parse(settings.googleAnalytics || '{}'),
        metaTags: JSON.parse(settings.metaTags || '{}'),
        customTracking: JSON.parse(settings.customTracking || '{}'),
      };
      
      return NextResponse.json({ success: true, data: responseData });
    }
    
    return NextResponse.json({ success: true, data: validatedData });
  } catch (error) {
    console.error('Error updating analytics settings:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update analytics settings' },
      { status: 500 }
    );
  }
}