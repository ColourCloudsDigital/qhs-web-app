// services/room-types.ts
import pool from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface RoomTypeCreateInput {
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  hotelId: string;
  amenities?: string[];
}

export interface RoomTypeUpdateInput {
  name?: string;
  description?: string;
  basePrice?: number;
  capacity?: number;
  amenities?: string[];
}

export class RoomTypeService {
  // Get all room types for a hotel
  static async getRoomTypes(hotelId: string) {
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId },
      orderBy: {
        name: 'asc',
      },
    });
    
    return roomTypes;
  }
  
  // Get a room type by ID
  static async getRoomTypeById(roomTypeId: string) {
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: {
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });
    
    if (!roomType) {
      throw new Error('Room type not found');
    }
    
    return roomType;
  }
  
  // Create a new room type
  static async createRoomType(data: RoomTypeCreateInput) {
    // Validate required fields
    if (!data.name || !data.description || !data.hotelId) {
      throw new Error('Missing required fields');
    }
    
    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: data.hotelId },
    });
    
    if (!hotel) {
      throw new Error('Hotel not found');
    }
    
    // Create the room type
    const roomType = await prisma.roomType.create({
      data: {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        capacity: data.capacity,
        hotelId: data.hotelId,
      },
    });
    
    return roomType;
  }
  
  // Update an existing room type
  static async updateRoomType(roomTypeId: string, data: RoomTypeUpdateInput) {
    // Check if room type exists
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });
    
    if (!roomType) {
      throw new Error('Room type not found');
    }
    
    // Validate required fields if provided
    if ((data.name === '' || data.description === '')) {
      throw new Error('Name and description cannot be empty');
    }
    
    // Update room type
    const updatedRoomType = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
      },
    });
    
    return updatedRoomType;
  }
  
  // Delete a room type
  static async deleteRoomType(roomTypeId: string) {
    // Check if room type exists
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: {
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });
    
    if (!roomType) {
      throw new Error('Room type not found');
    }
    
    // Check if the room type has rooms associated with it
    if (roomType._count.rooms > 0) {
      throw new Error('Cannot delete room type that has rooms associated with it');
    }
    
    // Delete the room type
    await prisma.roomType.delete({
      where: { id: roomTypeId },
    });
    
    return { success: true };
  }
  
  // Get rooms by room type
  static async getRoomsByRoomType(roomTypeId: string) {
    const rooms = await prisma.room.findMany({
      where: { type: roomTypeId },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });
    
    return rooms.map(room => ({
      ...room,
      images: room.images ? JSON.parse(room.images as string) : [],
      roomNumbers: room.roomNumbers ? JSON.parse(room.roomNumbers as string) : [],
      amenities: room.amenities.map(a => a.amenity),
    }));
  }
  
  // Get room count by room type
  static async getRoomCountByRoomType(roomTypeId: string) {
    const count = await prisma.room.count({
      where: { type: roomTypeId },
    });
    
    return count;
  }
}