import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    // Get email from query params
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    // Query the database directly
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = rows[0];
    
    // Hash a test password for comparison
    const testPassword = 'password';
    const testHash = await bcrypt.hash(testPassword, 10);
    
    // For security, don't return the actual password hash
    const sanitizedUser = { ...user };
    
    // But do include useful debugging info
    sanitizedUser.passwordLength = user.password?.length || 0;
    sanitizedUser.passwordPrefix = user.password?.substring(0, 10) + '...';
    sanitizedUser.testHash = testHash;
    sanitizedUser.testHashLength = testHash.length;
    delete sanitizedUser.password;
    
    // Check if table and column names match expectations
    const columnInfo = {
      tableFound: true,
      expectedColumns: ['id', 'email', 'name', 'password', 'role', 'isActive'],
      foundColumns: Object.keys(user),
      missingColumns: [] as string[]
    };
    
    columnInfo.expectedColumns.forEach(col => {
      if (!Object.prototype.hasOwnProperty.call(user, col)) {
        columnInfo.missingColumns.push(col);
      }
    });
    
    return NextResponse.json({
      user: sanitizedUser,
      columnInfo,
      message: 'Debug info for user. Use this to check data structure.'
    });
  } catch (error: unknown) {
    console.error('Debug user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Error querying user', details: errorMessage }, { status: 500 });
  }
} 