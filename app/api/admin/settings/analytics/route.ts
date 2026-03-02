import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';


// Analytics settings schema validation (accepts document-shaped payload)
const analyticsSettingsSchema = z.object({
  googleAnalytics: z
    .object({
      enabled: z.boolean().optional(),
      measurementId: z.string().optional(),
      enableDemographics: z.boolean().optional(),
      enableEnhancedLinkAttribution: z.boolean().optional(),
      anonymizeIp: z.boolean().optional(),
    })
    .optional(),
  googleTagManager: z
    .object({ enabled: z.boolean().optional(), id: z.string().optional() })
    .optional(),
  facebookPixel: z
    .object({ enabled: z.boolean().optional(), id: z.string().optional() })
    .optional(),
  hotjar: z.object({ enabled: z.boolean().optional(), id: z.string().optional() }).optional(),
  customTracking: z
    .object({ enabled: z.boolean().optional(), headScripts: z.string().optional(), bodyStartScripts: z.string().optional(), bodyEndScripts: z.string().optional(), customScriptsRaw: z.string().optional() })
    .optional(),
  dataRetentionPeriod: z.number().int().optional(),
  anonymizeIp: z.boolean().optional(),
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
  googleTagManager: { enabled: false, id: '' },
  facebookPixel: { enabled: false, id: '' },
  hotjar: { enabled: false, id: '' },
  customTracking: { enabled: false, headScripts: '', bodyStartScripts: '', bodyEndScripts: '', customScriptsRaw: '' },
  dataRetentionPeriod: 365,
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
    const [rows] = await pool.query(`
      SELECT * FROM analytics_settings
      ORDER BY createdAt DESC
      LIMIT 1
    `);

    // If none found, create a default row with columns present in DB
    if (!rows || (rows as any[]).length === 0) {
      const googleAnalyticsEnabled = defaultSettings.googleAnalytics.enabled ? 1 : 0;
      const googleAnalyticsId = defaultSettings.googleAnalytics.measurementId || null;
      const googleTagManagerEnabled = defaultSettings.googleTagManager.enabled ? 1 : 0;
      const googleTagManagerId = defaultSettings.googleTagManager.id || null;
      const facebookPixelEnabled = defaultSettings.facebookPixel.enabled ? 1 : 0;
      const facebookPixelId = defaultSettings.facebookPixel.id || null;
      const hotjarEnabled = defaultSettings.hotjar.enabled ? 1 : 0;
      const hotjarId = defaultSettings.hotjar.id || null;
      const customScripts = JSON.stringify({
        ...defaultSettings.customTracking,
      });
      const dataRetentionPeriod = defaultSettings.dataRetentionPeriod;
      const anonymizeIp = defaultSettings.googleAnalytics.anonymizeIp ? 1 : 0;

      await pool.query(
        `INSERT INTO analytics_settings (
          id,
          googleAnalyticsEnabled,
          googleAnalyticsId,
          googleTagManagerEnabled,
          googleTagManagerId,
          facebookPixelEnabled,
          facebookPixelId,
          hotjarEnabled,
          hotjarId,
          customScripts,
          dataRetentionPeriod,
          anonymizeIp,
          createdAt,
          updatedAt
        ) VALUES (
          UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )`,
        [
          googleAnalyticsEnabled,
          googleAnalyticsId,
          googleTagManagerEnabled,
          googleTagManagerId,
          facebookPixelEnabled,
          facebookPixelId,
          hotjarEnabled,
          hotjarId,
          customScripts,
          dataRetentionPeriod,
          anonymizeIp,
        ]
      );

      return NextResponse.json(defaultSettings);
    }

    try {
      const settings = (rows as any[])[0];

      // Parse customScripts if it was stored as JSON; otherwise treat as raw string
      let parsedCustom = {
        enabled: false,
        headScripts: '',
        bodyStartScripts: '',
        bodyEndScripts: '',
        customScriptsRaw: '',
      };

      if (settings.customScripts) {
        try {
          const parsed = JSON.parse(settings.customScripts);
          if (typeof parsed === 'object') {
            parsedCustom = { ...parsedCustom, ...parsed };
          } else if (typeof parsed === 'string') {
            parsedCustom.customScriptsRaw = parsed;
          }
        } catch {
          // not JSON, save raw
          parsedCustom.customScriptsRaw = String(settings.customScripts);
        }
      }

      const transformed = {
        googleAnalytics: {
          enabled: Boolean(settings.googleAnalyticsEnabled),
          measurementId: settings.googleAnalyticsId || '',
          enableDemographics: false,
          enableEnhancedLinkAttribution: true,
          anonymizeIp: Boolean(settings.anonymizeIp),
        },
        googleTagManager: {
          enabled: Boolean(settings.googleTagManagerEnabled),
          id: settings.googleTagManagerId || '',
        },
        facebookPixel: {
          enabled: Boolean(settings.facebookPixelEnabled),
          id: settings.facebookPixelId || '',
        },
        hotjar: {
          enabled: Boolean(settings.hotjarEnabled),
          id: settings.hotjarId || '',
        },
        customTracking: parsedCustom,
        dataRetentionPeriod: settings.dataRetentionPeriod ?? 365,
      };

      return NextResponse.json(transformed);
    } catch (parseError) {
      console.error('Error transforming analytics settings:', parseError);
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

    // Parse and validate the request body (document-shaped allowed)
    const body = await request.json();
    const validatedData = analyticsSettingsSchema.parse(body);

    // Normalize incoming values with defaults
    const ga = validatedData.googleAnalytics ?? defaultSettings.googleAnalytics;
    const gtm = validatedData.googleTagManager ?? defaultSettings.googleTagManager;
    const fb = validatedData.facebookPixel ?? defaultSettings.facebookPixel;
    const hotjar = validatedData.hotjar ?? defaultSettings.hotjar;
    const custom = validatedData.customTracking ?? defaultSettings.customTracking;
    const dataRetentionPeriod = validatedData.dataRetentionPeriod ?? defaultSettings.dataRetentionPeriod;
    const anonymizeIp = validatedData.anonymizeIp ?? ga.anonymizeIp ?? defaultSettings.googleAnalytics.anonymizeIp;

    // Map to DB columns
    const googleAnalyticsEnabled = ga.enabled ? 1 : 0;
    const googleAnalyticsId = ga.measurementId || null;
    const googleTagManagerEnabled = gtm.enabled ? 1 : 0;
    const googleTagManagerId = gtm.id || null;
    const facebookPixelEnabled = fb.enabled ? 1 : 0;
    const facebookPixelId = fb.id || null;
    const hotjarEnabled = hotjar.enabled ? 1 : 0;
    const hotjarId = hotjar.id || null;

    // Store customTracking as JSON in customScripts column for flexibility
    const customScripts = JSON.stringify({ ...custom });

    // Check if analytics settings exist
    const [existingRows] = await pool.query(`
      SELECT * FROM analytics_settings
      ORDER BY createdAt DESC
      LIMIT 1
    `);

    if (existingRows && (existingRows as any[]).length > 0) {
      const settingId = (existingRows as any[])[0].id;
      await pool.query(`
        UPDATE analytics_settings SET
          googleAnalyticsEnabled = ?,
          googleAnalyticsId = ?,
          googleTagManagerEnabled = ?,
          googleTagManagerId = ?,
          facebookPixelEnabled = ?,
          facebookPixelId = ?,
          hotjarEnabled = ?,
          hotjarId = ?,
          customScripts = ?,
          dataRetentionPeriod = ?,
          anonymizeIp = ?,
          updatedAt = NOW()
        WHERE id = ?
      `, [
        googleAnalyticsEnabled,
        googleAnalyticsId,
        googleTagManagerEnabled,
        googleTagManagerId,
        facebookPixelEnabled,
        facebookPixelId,
        hotjarEnabled,
        hotjarId,
        customScripts,
        dataRetentionPeriod,
        anonymizeIp ? 1 : 0,
        settingId,
      ]);
    } else {
      await pool.query(`
        INSERT INTO analytics_settings (
          id,
          googleAnalyticsEnabled,
          googleAnalyticsId,
          googleTagManagerEnabled,
          googleTagManagerId,
          facebookPixelEnabled,
          facebookPixelId,
          hotjarEnabled,
          hotjarId,
          customScripts,
          dataRetentionPeriod,
          anonymizeIp,
          createdAt,
          updatedAt
        ) VALUES (
          UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
      `, [
        googleAnalyticsEnabled,
        googleAnalyticsId,
        googleTagManagerEnabled,
        googleTagManagerId,
        facebookPixelEnabled,
        facebookPixelId,
        hotjarEnabled,
        hotjarId,
        customScripts,
        dataRetentionPeriod,
        anonymizeIp ? 1 : 0,
      ]);
    }

    // Return the saved settings in document shape
    const [updatedRows] = await pool.query(`
      SELECT * FROM analytics_settings
      ORDER BY createdAt DESC
      LIMIT 1
    `);

    if (updatedRows && (updatedRows as any[]).length > 0) {
      const s = (updatedRows as any[])[0];

      let parsedCustom = { enabled: false, headScripts: '', bodyStartScripts: '', bodyEndScripts: '', customScriptsRaw: '' };
      if (s.customScripts) {
        try {
          const parsed = JSON.parse(s.customScripts);
          if (typeof parsed === 'object') parsedCustom = { ...parsedCustom, ...parsed };
          else parsedCustom.customScriptsRaw = String(s.customScripts);
        } catch {
          parsedCustom.customScriptsRaw = String(s.customScripts);
        }
      }

      const responseData = {
        googleAnalytics: {
          enabled: Boolean(s.googleAnalyticsEnabled),
          measurementId: s.googleAnalyticsId || '',
          enableDemographics: false,
          enableEnhancedLinkAttribution: true,
          anonymizeIp: Boolean(s.anonymizeIp),
        },
        googleTagManager: { enabled: Boolean(s.googleTagManagerEnabled), id: s.googleTagManagerId || '' },
        facebookPixel: { enabled: Boolean(s.facebookPixelEnabled), id: s.facebookPixelId || '' },
        hotjar: { enabled: Boolean(s.hotjarEnabled), id: s.hotjarId || '' },
        customTracking: parsedCustom,
        dataRetentionPeriod: s.dataRetentionPeriod ?? 365,
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
