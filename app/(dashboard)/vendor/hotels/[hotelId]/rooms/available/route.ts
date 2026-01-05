import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { BookingStatus } from '@/lib/types/enums';

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
    
    // Check permission
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
    } else if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    
    // Parse check-in and check-out dates
    const checkInDateParam = searchParams.get('checkInDate');
    const checkOutDateParam = searchParams.get('checkOutDate');
    
    if (!checkInDateParam || !checkOutDateParam) {
      return NextResponse.json(
        { error: 'Check-in and check-out dates are required' },
        { status: 400 }
      );
    }
    
    const checkInDate = new Date(checkInDateParam);
    const checkOutDate = new Date(checkOutDateParam);
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-in date must be before check-out date' },
        { status: 400 }
      );
    }
    
    // Find rooms that are available for the given date range
    const bookedRoomIds = await prisma.booking.findMany({
      where: {
        hotelId: hotelId,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
        },
        NOT: {
          OR: [
            // Booking ends before check-in
            { checkOutDate: { lte: checkInDate } },
            // Booking starts after check-out
            { checkInDate: { gte: checkOutDate } }
          ]
        }
      },
      select: {
        roomId: true
      }
    });
    
    const bookedRoomIdsSet = new Set(bookedRoomIds.map((b: any) => b.roomId));
    
    // Get all rooms in the hotel
    const rooms = await prisma.room.findMany({
      where: {
        hotelId: hotelId,
        // Filter out rooms in maintenance
        status: {
          not: 'maintenance'
        },
        // Filter out rooms that are already booked in the date range
        NOT: {
          id: {
            in: Array.from(bookedRoomIdsSet)
          }
        }
      },
      include: {
        amenities: {
          include: {
            amenity: true
          }
        }
      }
    });
    
    // Format room data
    const availableRooms = rooms.map((room: any) => {
      // Parse and select the first room number 
      let roomNumber = '';
      if (room.roomNumbers) {
        try {
          const roomNumbers = JSON.parse(room.roomNumbers as string);
          roomNumber = roomNumbers[0] || room.name;
        } catch (e) {
          console.error('Error parsing room numbers:', e);
          roomNumber = room.name;
        }
      } else {
        roomNumber = room.name;
      }
      
      return {
        id: room.id,
        name: room.name,
        type: room.type,
        roomNumber,
        capacity: room.capacity,
        pricePerNight: room.pricePerNight,
        discountedPrice: room.discountedPrice,
        images: room.images ? JSON.parse(room.images as string) : [],
        status: room.status,
        amenities: room.amenities.map((ra: any) => ra.amenity)
      };
    });
    
    return NextResponse.json({
      rooms: availableRooms
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available rooms' },
      { status: 500 }
    );
  }
}