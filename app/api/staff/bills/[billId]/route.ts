import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { billId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [staffRows] = await pool.query('SELECT hotelId FROM staff WHERE userId = ?', [session.user.id]);
    const staff = (staffRows as any[])[0];
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    const [billRows] = await pool.query(
      `SELECT cb.*,
        CONCAT(COALESCE(c.firstName,''), ' ', COALESCE(c.lastName,'')) as customerName,
        corp.name as corporationName
       FROM customer_bills cb
       LEFT JOIN customers c ON cb.customerId = c.id
       LEFT JOIN corporations corp ON cb.corporationId = corp.id
       WHERE cb.id = ? AND cb.hotelId = ?`,
      [params.billId, staff.hotelId]
    );

    const bill = (billRows as any[])[0];
    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

    // Get linked payments
    const [payments] = await pool.query(
      `SELECT bp.*, p.amount as paymentAmount, p.paymentMethod, p.status as paymentStatus,
        b.id as bookingRef, o.id as orderRef
       FROM bill_payments bp
       LEFT JOIN payments p ON bp.paymentId = p.id
       LEFT JOIN bookings b ON bp.bookingId = b.id
       LEFT JOIN orders o ON bp.orderId = o.id
       WHERE bp.billId = ?
       ORDER BY bp.createdAt DESC`,
      [params.billId]
    );

    return NextResponse.json({ bill: { ...bill, payments } });
  } catch (err) {
    console.error('Error fetching bill:', err);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { billId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [staffRows] = await pool.query('SELECT hotelId FROM staff WHERE userId = ?', [session.user.id]);
    const staff = (staffRows as any[])[0];
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    const body = await request.json();
    const { isActive, billType, notes } = body;

    await pool.query(
      `UPDATE customer_bills SET isActive=?, billType=?, notes=?, updatedAt=NOW() WHERE id=? AND hotelId=?`,
      [isActive ? 1 : 0, billType, notes || null, params.billId, staff.hotelId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating bill:', err);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}
