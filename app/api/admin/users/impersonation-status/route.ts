import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ isImpersonating: false });
    }

    // Check for impersonation cookies
    const cookieStore = cookies();
    const impersonationToken = cookieStore.get('impersonation_token')?.value;
    const isImpersonatingCookie = cookieStore.get('is_impersonating')?.value;
    
    // If no impersonation cookie, not impersonating
    if (!impersonationToken || !isImpersonatingCookie) {
      return NextResponse.json({ isImpersonating: false });
    }
    
    try {
      // Verify the impersonation token
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'impersonate-secret-key');
      const { payload } = await jwtVerify(impersonationToken, secret);
      
      // Return the impersonation state
      return NextResponse.json({
        isImpersonating: true,
        adminName: payload.adminName,
        adminId: payload.adminId,
        userName: payload.userName,
        userId: payload.userId,
        userRole: payload.userRole,
      });
    } catch (jwtError) {
      console.error('Invalid impersonation token:', jwtError);
      // Token invalid, not impersonating
      return NextResponse.json({ isImpersonating: false });
    }
  } catch (error) {
    console.error('Error checking impersonation status:', error);
    return NextResponse.json(
      { error: 'Failed to check impersonation status' },
      { status: 500 }
    );
  }
} 
