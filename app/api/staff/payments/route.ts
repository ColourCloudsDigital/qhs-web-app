import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const [staffRows] = await pool.query(
      `SELECT s.*, h.name as hotelName 
       FROM staff s 
       JOIN hotels h ON s.hotelId = h.id 
       WHERE s.userId = ?`,
      [session.user.id]
    );

    const staff = (staffRows as any[])[0];

    if (!staff) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause = `b.hotelId = ?`;
    let queryParams: any[] = [staff.hotelId];

    if (status && status !== 'all') {
      whereClause += ` AND p.status = ?`;
      queryParams.push(status);
    }

    const [paymentRows] = await pool.query(
      `SELECT p.*,
              b.id as bookingReference,
              c2.firstName as bookingCustomerFirstName, c2.lastName as bookingCustomerLastName
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       LEFT JOIN customers c2 ON b.customerId = c2.id
       WHERE ${whereClause}
       ORDER BY p.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const formattedPayments = (paymentRows as any[]).map((payment: any) => ({
      id: payment.id,
      bookingId: payment.bookingId,
      amount: parseFloat(payment.amount) || 0,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      customerName: payment.bookingCustomerFirstName && payment.bookingCustomerLastName
        ? `${payment.bookingCustomerFirstName} ${payment.bookingCustomerLastName}`
        : 'Guest',
      bookingReference: payment.bookingReference,
    }));

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       WHERE ${whereClause}`,
      queryParams
    );

    const total = (countRows as any[])[0]?.total || 0;

    return NextResponse.json({
      payments: formattedPayments,
      total,
      hasMore: offset + limit < total
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
