import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';


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
    
    // Get cookie settings from database
    const [settings] = await pool.query(`
      SELECT * FROM cookie_settings LIMIT 1
    `);
    
    // If no settings exist, create default settings
    if (!settings || (settings as any[]).length === 0) {
      const defaultConsent = JSON.stringify({
        necessary: true,
        preferences: false,
        statistics: false,
        marketing: false
      });

      const [result] = await pool.query(`
        INSERT INTO cookie_settings (
          id, 
          cookieBannerEnabled,
          bannerTitle, 
          bannerDescription, 
          necessaryCookiesDesc, 
          preferenceCookiesDesc, 
          statisticsCookiesDesc,
          marketingCookiesDesc,
          acceptAllButtonText,
          rejectAllButtonText,
          savePreferencesButtonText,
          defaultConsent
        ) VALUES (
          UUID(), 
          TRUE,
          'We value your privacy', 
          'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.',
          'Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website.',
          'Preference cookies enable a website to remember information that changes the way the website behaves or looks.',
          'Statistic cookies help website owners to understand how visitors interact with websites by collecting and reporting information anonymously.',
          'Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging.',
          'Accept All',
          'Reject All',
          'Save Preferences',
          ?
        )
      `, [defaultConsent]);
      
      const [newSettings] = await pool.query(`
        SELECT * FROM cookie_settings LIMIT 1
      `);
      
      return NextResponse.json((newSettings as any[])[0]);
    }
    
    // Parse JSON fields
    const cookieSettings = (settings as any[])[0];
    if (cookieSettings.defaultConsent) {
      try {
        cookieSettings.defaultConsent = JSON.parse(cookieSettings.defaultConsent);
      } catch (e) {
        cookieSettings.defaultConsent = null;
      }
    }
    
    return NextResponse.json(cookieSettings);
  } catch (error) {
    console.error('Error fetching cookie settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cookie settings' }, 
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
    
    // Process any JSON fields
    if (data.defaultConsent && typeof data.defaultConsent === 'object') {
      data.defaultConsent = JSON.stringify(data.defaultConsent);
    }
    
    // Get cookie settings
    const [settings] = await pool.query(`
      SELECT * FROM cookie_settings LIMIT 1
    `);
    
    // Update or create settings
    if (settings && (settings as any[]).length > 0) {
      const settingsId = (settings as any[])[0].id;
      
      // Build UPDATE query dynamically
      let updateQuery = `UPDATE cookie_settings SET `;
      const updateValues = [];
      const fieldsToUpdate = [
        'cookieBannerEnabled', 'cookiePolicyUrl', 'bannerTitle', 'bannerDescription',
        'necessaryCookiesDesc', 'preferenceCookiesDesc', 'statisticsCookiesDesc', 'marketingCookiesDesc',
        'acceptAllButtonText', 'rejectAllButtonText', 'savePreferencesButtonText', 'defaultConsent'
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
        SELECT * FROM cookie_settings WHERE id = ?
      `, [settingsId]);
      
      // Parse JSON for response
      const cookieSettings = (updatedSettings as any[])[0];
      if (cookieSettings.defaultConsent) {
        try {
          cookieSettings.defaultConsent = JSON.parse(cookieSettings.defaultConsent);
        } catch (e) {
          cookieSettings.defaultConsent = null;
        }
      }
      
      return NextResponse.json({
        message: 'Cookie settings updated successfully',
        data: cookieSettings
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
        INSERT INTO cookie_settings (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;
      
      const [result] = await pool.query(query, values);
      
      const [newSettings] = await pool.query(`
        SELECT * FROM cookie_settings LIMIT 1
      `);
      
      // Parse JSON for response
      const cookieSettings = (newSettings as any[])[0];
      if (cookieSettings.defaultConsent) {
        try {
          cookieSettings.defaultConsent = JSON.parse(cookieSettings.defaultConsent);
        } catch (e) {
          cookieSettings.defaultConsent = null;
        }
      }
      
      return NextResponse.json({
        message: 'Cookie settings created successfully',
        data: cookieSettings
      });
    }
  } catch (error) {
    console.error('Error updating cookie settings:', error);
    return NextResponse.json(
      { error: 'Failed to update cookie settings' }, 
      { status: 500 }
    );
  }
}
