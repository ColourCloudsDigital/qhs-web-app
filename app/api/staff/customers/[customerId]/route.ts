import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get staff info to find their hotel
    const [staffResults] = await pool.execute(
      'SELECT hotelId FROM staff WHERE userId = ?',
      [session.user.id]
    );

    if (!Array.isArray(staffResults) || staffResults.length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const staff = staffResults[0] as any;
    const hotelId = staff.hotelId;
    const { customerId } = params;

    // Get customer details with booking statistics
    const [customerResults] = await pool.execute(`
      SELECT 
        c.id,
        c.firstName,
        c.lastName,
        c.phone,
        c.address,
        c.nationality,
        c.idType,
        c.idNumber,
        c.createdAt,
        u.email,
        u.isActive,
        u.lastLoginAt,
        COUNT(DISTINCT b.id) as totalBookings,
        COALESCE(SUM(CASE WHEN b.status NOT IN ('CANCELLED') THEN b.totalAmount ELSE 0 END), 0) as totalSpent,
        MAX(b.checkInDate) as lastBooking,
        MIN(b.checkInDate) as firstBooking,
        CASE 
          WHEN u.isActive = 1 AND COUNT(b.id) > 0 THEN 'active'
          WHEN u.isActive = 1 AND COUNT(b.id) = 0 THEN 'inactive'
          ELSE 'blocked'
        END as status
      FROM customers c
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN bookings b ON c.id = b.customerId AND b.hotelId = ?
      WHERE c.id = ?
      GROUP BY c.id, c.firstName, c.lastName, c.phone, c.address, c.nationality, c.idType, c.idNumber, c.createdAt, u.email, u.isActive, u.lastLoginAt
    `, [hotelId, customerId]);

    if (!Array.isArray(customerResults) || customerResults.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customerResults[0] as any;

    // Get customer's booking history
    const [bookingsResults] = await pool.execute(`
      SELECT 
        b.id,
        b.id as bookingReference,
        b.checkInDate,
        b.checkOutDate,
        b.totalAmount,
        b.status,
        b.createdAt,
        r.name as roomName,
        r.type as roomType,
        ru.roomNumber,
        h.name as hotelName
      FROM bookings b
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      JOIN hotels h ON b.hotelId = h.id
      WHERE b.customerId = ? AND b.hotelId = ?
      ORDER BY b.createdAt DESC
      LIMIT 10
    `, [customerId, hotelId]);

    // Get payment history
    const [paymentsResults] = await pool.execute(`
      SELECT 
        p.id,
        p.amount,
        p.paymentMethod,
        p.status,
        p.transactionId,
        p.createdAt,
        b.id as bookingReference
      FROM payments p
      JOIN bookings b ON p.bookingId = b.id
      WHERE b.customerId = ? AND b.hotelId = ?
      ORDER BY p.createdAt DESC
      LIMIT 10
    `, [customerId, hotelId]);

    const customerData = {
      id: customer.id,
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      nationality: customer.nationality || '',
      idType: customer.idType || '',
      idNumber: customer.idNumber || '',
      totalBookings: parseInt(customer.totalBookings) || 0,
      totalSpent: parseFloat(customer.totalSpent) || 0,
      lastBooking: customer.lastBooking,
      firstBooking: customer.firstBooking,
      status: customer.status,
      createdAt: customer.createdAt,
      lastLoginAt: customer.lastLoginAt,
      bookings: (bookingsResults as any[]).map((booking: any) => ({
        id: booking.id,
        bookingReference: booking.bookingReference,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalAmount: parseFloat(booking.totalAmount),
        status: booking.status,
        createdAt: booking.createdAt,
        roomName: booking.roomName,
        roomType: booking.roomType,
        roomNumber: booking.roomNumber,
        hotelName: booking.hotelName
      })),
      payments: (paymentsResults as any[]).map((payment: any) => ({
        id: payment.id,
        amount: parseFloat(payment.amount),
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        bookingReference: payment.bookingReference
      }))
    };

    return NextResponse.json({ customer: customerData });

  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get staff info to find their hotel
    const [staffResults] = await pool.execute(
      'SELECT hotelId FROM staff WHERE userId = ?',
      [session.user.id]
    );

    if (!Array.isArray(staffResults) || staffResults.length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const staff = staffResults[0] as any;
    const hotelId = staff.hotelId;
    const { customerId } = params;
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      nationality,
      idType,
      idNumber,
      status
    } = body;

    // Verify customer exists and belongs to this hotel
    const [customerCheck] = await pool.execute(`
      SELECT c.id, c.userId FROM customers c
      LEFT JOIN bookings b ON c.id = b.customerId
      WHERE c.id = ? AND (c.hotelId = ? OR b.hotelId = ?)
      LIMIT 1
    `, [customerId, hotelId, hotelId]);

    if (!Array.isArray(customerCheck) || customerCheck.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customerCheck[0] as any;

    // Update customer record
    await pool.execute(`
      UPDATE customers 
      SET firstName = ?, lastName = ?, phone = ?, address = ?, nationality = ?, idType = ?, idNumber = ?, updatedAt = NOW()
      WHERE id = ?
    `, [firstName, lastName || null, phone, address || null, nationality || null, idType || null, idNumber || null, customerId]);

    // Update user record if exists and email is provided
    if (customer.userId && email) {
      await pool.execute(`
        UPDATE users 
        SET name = ?, firstName = ?, lastName = ?, email = ?, isActive = ?, updatedAt = NOW()
        WHERE id = ?
      `, [
        `${firstName} ${lastName || ''}`.trim(),
        firstName,
        lastName || null,
        email,
        status === 'blocked' ? 0 : 1,
        customer.userId
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully'
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}