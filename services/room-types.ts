// services/room-types.ts
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

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

interface RoomTypeRow extends RowDataPacket {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  hotelId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CountRow extends RowDataPacket {
  count: number;
}

interface RoomRow extends RowDataPacket {
  id: string;
  type: string;
  images: string;
  roomNumbers: string;
  amenityIds: string | null;
  amenityNames: string | null;
  [key: string]: any;
}

export class RoomTypeService {
  // Get all room types for a hotel
  static async getRoomTypes(hotelId: string) {
    const [rows] = await pool.query<RoomTypeRow[]>(
      `SELECT * FROM room_types WHERE hotelId = ? ORDER BY name ASC`,
      [hotelId]
    );
    
    return rows;
  }
  
  // Get a room type by ID
  static async getRoomTypeById(roomTypeId: string) {
    const [rows] = await pool.query<RoomTypeRow[]>(
      `SELECT * FROM room_types WHERE id = ?`,
      [roomTypeId]
    );
    
    if (rows.length === 0) {
      throw new Error('Room type not found');
    }
    
    const roomType = rows[0];
    
    // Get room count for this room type
    const [countRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM rooms WHERE type = ?`,
      [roomTypeId]
    );
    
    const roomCount = countRows[0]?.count || 0;
    
    return {
      ...roomType,
      _count: {
        rooms: roomCount
      }
    };
  }
  
  // Create a new room type
  static async createRoomType(data: RoomTypeCreateInput) {
    // Validate required fields
    if (!data.name || !data.description || !data.hotelId) {
      throw new Error('Missing required fields');
    }
    
    // Verify hotel exists
    const [hotelRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM hotels WHERE id = ?`,
      [data.hotelId]
    );
    
    if (hotelRows.length === 0) {
      throw new Error('Hotel not found');
    }
    
    // Create the room type
    const roomTypeId = uuidv4();
    const now = new Date();
    
    await pool.query(
      `INSERT INTO room_types (id, name, description, basePrice, capacity, hotelId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [roomTypeId, data.name, data.description, data.basePrice, data.capacity, data.hotelId, now, now]
    );
    
    // Fetch and return the created room type
    const [createdRows] = await pool.query<RoomTypeRow[]>(
      `SELECT * FROM room_types WHERE id = ?`,
      [roomTypeId]
    );
    
    return createdRows[0];
  }
  
  // Update an existing room type
  static async updateRoomType(roomTypeId: string, data: RoomTypeUpdateInput) {
    // Check if room type exists
    const [existingRows] = await pool.query<RoomTypeRow[]>(
      `SELECT * FROM room_types WHERE id = ?`,
      [roomTypeId]
    );
    
    if (existingRows.length === 0) {
      throw new Error('Room type not found');
    }
    
    // Validate required fields if provided
    if ((data.name === '' || data.description === '')) {
      throw new Error('Name and description cannot be empty');
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.basePrice !== undefined) {
      updates.push('basePrice = ?');
      values.push(data.basePrice);
    }
    if (data.capacity !== undefined) {
      updates.push('capacity = ?');
      values.push(data.capacity);
    }
    
    updates.push('updatedAt = ?');
    values.push(new Date());
    
    values.push(roomTypeId);
    
    // Update room type
    await pool.query(
      `UPDATE room_types SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Fetch and return the updated room type
    const [updatedRows] = await pool.query<RoomTypeRow[]>(
      `SELECT * FROM room_types WHERE id = ?`,
      [roomTypeId]
    );
    
    return updatedRows[0];
  }
  
  // Delete a room type
  static async deleteRoomType(roomTypeId: string) {
    // Check if room type exists
    const [existingRows] = await pool.query<RoomTypeRow[]>(
      `SELECT * FROM room_types WHERE id = ?`,
      [roomTypeId]
    );
    
    if (existingRows.length === 0) {
      throw new Error('Room type not found');
    }
    
    // Check if the room type has rooms associated with it
    const [roomCountRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM rooms WHERE type = ?`,
      [roomTypeId]
    );
    
    const roomCount = roomCountRows[0]?.count || 0;
    
    if (roomCount > 0) {
      throw new Error('Cannot delete room type that has rooms associated with it');
    }
    
    // Delete the room type
    await pool.query(
      `DELETE FROM room_types WHERE id = ?`,
      [roomTypeId]
    );
    
    return { success: true };
  }
  
  // Get rooms by room type
  static async getRoomsByRoomType(roomTypeId: string) {
    const [rows] = await pool.query<RoomRow[]>(
      `SELECT r.*, 
              GROUP_CONCAT(DISTINCT a.id) as amenityIds,
              GROUP_CONCAT(DISTINCT a.name) as amenityNames
       FROM rooms r
       LEFT JOIN room_amenities ra ON r.id = ra.roomId
       LEFT JOIN amenities a ON ra.amenityId = a.id
       WHERE r.type = ?
       GROUP BY r.id`,
      [roomTypeId]
    );
    
    return rows.map((room) => ({
      ...room,
      images: room.images ? JSON.parse(room.images) : [],
      roomNumbers: room.roomNumbers ? JSON.parse(room.roomNumbers) : [],
      amenities: room.amenityIds ? room.amenityIds.split(',').map((id: string, index: number) => ({
        id,
        name: room.amenityNames!.split(',')[index]
      })) : []
    }));
  }
  
  // Get room count by room type
  static async getRoomCountByRoomType(roomTypeId: string) {
    const [rows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM rooms WHERE type = ?`,
      [roomTypeId]
    );
    
    return rows[0]?.count || 0;
  }
}
