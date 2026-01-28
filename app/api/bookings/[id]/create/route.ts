import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

interface AvailabilityResult extends RowDataPacket {
  bookingCount: number;
}

interface RoomResult extends RowDataPacket {
  pricePerNight: number;
}

/**
 * POST /api/bookings/create
 * Creates a booking with customer information without creating a user account
 */
export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  
  try {
    // Parse request body
    const body = await request.json();
    console.log('Booking request body:', body);
    
    // Extract data from request
    const { 
      // Guest info
      firstName, 
      lastName, 
      email, 
      phone,
      
      // Booking info
      hotelId,
      roomId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      numberOfRooms,
      specialRequests,
      paymentMethod 
    } = body;
    
    // Basic validation
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: 'Missing guest information' }, { status: 400 });
    }
    
    if (!hotelId || !roomId || !checkInDate || !checkOutDate || !numberOfGuests) {
      return NextResponse.json({ error: 'Missing booking information' }, { status: 400 });
    }
    
    console.log('Starting transaction');
    await connection.beginTransaction();
    
    // Verify room availability and get available room unit
    const [availableUnits] = await connection.query(
      `SELECT ru.id as roomUnitId 
       FROM room_units ru
       WHERE ru.roomId = ? 
       AND ru.status = 'available'
       AND ru.id NOT IN (
         SELECT b.roomUnitId 
         FROM bookings b 
         WHERE b.roomUnitId IS NOT NULL
         AND b.status != 'CANCELLED'
         AND (
           (b.checkInDate < ? AND b.checkOutDate > ?)
         )
       )
       LIMIT ?`,
      [roomId, checkOutDate, checkInDate, numberOfRooms || 1]
    );
    
    console.log('Available units check result:', availableUnits);
    
    if ((availableUnits as any[]).length < (numberOfRooms || 1)) {
      return NextResponse.json({ error: 'Not enough available room units for the selected dates' }, { status: 409 });
    }
    
    // Step 1: Create customer record with name and hotel information
    console.log('Creating customer');
    const customerId = uuidv4();
    
    await connection.query(
      `INSERT INTO customers (id, firstName, lastName, userId, hotelId, phone, address, createdAt, updatedAt) 
       VALUES (?, ?, ?, NULL, ?, ?, NULL, NOW(), NOW())`,
      [customerId, firstName, lastName, hotelId, phone]
    );
    
    // Step 2: Get room price with error handling
    console.log('Getting room price');
    const [roomResults] = await connection.query<RoomResult[]>('SELECT pricePerNight FROM rooms WHERE id = ?', [roomId]);
    
    if (!roomResults || roomResults.length === 0) {
      throw new Error(`Room with id ${roomId} not found`);
    }
    
    // Calculate nights and total price
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const pricePerNight = roomResults[0].pricePerNight;
    const totalAmount = pricePerNight * nights;
    
    console.log('Price calculation:', { nights, pricePerNight, totalAmount });
    
    // Step 3: Create booking with room unit ID instead of room ID
    console.log('Creating booking');
    const bookingId = uuidv4();
    const selectedRoomUnit = (availableUnits as any[])[0];
    
    await connection.query(
      `INSERT INTO bookings (id, hotelId, roomUnitId, customerId, checkInDate, checkOutDate, 
       numberOfGuests, numberOfRooms, totalAmount, status, paymentStatus, specialRequests, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'PENDING', ?, NOW(), NOW())`,
      [
        bookingId, hotelId, selectedRoomUnit.roomUnitId, customerId,
        checkInDate, checkOutDate, numberOfGuests, numberOfRooms, totalAmount,
        specialRequests || null
      ]
    );
    
    // Update room unit status to reserved
    await connection.query(
      `UPDATE room_units SET status = 'reserved', currentBookingId = ? WHERE id = ?`,
      [bookingId, selectedRoomUnit.roomUnitId]
    );
    
    // Commit the transaction
    console.log('Committing transaction');
    await connection.commit();
    
    // Return the booking id and reference
    return NextResponse.json({
      success: true,
      id: bookingId,
      totalAmount,
      nights
    });
    
  } catch (error: any) {
    // Rollback in case of error
    console.error('Error creating booking:', error);
    try {
      await connection.rollback();
      console.log('Transaction rolled back');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    
    // Return detailed error for debugging
    return NextResponse.json({ 
      error: 'Failed to create booking',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  } finally {
    try {
      connection.release();
      console.log('Connection released');
    } catch (releaseError) {
      console.error('Error releasing connection:', releaseError);
    }
  }
} 