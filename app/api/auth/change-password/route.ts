import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hash, compare } from 'bcrypt';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Find user
    const [rows] = await pool.query(
      'SELECT id, password FROM users WHERE id = ?',
      [session.user.id]
    );

    const user = (rows as any[])[0];

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update user with new password
    await pool.query(
      'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?',
      [hashedPassword, user.id]
    );

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { message: 'An error occurred while changing the password' },
      { status: 500 }
    );
  }
}