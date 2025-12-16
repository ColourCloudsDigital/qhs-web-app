import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { message: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this token
    const query = `
      SELECT id, email, verificationToken, verificationExpires
      FROM User 
      WHERE verificationToken = ?
      LIMIT 1
    `;
    
    const [rows]: [any[], any] = await pool.query(query, [token]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Invalid verification token' },
        { status: 400 }
      );
    }
    
    const user = rows[0];
    
    // Check if token is expired
    const now = new Date();
    const tokenExpiry = new Date(user.verificationExpires);
    
    if (now > tokenExpiry) {
      return NextResponse.json(
        { message: 'Verification token has expired' },
        { status: 400 }
      );
    }
    
    // Update user to verified status
    const updateQuery = `
      UPDATE User 
      SET emailVerified = ?, verificationToken = NULL, verificationExpires = NULL 
      WHERE id = ?
    `;
    
    await pool.query(updateQuery, [now, user.id]);
    
    return NextResponse.json(
      { message: 'Email successfully verified. You can now log in.' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}