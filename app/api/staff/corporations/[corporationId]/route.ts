import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { corporationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [staffRows] = await pool.query('SELECT hotelId FROM staff WHERE userId = ?', [session.user.id]);
    const staff = (staffRows as any[])[0];
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    const [rows] = await pool.query(
      `SELECT c.*, COUNT(DISTINCT cu.id) as memberCount
       FROM corporations c
       LEFT JOIN customers cu ON cu.corporationId = c.id
       WHERE c.id = ? AND c.hotelId = ?
       GROUP BY c.id`,
      [params.corporationId, staff.hotelId]
    );

    const corp = (rows as any[])[0];
    if (!corp) return NextResponse.json({ error: 'Corporation not found' }, { status: 404 });

    // Get members
    const [members] = await pool.query(
      `SELECT c.id, c.firstName, c.lastName, c.phone, u.email
       FROM customers c LEFT JOIN users u ON c.userId = u.id
       WHERE c.corporationId = ?`,
      [params.corporationId]
    );

    // Get bills
    const [bills] = await pool.query(
      `SELECT cb.*, COUNT(bp.id) as paymentCount
       FROM customer_bills cb
       LEFT JOIN bill_payments bp ON bp.billId = cb.id
       WHERE cb.corporationId = ?
       GROUP BY cb.id
       ORDER BY cb.createdAt DESC`,
      [params.corporationId]
    );

    return NextResponse.json({ corporation: { ...corp, members, bills } });
  } catch (err) {
    console.error('Error fetching corporation:', err);
    return NextResponse.json({ error: 'Failed to fetch corporation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { corporationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [staffRows] = await pool.query('SELECT hotelId FROM staff WHERE userId = ?', [session.user.id]);
    const staff = (staffRows as any[])[0];
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    const body = await request.json();
    const { name, contactPerson, email, phone, address, taxId, billType, status } = body;

    await pool.query(
      `UPDATE corporations SET name=?, contactPerson=?, email=?, phone=?, address=?, taxId=?, billType=?, status=?, updatedAt=NOW()
       WHERE id=? AND hotelId=?`,
      [name, contactPerson || null, email || null, phone || null, address || null, taxId || null, billType || null, status || 'active', params.corporationId, staff.hotelId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating corporation:', err);
    return NextResponse.json({ error: 'Failed to update corporation' }, { status: 500 });
  }
}
