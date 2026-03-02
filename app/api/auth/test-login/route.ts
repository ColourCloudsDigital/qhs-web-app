import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db.js';
import bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    // Get credentials from request body
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    console.log('Attempting test login with email:', email);
    
    // Query the database directly
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = rows[0];
    
    // Log full user object (without password) for debugging
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    console.log('Found user:', userWithoutPassword);
    
    // Try password comparison 
    try {
      console.log('Stored password hash length:', user.password?.length || 0);
      console.log('Comparing passwords...');
      
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password comparison result:', isMatch);
      
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      
      // Test hash a sample password to check bcrypt behavior
      const testHash = await bcrypt.hash('password', 10);
      
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        debug: {
          passwordLength: user.password?.length || 0,
          testHashLength: testHash.length,
          testCompare: await bcrypt.compare('password', testHash)
        }
      });
    } catch (error) {
      console.error('Error during password verification:', error);
      return NextResponse.json({ 
        error: 'Password verification error', 
        details: String(error),
        passwordInfo: {
          length: user.password?.length || 0,
          type: typeof user.password,
          firstChars: user.password?.substring(0, 5) + '...'
        }
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Test login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Test login failed', details: errorMessage }, { status: 500 });
  }
} 
