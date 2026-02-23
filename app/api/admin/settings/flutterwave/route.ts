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
    
    // Get flutterwave configuration from database
    const [rows] = await pool.query(
      'SELECT * FROM flutterwave_configurations WHERE isDefault = true LIMIT 1'
    );
    
    const flutterwaveConfig = (rows as any[])[0];
    
    // For security, don't return the secretKey and encryptionKey in the response
    if (flutterwaveConfig) {
      const { secretKey, encryptionKey, ...safeConfig } = flutterwaveConfig;
      return NextResponse.json(safeConfig);
    }
    
    return NextResponse.json(null);
  } catch (error) {
    console.error('Error fetching Flutterwave settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Flutterwave settings' }, 
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
    
    // Check if we're setting this config as default
    if (data.isDefault) {
      // Reset isDefault on all other configs
      await pool.query(
        'UPDATE flutterwave_configurations SET isDefault = false WHERE isDefault = true'
      );
      
      // If Flutterwave is default, Paystack shouldn't be
      await pool.query(
        'UPDATE paystack_configurations SET isDefault = false WHERE isDefault = true'
      );
    }
    
    // Get existing flutterwave configuration
    const [existingRows] = await pool.query(
      'SELECT * FROM flutterwave_configurations LIMIT 1'
    );
    const existingConfig = (existingRows as any[])[0];
    
    // Update or create configuration
    let updatedConfig;
    if (existingConfig) {
      const updateFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(data);
      
      await pool.query(
        `UPDATE flutterwave_configurations SET ${updateFields}, updatedAt = NOW() WHERE id = ?`,
        [...updateValues, existingConfig.id]
      );
      
      // Get updated config
      const [updatedRows] = await pool.query(
        'SELECT * FROM flutterwave_configurations WHERE id = ?',
        [existingConfig.id]
      );
      updatedConfig = (updatedRows as any[])[0];
    } else {
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const [result] = await pool.query(
        `INSERT INTO flutterwave_configurations (${fields}, createdAt, updatedAt) VALUES (${placeholders}, NOW(), NOW())`,
        values
      );
      
      // Get created config
      const [createdRows] = await pool.query(
        'SELECT * FROM flutterwave_configurations WHERE id = ?',
        [(result as any).insertId]
      );
      updatedConfig = (createdRows as any[])[0];
    }
    
    // For security, don't return the secretKey and encryptionKey in the response
    const { secretKey, encryptionKey, ...safeConfig } = updatedConfig;
    
    return NextResponse.json({
      message: 'Flutterwave settings updated successfully',
      data: safeConfig
    });
  } catch (error) {
    console.error('Error updating Flutterwave settings:', error);
    return NextResponse.json(
      { error: 'Failed to update Flutterwave settings' }, 
      { status: 500 }
    );
  }
}