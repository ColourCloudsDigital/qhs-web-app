import { NextRequest, NextResponse } from 'next/server';
import { availabilityService } from '@/lib/services/availability.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const searchParams = request.nextUrl.searchParams;
    
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');
    
    // Validate required parameters
    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'checkInDate and checkOutDate are required' },
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
    
    // Check room availability
    const isAvailable = await availabilityService.checkRoomAvailability({
      roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
    });
    
    if (!isAvailable) {
      return NextResponse.json({
        isAvailable: false,
        message: 'Room is not available for the selected dates'
      });
    }
    
    // Calculate price information
    const priceInfo = await availabilityService.calculateBookingPrice({
      roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
    });
    
    return NextResponse.json({
      isAvailable: true,
      priceInfo: {
        nights: priceInfo.nights,
        pricePerNight: priceInfo.pricePerNight,
        totalPrice: priceInfo.totalPrice,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate
      }
    });
    
  } catch (error) {
    console.error('Error checking room availability:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check room availability',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}