import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { roomService } from '@/lib/services/room.service';
import RoomDetailClient from './client';

interface PageProps {
  params: {
    hotelId: string;
    roomId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { roomId } = params;
  
  try {
    const room = await roomService.getRoomById(roomId);
    
    if (!room) {
      return {
        title: 'Room Not Found | Qaras Hospitality Solutions',
        description: 'The requested room could not be found.'
      };
    }
    
    return {
      title: `${room.name} - ${room.hotel.name} | Qaras Hospitality Solutions`,
      description: room.description.substring(0, 160) + (room.description.length > 160 ? '...' : '')
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error | Qaras Hospitality Solutions',
      description: 'An error occurred while loading the room details.'
    };
  }
}

export default async function RoomDetailPage({ params }: PageProps) {
  const { hotelId, roomId } = params;
  
  try {
    // Get session to check if user is logged in
    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session?.user;
    let customerId = null;

    // If user is logged in and is a customer, get their customer ID
    if (isLoggedIn && session?.user?.role === 'CUSTOMER') {
      customerId = session.user.customerId || null;
    }
    
    // Get the room directly by its ID - the room already has the hotel information nested
    const room = await roomService.getRoomById(roomId);
    
    if (!room) {
      notFound();
    }
    
    // Verify that the room actually belongs to the specified hotel
    if (room.hotel.id !== hotelId) {
      console.error(`Room ${roomId} does not belong to hotel ${hotelId}, it belongs to hotel ${room.hotel.id}`);
      notFound();
    }
    
    // Get related rooms (other rooms from the same hotel)
    // We'll fetch a small selection of rooms from the same hotel
    const roomsResponse = await roomService.getRooms({
      hotelId: room.hotel.id,
      limit: 4,
    });
    
    // Filter out the current room from related rooms
    const filteredRelatedRooms = roomsResponse.data
      .filter((relatedRoom: { id: string }) => relatedRoom.id !== room.id)
      .slice(0, 3); // Limit to 3 related rooms
    
    return (
      <RoomDetailClient 
        hotel={room.hotel}
        room={room}
        relatedRooms={filteredRelatedRooms}
        isLoggedIn={isLoggedIn}
        customerId={customerId}
      />
    );
  } catch (error) {
    console.error('Error fetching room details:', error);
    notFound();
  }
}