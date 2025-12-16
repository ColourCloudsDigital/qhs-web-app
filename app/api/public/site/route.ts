import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/public/site
 * Public route to fetch basic site information
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch site settings
    const [siteSettings] = await pool.query<RowDataPacket[]>(`
      SELECT 
        siteName, siteDescription, defaultLanguage, 
        timezone, defaultCurrency
      FROM site_settings 
      LIMIT 1
    `);
    
    // Return site settings or default values if not found
    if (siteSettings.length === 0) {
      return NextResponse.json({
        siteName: 'Qaras Hotels',
        siteDescription: 'Book your stay with Qaras Hotels',
        defaultLanguage: 'en',
        timezone: 'UTC',
        defaultCurrency: 'NGN'
      });
    }
    
    return NextResponse.json(siteSettings[0]);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    // Return default values in case of error
    return NextResponse.json({
      siteName: 'Qaras Hotels',
      siteDescription: 'Book your stay with Qaras Hotels',
      defaultLanguage: 'en',
      timezone: 'UTC',
      defaultCurrency: 'NGN'
    });
  }
} 