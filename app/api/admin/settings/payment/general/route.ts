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
    
    // Get payment settings from database
    const [settings] = await pool.query(`
      SELECT * FROM payment_settings LIMIT 1
    `);
    
    // If no settings exist, create default settings
    if (!settings || (settings as any[]).length === 0) {
      const [result] = await pool.query(`
        INSERT INTO payment_settings (
          id, defaultTaxRate, defaultCommissionRate
        ) VALUES (
          UUID(), 5.0, 10.0
        )
      `);
      
      const [newSettings] = await pool.query(`
        SELECT * FROM payment_settings LIMIT 1
      `);
      
      return NextResponse.json({
        defaultTaxRate: (newSettings as any[])[0].defaultTaxRate,
        defaultCommissionRate: (newSettings as any[])[0].defaultCommissionRate,
      });
    }
    
    return NextResponse.json({
      defaultTaxRate: (settings as any[])[0].defaultTaxRate,
      defaultCommissionRate: (settings as any[])[0].defaultCommissionRate,
    });
  } catch (error) {
    console.error('Error fetching payment general settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment general settings' }, 
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
    
    // Validate data
    if (
      (data.defaultTaxRate !== undefined && (isNaN(data.defaultTaxRate) || data.defaultTaxRate < 0 || data.defaultTaxRate > 100)) ||
      (data.defaultCommissionRate !== undefined && (isNaN(data.defaultCommissionRate) || data.defaultCommissionRate < 0 || data.defaultCommissionRate > 100))
    ) {
      return NextResponse.json(
        { error: 'Invalid tax or commission rate. Must be between 0 and 100.' }, 
        { status: 400 }
      );
    }
    
    // Get payment settings
    const [settings] = await pool.query(`
      SELECT * FROM payment_settings LIMIT 1
    `);
    
    // Update or create settings
    if (settings && (settings as any[]).length > 0) {
      const settingsId = (settings as any[])[0].id;
      const currentSettings = (settings as any[])[0];
      
      await pool.query(`
        UPDATE payment_settings SET
          defaultTaxRate = ?,
          defaultCommissionRate = ?,
          updatedAt = NOW()
        WHERE id = ?
      `, [
        data.defaultTaxRate !== undefined ? data.defaultTaxRate : currentSettings.defaultTaxRate,
        data.defaultCommissionRate !== undefined ? data.defaultCommissionRate : currentSettings.defaultCommissionRate,
        settingsId
      ]);
      
      const [updatedSettings] = await pool.query(`
        SELECT * FROM payment_settings WHERE id = ?
      `, [settingsId]);
      
      return NextResponse.json({
        message: 'Payment general settings updated successfully',
        data: {
          defaultTaxRate: (updatedSettings as any[])[0].defaultTaxRate,
          defaultCommissionRate: (updatedSettings as any[])[0].defaultCommissionRate,
        }
      });
    } else {
      const [result] = await pool.query(`
        INSERT INTO payment_settings (
          id, defaultTaxRate, defaultCommissionRate
        ) VALUES (
          UUID(), ?, ?
        )
      `, [
        data.defaultTaxRate !== undefined ? data.defaultTaxRate : 5.0,
        data.defaultCommissionRate !== undefined ? data.defaultCommissionRate : 10.0
      ]);
      
      const [newSettings] = await pool.query(`
        SELECT * FROM payment_settings LIMIT 1
      `);
      
      return NextResponse.json({
        message: 'Payment general settings created successfully',
        data: {
          defaultTaxRate: (newSettings as any[])[0].defaultTaxRate,
          defaultCommissionRate: (newSettings as any[])[0].defaultCommissionRate,
        }
      });
    }
  } catch (error) {
    console.error('Error updating payment general settings:', error);
    return NextResponse.json(
      { error: 'Failed to update payment general settings' }, 
      { status: 500 }
    );
  }
}