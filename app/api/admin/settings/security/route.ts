import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { z } from 'zod';

// Security settings schema validation
const securitySettingsSchema = z.object({
  passwordStrength: z.enum(['basic', 'medium', 'strong']),
  passwordExpiryDays: z.number().min(0).max(365),
  maxLoginAttempts: z.number().min(1).max(10),
  twoFactorRequiredFor: z.array(z.string()),
  sessionTimeoutMinutes: z.number().min(0),
  rememberMeDays: z.number().min(0).max(90),
  apiRateLimit: z.number().min(0),
  apiSecurityMode: z.enum(['standard', 'enhanced', 'strict']),
  corsEnabled: z.boolean(),
  corsAllowedDomains: z.array(z.string())
});

/**
 * GET /api/admin/settings/security
 * Fetch security settings
 */
export async function GET() {
  try {
    console.log("[Security API] GET request received");
    
    const session = await getServerSession(authOptions);
    console.log("[Security API] Session:", session?.user?.role);
    
    // Check if user is authenticated and is a SUPER_ADMIN
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      console.log("[Security API] Unauthorized access");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get security settings from database
    console.log("[Security API] Querying security settings");
    
    const [securitySettings] = await pool.query(`
      SELECT * FROM security_settings
      WHERE isActive = TRUE
      LIMIT 1
    `);
    
    console.log("[Security API] Found settings:", (securitySettings as any[]).length > 0);

    // Return default settings if none found
    if (!securitySettings || (securitySettings as any[]).length === 0) {
      console.log("[Security API] No settings found, returning defaults");
      
      // Create default settings in the database
      await pool.query(`
        INSERT INTO security_settings (
          id, 
          passwordStrength, 
          passwordExpiryDays, 
          maxLoginAttempts, 
          twoFactorRequiredFor, 
          sessionTimeoutMinutes, 
          rememberMeDays, 
          apiRateLimit, 
          apiSecurityMode, 
          corsEnabled, 
          corsAllowedDomains,
          isActive
        ) VALUES (
          UUID(),
          'medium',
          0,
          5,
          '["SUPER_ADMIN"]',
          60,
          30,
          100,
          'standard',
          TRUE,
          '[]',
          TRUE
        )
      `);
      
      const [newSettings] = await pool.query(`
        SELECT * FROM security_settings
        WHERE isActive = TRUE
        LIMIT 1
      `);
      
      // Transform the data
      const settings = (newSettings as any[])[0];
      const transformedSettings = {
        passwordStrength: settings.passwordStrength,
        passwordExpiryDays: settings.passwordExpiryDays,
        maxLoginAttempts: settings.maxLoginAttempts,
        twoFactorRequiredFor: JSON.parse(settings.twoFactorRequiredFor || '[]'),
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        rememberMeDays: settings.rememberMeDays,
        apiRateLimit: settings.apiRateLimit,
        apiSecurityMode: settings.apiSecurityMode,
        corsEnabled: settings.corsEnabled,
        corsAllowedDomains: JSON.parse(settings.corsAllowedDomains || '[]'),
      };
      
      return NextResponse.json(transformedSettings);
    }

    // Transform the data
    const settings = (securitySettings as any[])[0];
    const transformedSettings = {
      passwordStrength: settings.passwordStrength,
      passwordExpiryDays: settings.passwordExpiryDays,
      maxLoginAttempts: settings.maxLoginAttempts,
      twoFactorRequiredFor: JSON.parse(settings.twoFactorRequiredFor || '[]'),
      sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
      rememberMeDays: settings.rememberMeDays,
      apiRateLimit: settings.apiRateLimit,
      apiSecurityMode: settings.apiSecurityMode,
      corsEnabled: settings.corsEnabled,
      corsAllowedDomains: JSON.parse(settings.corsAllowedDomains || '[]'),
    };

    console.log("[Security API] Returning settings");
    return NextResponse.json(transformedSettings);
  } catch (error) {
    console.error("[Security API] Unexpected error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch security settings', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/security
 * Update security settings
 */
export async function PUT(request: NextRequest) {
  try {
    console.log("[Security API] PUT request received");
    
    const session = await getServerSession(authOptions);
    console.log("[Security API] Session:", session?.user?.role);
    
    // Check if user is authenticated and is a SUPER_ADMIN
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      console.log("[Security API] Unauthorized access");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await request.json();
    console.log("[Security API] Request body:", body);
    
    let validatedData;
    try {
      validatedData = securitySettingsSchema.parse(body);
      console.log("[Security API] Data validated successfully");
    } catch (validationError) {
      console.error("[Security API] Validation error:", validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check if a security settings record exists
    console.log("[Security API] Checking for existing settings");
    
    const [existingSettings] = await pool.query(`
      SELECT * FROM security_settings
      WHERE isActive = TRUE
      LIMIT 1
    `);
    
    console.log("[Security API] Existing settings found:", (existingSettings as any[]).length > 0);

    if (existingSettings && (existingSettings as any[]).length > 0) {
      // Update existing settings
      console.log("[Security API] Updating existing settings");
      const settingId = (existingSettings as any[])[0].id;
      
      await pool.query(`
        UPDATE security_settings
        SET 
          passwordStrength = ?,
          passwordExpiryDays = ?,
          maxLoginAttempts = ?,
          twoFactorRequiredFor = ?,
          sessionTimeoutMinutes = ?,
          rememberMeDays = ?,
          apiRateLimit = ?,
          apiSecurityMode = ?,
          corsEnabled = ?,
          corsAllowedDomains = ?,
          updatedAt = NOW()
        WHERE id = ?
      `, [
        validatedData.passwordStrength,
        validatedData.passwordExpiryDays,
        validatedData.maxLoginAttempts,
        JSON.stringify(validatedData.twoFactorRequiredFor),
        validatedData.sessionTimeoutMinutes,
        validatedData.rememberMeDays,
        validatedData.apiRateLimit,
        validatedData.apiSecurityMode,
        validatedData.corsEnabled,
        JSON.stringify(validatedData.corsAllowedDomains),
        settingId
      ]);
    } else {
      // Create new settings
      console.log("[Security API] Creating new settings");
      
      await pool.query(`
        INSERT INTO security_settings (
          id,
          passwordStrength,
          passwordExpiryDays,
          maxLoginAttempts,
          twoFactorRequiredFor,
          sessionTimeoutMinutes,
          rememberMeDays,
          apiRateLimit,
          apiSecurityMode,
          corsEnabled,
          corsAllowedDomains,
          isActive
        ) VALUES (
          UUID(),
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          TRUE
        )
      `, [
        validatedData.passwordStrength,
        validatedData.passwordExpiryDays,
        validatedData.maxLoginAttempts,
        JSON.stringify(validatedData.twoFactorRequiredFor),
        validatedData.sessionTimeoutMinutes,
        validatedData.rememberMeDays,
        validatedData.apiRateLimit,
        validatedData.apiSecurityMode,
        validatedData.corsEnabled,
        JSON.stringify(validatedData.corsAllowedDomains)
      ]);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Security settings updated successfully',
      data: validatedData
    });
  } catch (error) {
    console.error("[Security API] Unexpected error:", error);
    return NextResponse.json(
      { error: 'Failed to update security settings', details: String(error) },
      { status: 500 }
    );
  }
}