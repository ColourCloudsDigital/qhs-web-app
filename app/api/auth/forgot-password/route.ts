import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';
import { brevoEmailService } from '@/lib/services/brevo-email.service';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const [rows] = await pool.query(
      'SELECT id, email, name FROM users WHERE email = ?',
      [email]
    );

    const user = (rows as any[])[0];

    // For security reasons, don't reveal if the email exists or not
    if (!user) {
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Save token to user
    await pool.query(
      'UPDATE users SET resetToken = ?, resetExpires = ?, updatedAt = NOW() WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    // Send reset email using Brevo
    await brevoEmailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: resetToken,
    });

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
