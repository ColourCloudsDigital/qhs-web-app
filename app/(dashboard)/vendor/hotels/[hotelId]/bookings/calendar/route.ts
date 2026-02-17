import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const hotelId = params.hotelId;
    
    // Check access permissions
    if (session.user.role === 'VENDOR') {
      const hotel = await prisma.hotel.findFirst({
        where: {
          id: hotelId,
          vendor: {
            user: {
              id: session.user.id
            }
          }
        }
      });
      
      if (!hotel) {
        return NextResponse.json(
          { error: 'Hotel not found or you do not have access to this hotel' },
          { status: 404 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      const staff = await prisma.staff.findFirst({
        where: {
          user: {
            id: session.user.id
          },
          hotelId: hotelId
        }
      });
      
      if (!staff) {
        return NextResponse.json(
          { error: 'You do not have access to this hotel' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    
    // Get start and end dates from query params or default to current month
    let startDate = new Date();
    let endDate = new Date();
    
    if (searchParams.has('startDate') && searchParams.has('endDate')) {
      startDate = new Date(searchParams.get('startDate')!);
      endDate = new Date(searchParams.get('endDate')!);
    } else {
      // Default to current month
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    }
    
    // Get total rooms in the hotel
    const rooms = await prisma.room.findMany({
      where: {
        hotelId: hotelId
      },
      select: {
        id: true,
        roomNumbers: true
      }
    });
    
    // Count physical rooms
    let totalRooms = 0;
    rooms.forEach((room: any) => {
      if (room.roomNumbers) {
        try {
          const roomNumbersArray = JSON.parse(room.roomNumbers as string);
          totalRooms += roomNumbersArray.length;
        } catch (e) {
          console.error('Error parsing room numbers:', e);
          totalRooms += 1; // Assume at least one room if parsing fails
        }
      } else {
        totalRooms += 1; // Default to 1 room if no room numbers specified
      }
    });
    
    // Get bookings within the date range
    const bookings = await prisma.booking.findMany({
      where: {
        hotelId: hotelId,
        OR: [
          {
            // Bookings that start within the date range
            checkInDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            // Bookings that end within the date range
            checkOutDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            // Bookings that span the entire date range
            AND: [
              {
                checkInDate: {
                  lt: startDate
                }
              },
              {
                checkOutDate: {
                  gt: endDate
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        checkInDate: true,
        checkOutDate: true,
        roomId: true,
        status: true
      }
    });
    
    // Group bookings by date
    const bookingsByDate = new Map<string, { count: number, occupiedRooms: Set<string> }>();
    
    const dateRange = getDatesInRange(startDate, endDate);
    
    // Initialize all dates in the range
    dateRange.forEach(date => {
      const dateString = date.toISOString().split('T')[0];
      bookingsByDate.set(dateString, { count: 0, occupiedRooms: new Set() });
    });
    
    // Count bookings for each date
    bookings.forEach((booking: any) => {
      const bookingStart = new Date(booking.checkInDate);
      const bookingEnd = new Date(booking.checkOutDate);
      
      // For each day of the booking
      const datesInBooking = getDatesInRange(
        bookingStart > startDate ? bookingStart : startDate,
        bookingEnd < endDate ? bookingEnd : endDate
      );
      
      datesInBooking.forEach(date => {
        const dateString = date.toISOString().split('T')[0];
        const dateData = bookingsByDate.get(dateString);
        
        if (dateData) {
          dateData.count += 1;
          dateData.occupiedRooms.add(booking.roomId);
        }
      });
    });
    
    // Convert to array for response
    const calendarData = Array.from(bookingsByDate.entries()).map(([date, data]) => {
      return {
        date,
        count: data.count,
        occupancyRate: Math.round((data.occupiedRooms.size / totalRooms) * 100)
      };
    });
    
    return NextResponse.json({
      bookings: calendarData
    });
  } catch (error) {
    console.error('Error fetching booking calendar data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking calendar data' },
      { status: 500 }
    );
  }
}

// Helper function to get all dates in a range
function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  // Remove time portion for consistent comparison
  currentDate.setHours(0, 0, 0, 0);
  const endDateNoTime = new Date(endDate);
  endDateNoTime.setHours(0, 0, 0, 0);
  
  while (currentDate <= endDateNoTime) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}