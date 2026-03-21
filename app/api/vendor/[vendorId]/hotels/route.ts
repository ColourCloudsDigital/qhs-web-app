import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vendorId } = params;

    // Vendors can only fetch their own hotels; admins can fetch any
    if (
      session.user.role === UserRole.VENDOR &&
      session.user.vendorId !== vendorId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (
      session.user.role !== UserRole.VENDOR &&
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.STAFF
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [rows] = await pool.query(
      'SELECT id, name FROM hotels WHERE vendorId = ? ORDER BY name ASC',
      [vendorId]
    );

    return NextResponse.json({ hotels: rows });
  } catch (error) {
    console.error('Error fetching vendor hotels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotels' },
      { status: 500 }
    );
  }
}
