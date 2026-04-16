import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [staffRows] = await pool.query('SELECT hotelId FROM staff WHERE userId = ?', [session.user.id]);
    const staff = (staffRows as any[])[0];
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    const customerId = request.nextUrl.searchParams.get('customerId');
    const corporationId = request.nextUrl.searchParams.get('corporationId');

    let query = `
      SELECT cb.*,
        CONCAT(COALESCE(c.firstName,''), ' ', COALESCE(c.lastName,'')) as customerName,
        corp.name as corporationName,
        COUNT(bp.id) as paymentCount
      FROM customer_bills cb
      LEFT JOIN customers c ON cb.customerId = c.id
      LEFT JOIN corporations corp ON cb.corporationId = corp.id
      LEFT JOIN bill_payments bp ON bp.billId = cb.id
      WHERE cb.hotelId = ?
    `;
    const params: any[] = [staff.hotelId];

    if (customerId) { query += ` AND cb.customerId = ?`; params.push(customerId); }
    if (corporationId) { query += ` AND cb.corporationId = ?`; params.push(corporationId); }

    query += ` GROUP BY cb.id ORDER BY cb.createdAt DESC`;

    const [rows] = await pool.query(query, params);
    return NextResponse.json({ bills: rows });
  } catch (err) {
    console.error('Error fetching bills:', err);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [staffRows] = await pool.query('SELECT hotelId FROM staff WHERE userId = ?', [session.user.id]);
    const staff = (staffRows as any[])[0];
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    const body = await request.json();
    const { customerId, corporationId, billType, isActive, notes } = body;

    if (!customerId && !corporationId) {
      return NextResponse.json({ error: 'customerId or corporationId is required' }, { status: 400 });
    }

    const id = randomUUID();
    await pool.query(
      `INSERT INTO customer_bills (id, customerId, corporationId, hotelId, billType, isActive, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, customerId || null, corporationId || null, staff.hotelId, billType || 'hotel_only', isActive !== false ? 1 : 0, notes || null]
    );

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Error creating bill:', err);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
