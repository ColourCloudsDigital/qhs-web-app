import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    // Get email from query params
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    // Test database connection
    try {
      await pool.query('SELECT 1');
      console.log('Database connection is working');
    } catch (err) {
      console.error('Database connection test failed:', err);
      return NextResponse.json({ error: 'Database connection failed', details: String(err) }, { status: 500 });
    }
    
    // Query the database directly
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]) as [RowDataPacket[], any];
      
      if (rows.length === 0) {
        // Try with LIKE to find similar emails
        const [similarRows] = await pool.query('SELECT email FROM users WHERE email LIKE ?', [`%${email}%`]) as [RowDataPacket[], any];
        
        return NextResponse.json({ 
          error: 'User not found', 
          similarEmails: similarRows.map((row: any) => row.email)
        }, { status: 404 });
      }
      
      const user = rows[0];
      
      // For security, don't return the actual password hash
      const sanitizedUser = { ...user };
      
      // But do include useful debugging info
      sanitizedUser.passwordLength = user.password?.length || 0;
      sanitizedUser.passwordPrefix = user.password?.substring(0, 10) + '...';
      delete sanitizedUser.password;
      
      // Get table structure
      const [tableInfo] = await pool.query(
        'DESCRIBE users'
      ) as [RowDataPacket[], any];
      
      // Get sample users (limited info)
      const [sampleUsers] = await pool.query(
        'SELECT id, email, role, isActive FROM users LIMIT 5'
      ) as [RowDataPacket[], any];
      
      return NextResponse.json({
        user: sanitizedUser,
        tableStructure: tableInfo,
        sampleUsers,
        message: 'Debug info for user and database structure.'
      });
    } catch (err) {
      console.error('Error querying user:', err);
      return NextResponse.json({ error: 'Error querying user', details: String(err) }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Debug user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Error in debug endpoint', details: errorMessage }, { status: 500 });
  }
} 