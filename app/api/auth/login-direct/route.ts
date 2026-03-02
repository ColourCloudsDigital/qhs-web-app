import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db.js';
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
    
    console.log('Attempting direct login with email:', email);
    
    // Test database connection first
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
        console.log('User not found for email:', email);
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
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
          return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Create a simple JWT token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.NEXTAUTH_SECRET || 'test-secret-do-not-use-in-production',
          { expiresIn: '1h' }
        );
        
        // Set the token in a cookie
        cookies().set({
          name: 'direct_auth_token',
          value: token,
          httpOnly: true,
          path: '/',
          maxAge: 60 * 60, // 1 hour
          sameSite: 'lax',
        });
        
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          message: 'Login successful! You can use this auth token for testing API calls.'
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
    } catch (error) {
      console.error('Error querying user:', error);
      return NextResponse.json({ error: 'Database error', details: String(error) }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Direct login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Login failed', details: errorMessage }, { status: 500 });
  }
} 
