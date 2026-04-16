import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export const dynamic = 'force-dynamic';

// Returns all active bills with customer/corporation name for POS bill selection
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.STAFF && session.user.role !== UserRole.VENDOR)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let hotelId: string | null = null;
    if (session.user.role === UserRole.STAFF) {
      const [staffRows] = await pool.query('SELECT hotelId FROM staff WHERE userId = ?', [session.user.id]);
      hotelId = (staffRows as any[])[0]?.hotelId;
    } else {
      // Vendor: use hotelId from query param
      hotelId = request.nextUrl.searchParams.get('hotelId');
    }

    if (!hotelId) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

    const [rows] = await pool.query(
      `SELECT
        cb.id,
        cb.billType,
        cb.totalAmount,
        cb.paidAmount,
        cb.customerId,
        cb.corporationId,
        TRIM(CONCAT(COALESCE(c.firstName,''), ' ', COALESCE(c.lastName,''))) as customerName,
        corp.name as corporationName
       FROM customer_bills cb
       LEFT JOIN customers c ON cb.customerId = c.id
       LEFT JOIN corporations corp ON cb.corporationId = corp.id
       WHERE cb.hotelId = ? AND cb.isActive = 1
       ORDER BY COALESCE(corp.name, c.firstName)`,
      [hotelId]
    );

    return NextResponse.json({
      bills: (rows as any[]).map(b => ({
        id: b.id,
        billType: b.billType,
        totalAmount: parseFloat(b.totalAmount) || 0,
        paidAmount: parseFloat(b.paidAmount) || 0,
        balance: Math.max(0, (parseFloat(b.totalAmount) || 0) - (parseFloat(b.paidAmount) || 0)),
        customerId: b.customerId,
        corporationId: b.corporationId,
        displayName: b.corporationName
          ? `🏢 ${b.corporationName}`
          : b.customerName?.trim() || 'Unknown',
      })),
    });
  } catch (err) {
    console.error('Error fetching active bills:', err);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}
