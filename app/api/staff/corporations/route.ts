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

    const [staffRows] = await pool.query('SELECT hotelId, vendorId FROM staff WHERE userId = ?', [session.user.id]);
    const staff = (staffRows as any[])[0];
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    const search = request.nextUrl.searchParams.get('search') || '';
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(request.nextUrl.searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
        COUNT(DISTINCT cu.id) as memberCount,
        COUNT(DISTINCT cb.id) as billCount
      FROM corporations c
      LEFT JOIN customers cu ON cu.corporationId = c.id
      LEFT JOIN customer_bills cb ON cb.corporationId = c.id
      WHERE c.hotelId = ?
    `;
    const params: any[] = [staff.hotelId];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.contactPerson LIKE ? OR c.phone LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` GROUP BY c.id ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM corporations WHERE hotelId = ?${search ? ' AND (name LIKE ? OR contactPerson LIKE ?)' : ''}`,
      search ? [staff.hotelId, `%${search}%`, `%${search}%`] : [staff.hotelId]
    );

    return NextResponse.json({
      corporations: rows,
      pagination: {
        total: (countRows as any[])[0]?.total || 0,
        page, limit,
        totalPages: Math.ceil(((countRows as any[])[0]?.total || 0) / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching corporations:', err);
    return NextResponse.json({ error: 'Failed to fetch corporations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [staffRows] = await pool.query('SELECT hotelId, vendorId FROM staff WHERE userId = ?', [session.user.id]);
    const staff = (staffRows as any[])[0];
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    const body = await request.json();
    const { name, contactPerson, email, phone, address, taxId, billType } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Corporation name is required' }, { status: 400 });

    const id = randomUUID();
    await pool.query(
      `INSERT INTO corporations (id, hotelId, vendorId, name, contactPerson, email, phone, address, taxId, billType, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [id, staff.hotelId, staff.vendorId, name, contactPerson || null, email || null, phone || null, address || null, taxId || null, billType || null]
    );

    // Auto-create bill if billType is set
    if (billType && billType !== 'none') {
      const billId = randomUUID();
      await pool.query(
        `INSERT INTO customer_bills (id, corporationId, hotelId, billType, isActive, createdAt)
         VALUES (?, ?, ?, ?, 1, NOW())`,
        [billId, id, staff.hotelId, billType]
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Error creating corporation:', err);
    return NextResponse.json({ error: 'Failed to create corporation' }, { status: 500 });
  }
}
