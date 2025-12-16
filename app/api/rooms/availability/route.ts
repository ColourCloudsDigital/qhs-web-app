import { NextRequest, NextResponse } from 'next/server';
import { availabilityService } from '@/lib/services/availability.service';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const hotelId = searchParams.get('hotelId');
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');
    
    // Validate parameters
    if (!hotelId || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'hotelId, checkInDate, and checkOutDate are required' },
        { status: 400 }
      );
    }
    
    // Parse dates
    const parsedCheckInDate = new Date(checkInDate);
    const parsedCheckOutDate = new Date(checkOutDate);
    
    // Validate dates
    if (isNaN(parsedCheckInDate.getTime()) || isNaN(parsedCheckOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    if (parsedCheckInDate >= parsedCheckOutDate) {
      return NextResponse.json(
        { error: 'Check-in date must be before check-out date' },
        { status: 400 }
      );
    }
    
    // Get availability
    const availability = await availabilityService.getHotelAvailability({
      hotelId,
      checkInDate: parsedCheckInDate,
      checkOutDate: parsedCheckOutDate,
    });
    
    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}