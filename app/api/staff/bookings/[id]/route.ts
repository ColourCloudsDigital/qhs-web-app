import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookingId = params.id;

    // Get staff info to verify hotel access
    const [staffResults] = await pool.query(
      'SELECT hotelId FROM staff WHERE userId = ?',
      [session.user.id]
    );

    if ((staffResults as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const staff = (staffResults as any[])[0];
    const hotelId = staff.hotelId;

    // Get booking details
    const [bookingResults] = await pool.query(
      `SELECT 
        b.id,
        b.checkInDate,
        b.checkOutDate,
        b.numberOfGuests,
        b.totalAmount,
        b.status,
        b.paymentStatus,
        b.specialRequests,
        b.createdAt,
        b.updatedAt,
        h.id as hotelId,
        h.name as hotelName,
        ru.id as roomUnitId,
        ru.roomNumber,
        r.id as roomId,
        r.name as roomName,
        r.type as roomType,
        c.id as customerId,
        CONCAT(c.firstName, ' ', c.lastName) as customerName,
        c.phone as customerPhone
      FROM bookings b
      LEFT JOIN hotels h ON b.hotelId = h.id
      LEFT JOIN room_units ru ON b.roomUnitId = ru.id
      LEFT JOIN rooms r ON ru.roomId = r.id
      LEFT JOIN customers c ON b.customerId = c.id
      WHERE b.id = ? AND b.hotelId = ?`,
      [bookingId, hotelId]
    );

    if ((bookingResults as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = (bookingResults as any[])[0];

    // Get payment history
    const [paymentsResults] = await pool.query(
      `SELECT 
        id,
        amount,
        status,
        paymentMethod,
        transactionId,
        createdAt
      FROM payments
      WHERE bookingId = ?
      ORDER BY createdAt DESC`,
      [bookingId]
    );

    // Format response
    const bookingDetail = {
      id: booking.id,
      hotel: {
        id: booking.hotelId,
        name: booking.hotelName,
      },
      room: {
        id: booking.roomId,
        name: booking.roomName,
        type: booking.roomType,
      },
      roomUnit: {
        id: booking.roomUnitId,
        roomNumber: booking.roomNumber,
      },
      customer: {
        id: booking.customerId,
        name: booking.customerName,
        phone: booking.customerPhone,
      },
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      numberOfGuests: booking.numberOfGuests,
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      payments: paymentsResults,
    };

    return NextResponse.json(bookingDetail);

  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookingId = params.id;
    const updateData = await request.json();

    // Get staff info to verify hotel access
    const [staffResults] = await pool.query(
      'SELECT hotelId FROM staff WHERE userId = ?',
      [session.user.id]
    );

    if ((staffResults as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const staff = (staffResults as any[])[0];
    const hotelId = staff.hotelId;

    // Verify booking belongs to staff's hotel
    const [bookingResults] = await pool.query(
      'SELECT id FROM bookings WHERE id = ? AND hotelId = ?',
      [bookingId, hotelId]
    );

    if ((bookingResults as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const allowedFields = ['status', 'paymentStatus', 'specialRequests'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(bookingId);

    const updateQuery = `
      UPDATE bookings 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    await pool.query(updateQuery, updateValues);

    return NextResponse.json({
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}