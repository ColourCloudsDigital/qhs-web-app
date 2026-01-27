import { NextRequest, NextResponse } from 'next/server';
import { availabilityService } from '@/lib/services/availability.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const hotelId = searchParams.get('hotelId');
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');
    
    // Validate required parameters
    if (!hotelId || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'hotelId, checkInDate, and checkOutDate are required' },
        { status: 400 }
      );
    }
    
    // Validate date format and values
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD format' },
        { status: 400 }
      );
    }
    
    if (checkIn >= checkOut) {
      return NextResponse.json(
        { error: 'Check-in date must be before check-out date' },
        { status: 400 }
      );
    }
    
    // Check if dates are in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkIn < today) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      );
    }
    
    // Get hotel availability
    const availability = await availabilityService.getHotelAvailability({
      hotelId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
    });
    
    return NextResponse.json(availability);
    
  } catch (error) {
    console.error('Error getting hotel availability:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get hotel availability',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}