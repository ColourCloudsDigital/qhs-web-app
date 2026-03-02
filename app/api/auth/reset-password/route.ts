import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hash } from 'bcrypt';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Find user with the token
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE resetToken = ? AND resetExpires > NOW()',
      [token]
    );

    const user = (rows as any[])[0];

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(password, 10);

    // Update user with new password
    await pool.query(
      'UPDATE users SET password = ?, resetToken = NULL, resetExpires = NULL, updatedAt = NOW() WHERE id = ?',
      [hashedPassword, user.id]
    );

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'An error occurred during password reset' },
      { status: 500 }
    );
  }
}
