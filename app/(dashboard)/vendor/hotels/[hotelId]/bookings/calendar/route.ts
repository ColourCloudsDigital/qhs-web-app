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
      const [hotelRows] = await pool.query(
        `SELECT h.id FROM hotels h 
         JOIN vendors v ON h.vendorId = v.id 
         WHERE h.id = ? AND v.userId = ?`,
        [hotelId, session.user.id]
      );
      
      if ((hotelRows as any[]).length === 0) {
        return NextResponse.json(
          { error: 'Hotel not found or you do not have access to this hotel' },
          { status: 404 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      const [staffRows] = await pool.query(
        `SELECT s.id FROM staff s 
         WHERE s.userId = ? AND s.hotelId = ?`,
        [session.user.id, hotelId]
      );
      
      if ((staffRows as any[]).length === 0) {
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
    const [roomRows] = await pool.query(
      'SELECT id, roomNumbers FROM rooms WHERE hotelId = ?',
      [hotelId]
    );
    
    // Count physical rooms
    let totalRooms = 0;
    (roomRows as any[]).forEach((room: any) => {
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
    const [bookingRows] = await pool.query(
      `SELECT id, checkInDate, checkOutDate, roomId, status 
       FROM bookings 
       WHERE hotelId = ? 
       AND (
         (checkInDate >= ? AND checkInDate <= ?) OR
         (checkOutDate >= ? AND checkOutDate <= ?) OR
         (checkInDate < ? AND checkOutDate > ?)
       )`,
      [hotelId, startDate, endDate, startDate, endDate, startDate, endDate]
    );
    
    // Group bookings by date
    const bookingsByDate = new Map<string, { count: number, occupiedRooms: Set<string> }>();
    
    const dateRange = getDatesInRange(startDate, endDate);
    
    // Initialize all dates in the range
    dateRange.forEach(date => {
      const dateString = date.toISOString().split('T')[0];
      bookingsByDate.set(dateString, { count: 0, occupiedRooms: new Set() });
    });
    
    // Count bookings for each date
    (bookingRows as any[]).forEach((booking: any) => {
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