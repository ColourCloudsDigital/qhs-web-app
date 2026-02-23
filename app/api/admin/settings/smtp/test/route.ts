import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { emailService } from '@/lib/services/email.service';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
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
    const { host, port, username, password, fromEmail, fromName, testEmail } = body;

    // Validate test email
    if (!testEmail) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Test email address is required' 
        },
        { status: 400 }
      );
    }
    
    // Check if we need to get the password from the database
    let actualPassword = password;
    
    // If no password provided, try to fetch existing password from DB
    if (!actualPassword) {
      const [rows] = await pool.query(
        'SELECT password FROM smtp_configurations WHERE isDefault = true LIMIT 1'
      );
      
      const existingConfig = (rows as any[])[0];
      
      if (existingConfig) {
        actualPassword = existingConfig.password;
      } else {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Password is required for testing SMTP configuration' 
          },
          { status: 400 }
        );
      }
    }

    // Validate other required fields
    if (!host || !port || !username || !actualPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Host, port, username, and password are required' 
        },
        { status: 400 }
      );
    }

    // Send test email using the provided configuration
    await emailService.sendTestEmail({
      to: testEmail,
      smtpConfig: {
        host,
        port,
        username,
        password: actualPassword,
        fromEmail,
        fromName,
      },
    });

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Test email sent successfully. Please check your inbox.' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error 
          ? `Failed to send test email: ${error.message}`
          : 'An unknown error occurred while sending the test email'
      },
      { status: 500 }
    );
  }
}