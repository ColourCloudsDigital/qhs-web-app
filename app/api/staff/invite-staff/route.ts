import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';


// DEPRECATED: Use POST /api/staff with action: 'create' instead
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'This endpoint is deprecated. Use POST /api/staff with action: "create" instead.' 
    }, { status: 410 });
  } catch (error) {
    console.error('Error in deprecated invite-staff endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
