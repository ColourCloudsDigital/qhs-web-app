import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a super admin
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' }, 
        { status: 401 }
      );
    }
    
    // Get site settings from database
    const [settings] = await pool.query(`
      SELECT * FROM site_settings LIMIT 1
    `);
    
    // If no settings exist, create default settings
    if (!settings || (settings as any[]).length === 0) {
      const [result] = await pool.query(`
        INSERT INTO site_settings (
          id, siteName, siteDescription, defaultLanguage, timezone, defaultCurrency, maintenanceMode
        ) VALUES (
          UUID(), 'Qaras Hotels', 'Your ultimate hotel booking platform', 'en', 'UTC', 'NGN', FALSE
        )
      `);
      
      const [newSettings] = await pool.query(`
        SELECT * FROM site_settings LIMIT 1
      `);
      
      return NextResponse.json((newSettings as any[])[0]);
    }
    
    return NextResponse.json((settings as any[])[0]);
  } catch (error) {
    console.error('Error fetching general settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch general settings' }, 
      { status: 500 }
    );
  }
}

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
    
    // Get site settings
    const [settings] = await pool.query(`
      SELECT * FROM site_settings LIMIT 1
    `);
    
    // Update or create settings
    if (settings && (settings as any[]).length > 0) {
      const settingsId = (settings as any[])[0].id;
      
      await pool.query(`
        UPDATE site_settings SET
          siteName = ?,
          siteDescription = ?,
          defaultLanguage = ?,
          timezone = ?,
          defaultCurrency = ?,
          maintenanceMode = ?,
          maintenanceMsg = ?,
          updatedAt = NOW()
        WHERE id = ?
      `, [
        data.siteName,
        data.siteDescription,
        data.defaultLanguage,
        data.timezone,
        data.defaultCurrency,
        data.maintenanceMode ? 1 : 0,
        data.maintenanceMsg || null,
        settingsId
      ]);
      
      const [updatedSettings] = await pool.query(`
        SELECT * FROM site_settings WHERE id = ?
      `, [settingsId]);
      
      return NextResponse.json({
        message: 'General settings updated successfully',
        data: (updatedSettings as any[])[0]
      });
    } else {
      const [result] = await pool.query(`
        INSERT INTO site_settings (
          id, siteName, siteDescription, defaultLanguage, timezone, defaultCurrency, maintenanceMode, maintenanceMsg
        ) VALUES (
          UUID(), ?, ?, ?, ?, ?, ?, ?
        )
      `, [
        data.siteName,
        data.siteDescription || null,
        data.defaultLanguage,
        data.timezone,
        data.defaultCurrency,
        data.maintenanceMode ? 1 : 0,
        data.maintenanceMsg || null
      ]);
      
      const insertId = (result as any).insertId;
      
      const [newSettings] = await pool.query(`
        SELECT * FROM site_settings LIMIT 1
      `);
      
      return NextResponse.json({
        message: 'General settings created successfully',
        data: (newSettings as any[])[0]
      });
    }
  } catch (error) {
    console.error('Error updating general settings:', error);
    return NextResponse.json(
      { error: 'Failed to update general settings' }, 
      { status: 500 }
    );
  }
}