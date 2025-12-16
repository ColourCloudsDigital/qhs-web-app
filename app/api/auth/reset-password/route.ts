import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hash } from 'bcrypt';

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
    const user = await prisma.user.findFirst({
      where: {
        // Use type assertion for new fields
        resetToken: token,
        resetExpires: {
          gt: new Date(),
        },
      } as any,
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(password, 10);

    // Update user with new password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
      } as any, // Type assertion
    });

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