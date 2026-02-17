import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import pool from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET: Retrieve SMTP configuration
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get SMTP configuration
    const [smtpConfig] = await pool.query(`
      SELECT id, host, port, username, fromEmail, fromName, encryption, isDefault, isActive, createdAt, updatedAt
      FROM smtp_settings
      WHERE isDefault = TRUE
      LIMIT 1
    `);

    // If no config exists, return empty response
    if (!smtpConfig || (smtpConfig as any[]).length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    // Return SMTP config (we already excluded password in the query)
    return NextResponse.json((smtpConfig as any[])[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching SMTP config:', error);
    return NextResponse.json(
      { message: 'Failed to fetch SMTP configuration' },
      { status: 500 }
    );
  }
}

// PUT: Update SMTP configuration
export async function PUT(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { host, port, username, password, fromEmail, fromName, encryption } = body;

    // Validate required fields
    if (!host || !port || !username) {
      return NextResponse.json(
        { message: 'Host, port, and username are required' },
        { status: 400 }
      );
    }

    // Check if configuration already exists
    const [existingConfig] = await pool.query(`
      SELECT id, password FROM smtp_settings
      WHERE isDefault = TRUE
      LIMIT 1
    `);

    if (existingConfig && (existingConfig as any[]).length > 0) {
      // Update existing configuration
      const configId = (existingConfig as any[])[0].id;
      
      // Only update password if a new one is provided
      if (password) {
        await pool.query(`
          UPDATE smtp_settings
          SET host = ?, port = ?, username = ?, password = ?, fromEmail = ?, fromName = ?, 
              encryption = ?, updatedAt = NOW()
          WHERE id = ?
        `, [
          host,
          port,
          username,
          password,
          fromEmail || '',
          fromName || '',
          encryption || 'tls',
          configId
        ]);
      } else {
        await pool.query(`
          UPDATE smtp_settings
          SET host = ?, port = ?, username = ?, fromEmail = ?, fromName = ?, 
              encryption = ?, updatedAt = NOW()
          WHERE id = ?
        `, [
          host,
          port,
          username,
          fromEmail || '',
          fromName || '',
          encryption || 'tls',
          configId
        ]);
      }

      // Get updated config (excluding password)
      const [updatedConfig] = await pool.query(`
        SELECT id, host, port, username, fromEmail, fromName, encryption, isDefault, isActive, createdAt, updatedAt
        FROM smtp_settings
        WHERE id = ?
      `, [configId]);

      return NextResponse.json((updatedConfig as any[])[0], { status: 200 });
    } else {
      // Create new configuration - password is required
      if (!password) {
        return NextResponse.json(
          { message: 'Password is required for new SMTP configuration' },
          { status: 400 }
        );
      }

      // Create new configuration
      const [result] = await pool.query(`
        INSERT INTO smtp_settings (
          id, host, port, username, password, fromEmail, fromName, encryption, isDefault, isActive
        ) VALUES (
          UUID(), ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE
        )
      `, [
        host,
        port,
        username,
        password,
        fromEmail || '',
        fromName || '',
        encryption || 'tls'
      ]);

      const insertId = (result as any).insertId;
      
      // Get new config (excluding password)
      const [newConfig] = await pool.query(`
        SELECT id, host, port, username, fromEmail, fromName, encryption, isDefault, isActive, createdAt, updatedAt
        FROM smtp_settings
        WHERE id = ?
      `, [insertId]);

      return NextResponse.json((newConfig as any[])[0], { status: 201 });
    }
  } catch (error) {
    console.error('Error updating SMTP config:', error);
    return NextResponse.json(
      { message: 'Failed to update SMTP configuration' },
      { status: 500 }
    );
  }
}