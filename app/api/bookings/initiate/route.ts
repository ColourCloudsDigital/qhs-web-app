import { NextRequest, NextResponse } from 'next/server';
import { availabilityService } from '@/lib/services/availability.service';
import pool from '@/lib/db';

/**
 * POST /api/bookings/initiate
 * Validates booking details and returns pricing information
 * This endpoint is used to validate booking before collecting guest details
 */
export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    
    // Validate required fields
    const requiredFields = ['hotelId', 'roomId', 'checkInDate', 'checkOutDate', 'numberOfGuests'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    
    // Validate dates
    const checkInDate = new Date(bookingData.checkInDate);
    const checkOutDate = new Date(bookingData.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      return NextResponse.json({ error: 'Check-in date cannot be in the past' }, { status: 400 });
    }
    
    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Check-out date must be after check-in date' }, { status: 400 });
    }
    
    // Validate number of guests
    const numberOfGuests = parseInt(bookingData.numberOfGuests);
    if (numberOfGuests < 1) {
      return NextResponse.json({ error: 'Number of guests must be at least 1' }, { status: 400 });
    }
    
    // Check if room exists and get its details
    const [roomResults] = await pool.query(
      'SELECT * FROM rooms WHERE id = ? AND status = ?',
      [bookingData.roomId, 'available']
    );
    
    if ((roomResults as any[]).length === 0) {
      return NextResponse.json({ error: 'Room not found or not available' }, { status: 400 });
    }
    
    const room = (roomResults as any[])[0];
    
    // Check if number of guests exceeds room capacity
    if (numberOfGuests > room.capacity) {
      return NextResponse.json({ 
        error: `This room can accommodate maximum ${room.capacity} guests` 
      }, { status: 400 });
    }
    
    // Check room availability for the selected dates
    const isAvailable = await availabilityService.checkRoomAvailability({
      roomId: bookingData.roomId,
      checkInDate,
      checkOutDate,
    });
    
    if (!isAvailable) {
      return NextResponse.json({ 
        error: 'Room is not available for the selected dates' 
      }, { status: 400 });
    }
    
    // Check if there are available room units
    const [availableUnits] = await pool.query(
      `SELECT COUNT(*) as availableCount FROM room_units 
       WHERE roomId = ? AND status = 'available' 
       AND (currentBookingId IS NULL OR currentBookingId = '')`,
      [bookingData.roomId]
    );
    
    const availableCount = (availableUnits as any[])[0].availableCount;
    if (availableCount === 0) {
      return NextResponse.json({ 
        error: 'No available units for this room' 
      }, { status: 400 });
    }
    
    // Calculate pricing
    const priceInfo = await availabilityService.calculateBookingPrice({
      roomId: bookingData.roomId,
      checkInDate,
      checkOutDate,
    });
    
    // Get hotel details
    const [hotelResults] = await pool.query(
      'SELECT name, address, city, state, country FROM hotels WHERE id = ?',
      [bookingData.hotelId]
    );
    
    const hotel = (hotelResults as any[])[0];
    
    return NextResponse.json({
      success: true,
      message: 'Booking details validated successfully',
      bookingDetails: {
        hotelId: bookingData.hotelId,
        hotelName: hotel?.name || 'Hotel',
        roomId: bookingData.roomId,
        roomName: room.name,
        roomType: room.type,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        numberOfGuests: numberOfGuests,
        pricePerNight: room.pricePerNight,
        discountedPrice: room.discountedPrice,
        totalAmount: priceInfo.totalPrice,
        nights: priceInfo.nights,
        maxCapacity: room.capacity
      }
    });
    
  } catch (error) {
    console.error('Error initiating booking:', error);
    return NextResponse.json(
      { 
        error: 'Failed to validate booking details', 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}