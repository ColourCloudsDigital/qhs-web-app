import { NextRequest, NextResponse } from 'next/server';
import { availabilityService } from '@/lib/services/availability.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');
    
    // Validate parameters
    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'checkInDate and checkOutDate are required' },
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
    
    try {
      // Check room availability
      const isAvailable = await availabilityService.checkRoomAvailability({
        roomId,
        checkInDate: parsedCheckInDate,
        checkOutDate: parsedCheckOutDate,
      });
      
      // Calculate price if available
      let priceInfo = null;
      if (isAvailable) {
        priceInfo = await availabilityService.calculateBookingPrice({
          roomId,
          checkInDate: parsedCheckInDate,
          checkOutDate: parsedCheckOutDate,
        });
      }
      
      return NextResponse.json({
        roomId,
        checkInDate: parsedCheckInDate,
        checkOutDate: parsedCheckOutDate,
        isAvailable,
        priceInfo,
      });
    } catch (error: any) {
      console.error('Error in availability check:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to check room availability' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error checking room availability:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check room availability' },
      { status: 500 }
    );
  }
}