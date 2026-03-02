import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get unread notification count for the current user
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE userId = ? AND status = 'UNREAD'`,
      [session.user.id]
    );
    
    const count = (countRows as any[])[0]?.count || 0;
    
    return NextResponse.json({
      count: parseInt(count)
    });
    
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification count' },
      { status: 500 }
    );
  }
}
