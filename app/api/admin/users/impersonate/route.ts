import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    // Verify the requester is a super admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID to impersonate from the request body
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the user to impersonate
    const [userRows] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    ) as [RowDataPacket[], any];

    if (!userRows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userToImpersonate = userRows[0];

    // Create a token that indicates this is an impersonation session
    const impersonationToken = await new SignJWT({
      adminId: session.user.id,
      adminName: session.user.name,
      userId: userToImpersonate.id,
      userName: userToImpersonate.name,
      userEmail: userToImpersonate.email,
      userRole: userToImpersonate.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h') // Token expires in 1 hour
      .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'impersonate-secret-key'));

    // Set a cookie with the impersonation token
    cookies().set('impersonation_token', impersonationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    // Determine dashboard path based on user role
    let redirectPath = '/';
    switch (userToImpersonate.role) {
      case UserRole.VENDOR:
        redirectPath = '/vendor/dashboard';
        break;
      case UserRole.CUSTOMER:
        redirectPath = '/customer/dashboard';
        break;
      case UserRole.STAFF:
        redirectPath = '/staff/dashboard';
        break;
      case UserRole.SUPER_ADMIN:
        redirectPath = '/admin/dashboard';
        break;
    }

    // Return success with redirect path
    return NextResponse.json({
      success: true,
      message: `Now impersonating ${userToImpersonate.name}`,
      redirectPath,
    });
  } catch (error) {
    console.error('Error during impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to impersonate user' },
      { status: 500 }
    );
  }
} 
