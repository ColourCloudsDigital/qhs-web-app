import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

// GET handler to retrieve site settings
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const [settings] = await pool.query('SELECT * FROM site_settings LIMIT 1') as [any[], any];
    
    return NextResponse.json({ settings: settings[0] || {} });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

// POST handler to update site settings
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.siteName) {
      return NextResponse.json(
        { error: 'Site name is required' },
        { status: 400 }
      );
    }
    
    // Check if settings exist
    const [existingSettings] = await pool.query('SELECT * FROM site_settings LIMIT 1') as [any[], any];
    
    if (existingSettings.length > 0) {
      // Update existing settings
      await pool.query(
        'UPDATE site_settings SET siteName = ?, siteDescription = ?, contactEmail = ?, contactPhone = ?, address = ?, logoUrl = ?, faviconUrl = ?, primaryColor = ?, secondaryColor = ?, googleAnalyticsId = ?, metaKeywords = ?, updated_at = NOW() WHERE id = ?',
        [
          data.siteName,
          data.siteDescription,
          data.contactEmail,
          data.contactPhone,
          data.address,
          data.logoUrl,
          data.faviconUrl,
          data.primaryColor,
          data.secondaryColor,
          data.googleAnalyticsId,
          data.metaKeywords,
          existingSettings[0].id
        ]
      );
    } else {
      // Create new settings
      await pool.query(
        'INSERT INTO site_settings (siteName, siteDescription, contactEmail, contactPhone, address, logoUrl, faviconUrl, primaryColor, secondaryColor, googleAnalyticsId, metaKeywords, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [
          data.siteName,
          data.siteDescription,
          data.contactEmail,
          data.contactPhone,
          data.address,
          data.logoUrl,
          data.faviconUrl,
          data.primaryColor,
          data.secondaryColor,
          data.googleAnalyticsId,
          data.metaKeywords
        ]
      );
    }
    
    return NextResponse.json({ success: true, message: 'Site settings updated successfully' });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: 'Failed to update site settings' },
      { status: 500 }
    );
  }
} 