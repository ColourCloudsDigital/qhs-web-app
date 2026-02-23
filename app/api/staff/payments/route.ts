import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

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

    let whereClause = `(p.vendorId = ? OR b.hotelId = ?)`;
    let queryParams = [staff.hotelId, staff.hotelId];

    if (status && status !== 'all') {
      whereClause += ` AND p.status = ?`;
      queryParams.push(status);
    }

    const [paymentRows] = await pool.query(
      `SELECT p.*, 
              b.id as bookingReference,
              c1.firstName as customerFirstName, c1.lastName as customerLastName,
              c2.firstName as bookingCustomerFirstName, c2.lastName as bookingCustomerLastName
       FROM payments p 
       LEFT JOIN bookings b ON p.bookingId = b.id 
       LEFT JOIN customers c1 ON p.customer_id = c1.id
       LEFT JOIN customers c2 ON b.customerId = c2.id
       WHERE ${whereClause}
       ORDER BY p.createdAt DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const formattedPayments = (paymentRows as any[]).map((payment: any) => ({
      id: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      transactionReference: payment.transaction_reference,
      currency: payment.currency,
      description: payment.description,
      customerId: payment.customer_id,
      vendorId: payment.vendor_id,
      subscriptionPlanId: payment.subscription_plan_id,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      customerName: payment.customerFirstName && payment.customerLastName 
        ? `${payment.customerFirstName} ${payment.customerLastName}`
        : payment.bookingCustomerFirstName && payment.bookingCustomerLastName
        ? `${payment.bookingCustomerFirstName} ${payment.bookingCustomerLastName}`
        : null,
      bookingReference: payment.bookingReference
    }));

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM payments p 
       LEFT JOIN bookings b ON p.bookingId = b.id 
       WHERE ${whereClause}`,
      queryParams.slice(0, -2) // Remove limit and offset from count query
    );

    const total = (countRows as any[])[0].total;

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