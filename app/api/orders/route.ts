import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/** Resolve vendorId for both VENDOR and STAFF roles */
async function resolveVendorId(user: any): Promise<string | null> {
  if (user.vendorId) return user.vendorId;

  if (user.role === 'STAFF' && user.staffId) {
    const [rows] = await pool.query(
      'SELECT vendorId FROM staff WHERE id = ?',
      [user.staffId]
    );
    return (rows as any[])[0]?.vendorId || null;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || (user.role !== 'VENDOR' && user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const vendorId = await resolveVendorId(user);
  if (!vendorId) {
    return NextResponse.json({ error: 'Vendor ID could not be resolved' }, { status: 403 });
  }

  const data = await req.json();
  const { paymentStatus, paymentMethod, vat, totalAmount, items, hotelId } = data;

  let taxValue: any = null;
  if (Array.isArray(vat)) {
    taxValue = JSON.stringify(vat);
  } else if (typeof vat === 'object' && vat !== null) {
    taxValue = JSON.stringify([vat]);
  } else {
    taxValue = vat ?? null;
  }

  const client = await pool.getConnection();
  try {
    await client.beginTransaction();

    const orderId = uuidv4();

    await client.query(
      `INSERT INTO orders (id, vendorId, hotelId, totalAmount, tax, paymentStatus, paymentMethod, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [orderId, vendorId, hotelId || null, totalAmount, taxValue, paymentStatus || 'Not Paid', paymentMethod || 'Cash']
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (id, orderId, menuItemId, quantity, price, createdAt)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), orderId, item.id, item.quantity, item.price]
      );
    }

    await client.commit();
    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    await client.rollback();
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || !user.role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '15', 10), 100);
  const offset = (page - 1) * limit;
  const paymentMethod = url.searchParams.get('paymentMethod');
  const paymentStatus = url.searchParams.get('paymentStatus');
  const hotelId = url.searchParams.get('hotelId');

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (startDate) { whereClause += ' AND o.createdAt >= ?'; params.push(startDate); }
  if (endDate)   { whereClause += ' AND o.createdAt <= ?'; params.push(endDate); }

  if (user.role === 'VENDOR' || user.role === 'STAFF') {
    const vendorId = await resolveVendorId(user);
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID could not be resolved' }, { status: 403 });
    }

    if (!hotelId) {
      return NextResponse.json({ error: 'hotelId is required' }, { status: 400 });
    }

    // Verify the hotel belongs to this vendor
    const [hotelRows] = await pool.query(
      'SELECT id FROM hotels WHERE id = ? AND vendorId = ?',
      [hotelId, vendorId]
    );
    if ((hotelRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Hotel not found or access denied' }, { status: 403 });
    }

    whereClause += ' AND o.vendorId = ? AND o.hotelId = ?';
    params.push(vendorId, hotelId);
  } else if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } else if (hotelId) {
    whereClause += ' AND o.hotelId = ?';
    params.push(hotelId);
  }

  if (paymentMethod) { whereClause += ' AND o.paymentMethod = ?'; params.push(paymentMethod); }
  if (paymentStatus) { whereClause += ' AND o.paymentStatus = ?'; params.push(paymentStatus); }

  try {
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    const total = (countRows as any[])[0]?.total || 0;

    const [orders] = await pool.query(
      `SELECT o.* FROM orders o ${whereClause} ORDER BY o.createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const orderIds = (orders as any[]).map(o => o.id);
    let orderItems: any[] = [];

    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const [items] = await pool.query(
        `SELECT oi.*, mi.name as menuItemName
         FROM order_items oi
         LEFT JOIN menu_items mi ON oi.menuItemId = mi.id
         WHERE oi.orderId IN (${placeholders})`,
        orderIds
      );
      orderItems = items as any[];
    }

    const ordersWithItems = (orders as any[]).map(order => ({
      ...order,
      items: orderItems.filter(item => item.orderId === order.id),
    }));

    return NextResponse.json({ success: true, orders: ordersWithItems, total, page, limit });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
