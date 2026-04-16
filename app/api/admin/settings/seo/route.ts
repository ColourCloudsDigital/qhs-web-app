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
    
    // Get SEO settings from database
    const [settings] = await pool.query(`
      SELECT * FROM seo_settings LIMIT 1
    `);
    
    // If no settings exist, create default settings
    if (!settings || (settings as any[]).length === 0) {
      const [result] = await pool.query(`
        INSERT INTO seo_settings (
          id, metaTitle, metaDescription, ogTitle, ogDescription
        ) VALUES (
          UUID(), 
          'Qaras Hospitality Solutions - Hotel Booking Platform',
          'Find and book hotels across Nigeria with Qaras Hospitality Solutions, the leading hotel booking platform.',
          'Qaras Hospitality Solutions',
          'Find and book hotels across Nigeria with Qaras Hospitality Solutions, the leading hotel booking platform.'
        )
      `);
      
      const [newSettings] = await pool.query(`
        SELECT * FROM seo_settings LIMIT 1
      `);
      
      return NextResponse.json((newSettings as any[])[0]);
    }
    
    return NextResponse.json((settings as any[])[0]);
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEO settings' }, 
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
    
    // Get SEO settings
    const [settings] = await pool.query(`
      SELECT * FROM seo_settings LIMIT 1
    `);
    
    // Update or create settings
    if (settings && (settings as any[]).length > 0) {
      const settingsId = (settings as any[])[0].id;
      
      // Build UPDATE query dynamically
      let updateQuery = `UPDATE seo_settings SET `;
      const updateValues = [];
      const fieldsToUpdate = [
        'metaTitle', 'metaDescription', 'metaKeywords', 'ogTitle', 
        'ogDescription', 'ogImage', 'twitterHandle', 'canonicalUrl',
        'robotsTxt', 'structuredData', 'googleAnalyticsId', 'googleTagManagerId'
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
        SELECT * FROM seo_settings WHERE id = ?
      `, [settingsId]);
      
      return NextResponse.json({
        message: 'SEO settings updated successfully',
        data: (updatedSettings as any[])[0]
      });
    } else {
      // Create new settings
      const fields = [];
      const placeholders = [];
      const values = [];
      
      // Always include id
      fields.push('id');
      placeholders.push('UUID()');
      
      // Add all other fields dynamically
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          fields.push(key);
          placeholders.push('?');
          values.push(value);
        }
      }
      
      const query = `
        INSERT INTO seo_settings (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;
      
      const [result] = await pool.query(query, values);
      
      const [newSettings] = await pool.query(`
        SELECT * FROM seo_settings LIMIT 1
      `);
      
      return NextResponse.json({
        message: 'SEO settings created successfully',
        data: (newSettings as any[])[0]
      });
    }
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    return NextResponse.json(
      { error: 'Failed to update SEO settings' }, 
      { status: 500 }
    );
  }
}
