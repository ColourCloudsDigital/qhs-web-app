import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/public/settings
 * Public route to fetch site settings
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch public site settings
    const [settings] = await pool.query<RowDataPacket[]>('SELECT siteName, siteDescription, logoUrl, faviconUrl, primaryColor, secondaryColor FROM site_settings LIMIT 1');
    
    return NextResponse.json({ settings: settings.length > 0 ? settings[0] : {} });
  } catch (error) {
    console.error('Error fetching public site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
} 