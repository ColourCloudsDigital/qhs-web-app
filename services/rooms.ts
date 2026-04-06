import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

export interface RoomCreateInput {
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number;
  status: string;
  hotelId: string;
  images: string[];
  roomNumbers?: string[]; // Room numbers field
  amenities?: string[];
}

export interface RoomUpdateInput {
  name?: string;
  type?: string;
  description?: string;
  capacity?: number;
  pricePerNight?: number;
  basePrice?: number;   // New field name
  discountedPrice?: number;
  status?: string;
  isActive?: boolean;   // New field name
  images?: string[];
  roomNumbers?: string[]; // Room numbers field
  amenities?: string[];
  roomTypeId?: string;    // Added for room_types table reference
}

export interface BulkRoomCreateInput {
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  discountedPrice?: number;
  status: string;
  hotelId: string;
  images: string[];
  roomNumbers: string[];
  amenities?: string[];
}

export class RoomService {
  // Get rooms by hotel ID
  static async getRoomsByHotel(hotelId: string) {
    console.log(`[RoomService] Fetching rooms for hotel ID: ${hotelId}`);
    
    try {
      // Query rooms without room_types join since the table doesn't exist
      const [rooms] = await pool.query(
        `SELECT r.*
         FROM rooms r
         WHERE r.hotelId = ?
         ORDER BY r.name ASC`,
        [hotelId]
      );
      
      console.log(`[RoomService] Found ${(rooms as any[]).length} rooms for hotel ID: ${hotelId}`);
      
      // Get all room IDs to fetch amenities
      const roomIds = (rooms as any[]).map((room: any) => room.id);
      let amenitiesMap: Record<string, any[]> = {};
      
      if (roomIds.length > 0) {
        // Fetch amenities for all rooms in a single query
        const [amenityRows] = await pool.query(
          `SELECT ra.roomId, a.*
           FROM room_amenities ra
           JOIN amenities a ON ra.amenityId = a.id
           WHERE ra.roomId IN (?)`,
          [roomIds]
        );
        
        // Group amenities by room ID
        (amenityRows as any[]).forEach((amenity: any) => {
          if (!amenitiesMap[amenity.roomId]) {
            amenitiesMap[amenity.roomId] = [];
          }
          amenitiesMap[amenity.roomId].push({
            id: amenity.id,
            name: amenity.name,
            description: amenity.description,
            icon: amenity.icon,
            category: amenity.category
          });
        });
      }
      
      // Transform data for frontend
      return (rooms as any[]).map((room: any) => {
        // Parse JSON fields
        let parsedImages = [];
        try {
          if (room.images) {
            parsedImages = typeof room.images === 'string' 
              ? JSON.parse(room.images) 
              : room.images;
          }
        } catch (e) {
          console.error(`[RoomService] Error parsing images for room ${room.id}:`, e);
        }
        
        // Parse room numbers
        let roomNumbers = [];
        try {
          if (room.roomNumbers) {
            roomNumbers = typeof room.roomNumbers === 'string'
              ? JSON.parse(room.roomNumbers)
              : room.roomNumbers;
          }
        } catch (e) {
          console.error(`[RoomService] Error parsing roomNumbers for room ${room.id}:`, e);
        }
        
        return {
          ...room,
          images: parsedImages,
          roomNumbers: roomNumbers,
          amenities: amenitiesMap[room.id] || [],
          // Use data directly from the room without room_types table
          roomType: {
            id: null,
            name: room.type || 'Standard',
            basePrice: room.pricePerNight || 0
          }
        };
      });
    } catch (error) {
      console.error('[RoomService] Error in getRoomsByHotel:', error);
      throw error;
    }
  }

  // Get a room by ID with all related data
  static async getRoomById(roomId: string) {
    try {
      console.log(`[RoomService] Fetching room with ID: ${roomId}`);

      // First verify the room exists with a simple query
      const [roomExistsCheck] = await pool.query(
        `SELECT id, hotelId FROM rooms WHERE id = ?`,
        [roomId]
      );

      if (!(roomExistsCheck as any[]).length) {
        console.log(`[RoomService] Room with ID ${roomId} not found in database`);
        throw new Error('Room not found');
      }

      console.log(`[RoomService] Room exists, fetching details for room ${roomId}`);
      
      // Query the room details without room type information since that table doesn't exist
      const [roomRows] = await pool.query(
        `SELECT r.*, 
                h.name as hotelName,
                h.id as hotelId,
                h.vendorId as hotelVendorId
         FROM rooms r
         LEFT JOIN hotels h ON r.hotelId = h.id
         WHERE r.id = ?`,
        [roomId]
      );
      
      console.log(`[RoomService] Room query result:`, 
        (roomRows as any[]).length ? 'Found' : 'Not found',
        (roomRows as any[]).length ? `Hotel ID: ${(roomRows as any[])[0].hotelId}` : '');
      
      if (!roomRows || (roomRows as any[]).length === 0) {
        console.log(`[RoomService] Room details not found after join query`);
        throw new Error('Room not found');
      }
      
      const room = (roomRows as any[])[0];
      console.log(`[RoomService] Room found, hotelId: ${room.hotelId}, type: ${room.type || 'none'}`);
      
      // Get proper values directly from the room data
      const roomName = room.name || 'Unnamed Room';
      const roomDescription = room.description || 'No description available';
      const roomPrice = room.pricePerNight || 0;
      const roomCapacity = room.capacity || 1;
      const roomBeds = room.bedsCount || 1;
      const bedType = room.bedType || 'Standard';
      
      // Query the hotel info - Fixing the query that tries to access v.name
      console.log(`[RoomService] Fetching hotel info for hotelId: ${room.hotelId}`);
      const [hotelRows] = await pool.query(
        `SELECT h.*, h.vendorId
         FROM hotels h
         WHERE h.id = ?`,
        [room.hotelId]
      );
      
      const hotel = (hotelRows as any[]).length > 0 ? (hotelRows as any[])[0] : null;
      console.log(`[RoomService] Hotel info:`, hotel ? `Found (${hotel.name}, Vendor: ${hotel.vendorId})` : 'Not found');
      
      // Query vendor details if hotel has a vendorId
      let vendor = null;
      if (hotel && hotel.vendorId) {
        try {
          const [vendorRows] = await pool.query(
            `SELECT v.id, u.name as vendorName
             FROM vendors v
             JOIN users u ON v.userId = u.id
             WHERE v.id = ?`,
            [hotel.vendorId]
          );
          
          if ((vendorRows as any[]).length > 0) {
            vendor = (vendorRows as any[])[0];
          }
        } catch (err) {
          console.error('[RoomService] Error fetching vendor details:', err);
          // Continue even if vendor details aren't available
        }
      }
      
      // Query the amenities using the room_amenities table
      console.log(`[RoomService] Fetching amenities for roomId: ${roomId}`);
      const [amenityRows] = await pool.query(
        `SELECT a.* 
         FROM amenities a
         JOIN room_amenities ra ON a.id = ra.amenityId
         WHERE ra.roomId = ?`,
        [roomId]
      );
      
      console.log(`[RoomService] Found ${(amenityRows as any[]).length} amenities for room`);
      
      // Query recent bookings - Fix: use roomUnitId and join with room_units
      console.log(`[RoomService] Fetching recent bookings for roomId: ${roomId}`);
      const [bookingRows] = await pool.query(
        `SELECT b.*, c.firstName, c.lastName 
         FROM bookings b
         JOIN room_units ru ON b.roomUnitId = ru.id
         LEFT JOIN customers c ON b.customerId = c.id
         WHERE ru.roomId = ? 
         ORDER BY b.createdAt DESC 
         LIMIT 5`,
        [roomId]
      );
      
      // If we have bookings, add customer info to each booking
      if ((bookingRows as any[]).length > 0) {
        (bookingRows as any[]).forEach((booking: any) => {
          if (booking.firstName || booking.lastName) {
            booking.customer = {
              id: booking.customerId,
              firstName: booking.firstName,
              lastName: booking.lastName,
              name: booking.firstName && booking.lastName 
                ? `${booking.firstName} ${booking.lastName}`
                : booking.firstName || booking.lastName || 'Guest'
            };
          }
        });
      }
      
      // Parse room images
      let parsedImages = [];
      try {
        if (room.images) {
          parsedImages = typeof room.images === 'string' 
            ? JSON.parse(room.images) 
            : room.images;
        }
      } catch (err) {
        console.error('[RoomService] Error parsing room images:', err);
      }
      
      // Parse room numbers
      let roomNumbers = [];
      try {
        if (room.roomNumbers) {
          roomNumbers = typeof room.roomNumbers === 'string'
            ? JSON.parse(room.roomNumbers)
            : room.roomNumbers;
        } else if (room.roomNumber) {
          roomNumbers = [room.roomNumber];
        }
      } catch (err) {
        console.error('[RoomService] Error parsing room numbers:', err);
      }
      
      // Return formatted room data
      return {
        id: room.id,
        name: roomName,
        description: roomDescription,
        type: room.type || 'standard',
        capacity: roomCapacity,
        pricePerNight: roomPrice,
        basePrice: room.basePrice,
        discountedPrice: room.discountedPrice,
        status: room.status || 'available',
        images: parsedImages,
        roomNumbers: roomNumbers,
        roomNumber: room.roomNumber || (roomNumbers.length > 0 ? roomNumbers[0] : null),
        size: room.size,
        bedsCount: roomBeds,
        bathroomsCount: room.bathroomsCount || 1,
        bedType: bedType,
        hotelId: room.hotelId,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        hotel: {
          id: room.hotelId,
          name: room.hotelName || '',
          vendorId: room.hotelVendorId
        },
        roomType: null,
        amenities: [
          ...(amenityRows as any[]),
        ],
        bookings: bookingRows as any[]
      };
    } catch (error) {
      console.error('[RoomService] Error in getRoomById:', error);
      throw error;
    }
  }
  
  // Create a new room
  static async createRoom(data: RoomCreateInput) {
    // Validate required fields
    if (!data.name || !data.description || !data.hotelId) {
      throw new Error('Missing required fields');
    }
    
    // Verify hotel exists
    const hotel = await pool.query(
      `SELECT * FROM hotels WHERE id = ?`,
      [data.hotelId]
    );
    
    if (!hotel || (hotel as any[]).length === 0) {
      throw new Error('Hotel not found');
    }
    
    // Process images array
    const imagesString = data.images ? JSON.stringify(data.images) : '[]';
    
    // Process room numbers if provided
    const roomNumbersString = data.roomNumbers ? JSON.stringify(data.roomNumbers) : '[]';
    
    // Create room with amenities in a transaction
    const roomId = uuidv4();
    const room = await pool.query(
      `INSERT INTO rooms (id, name, type, description, capacity, pricePerNight, discountedPrice, status, hotelId, images, roomNumbers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [roomId, data.name, data.type || 'standard', data.description, data.capacity || 1, data.pricePerNight || 0, data.discountedPrice, data.status || 'available', data.hotelId, imagesString, roomNumbersString]
    );
    
    // Add amenities if provided
    if (data.amenities && data.amenities.length > 0) {
      // Filter out null or undefined amenities
      const filteredAmenities = data.amenities.filter(id => id !== null && id !== undefined);
      
      for (const amenityId of filteredAmenities) {
        // Check if amenity exists
        const [amenityExists] = await pool.query(
          `SELECT * FROM amenities WHERE id = ?`,
          [amenityId]
        );
        
        if (amenityExists && (amenityExists as any[]).length > 0) {
          await pool.query(
            `INSERT INTO room_amenities (id, roomId, amenityId) VALUES (UUID(), ?, ?)`,
            [roomId, amenityId]
          );
        }
      }
    }
    
    return {
      id: roomId,
      ...data,
      images: JSON.parse(imagesString),
      roomNumbers: JSON.parse(roomNumbersString),
    };
  }
  
  // Create multiple rooms with bulk operation
  static async bulkCreateRooms(data: BulkRoomCreateInput) {
    // Validate required fields
    if (!data.name || !data.description || !data.hotelId || !data.roomNumbers) {
      throw new Error('Missing required fields');
    }
    
    // Verify hotel exists
    const hotel = await pool.query(
      `SELECT * FROM hotels WHERE id = ?`,
      [data.hotelId]
    );
    
    if (!hotel || (hotel as any[]).length === 0) {
      throw new Error('Hotel not found');
    }
    
    // Check for duplicate room numbers
    const existingRooms = await pool.query(
      `SELECT roomNumbers FROM rooms WHERE hotelId = ?`,
      [data.hotelId]
    );
    
    // Get all existing room numbers in the hotel
    const existingRoomNumbers: string[] = [];
    if (existingRooms && (existingRooms as any[]).length > 0) {
      existingRooms.forEach((room: any) => {
        if (room.roomNumbers) {
          try {
            const parsedRoomNumbers = JSON.parse(room.roomNumbers as string) as string[];
            existingRoomNumbers.push(...parsedRoomNumbers);
          } catch (e) {
            console.error('Error parsing room numbers:', e);
          }
        }
      });
    }
    
    // Check for duplicates
    const duplicates = data.roomNumbers.filter(num => existingRoomNumbers.includes(num));
    if (duplicates.length > 0) {
      throw new Error(`These room numbers already exist: ${duplicates.join(', ')}`);
    }
    
    // Process images array
    const imagesString = data.images ? JSON.stringify(data.images) : '[]';
    
    // Process room numbers
    const roomNumbersString = JSON.stringify(data.roomNumbers);
    
    // Create room with amenities in a transaction
    const bulkRoomId = uuidv4();
    const room = await pool.query(
      `INSERT INTO rooms (id, name, type, description, capacity, pricePerNight, discountedPrice, status, hotelId, images, roomNumbers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bulkRoomId, data.name, data.type, data.description, data.capacity, data.pricePerNight, data.discountedPrice, data.status || 'available', data.hotelId, imagesString, roomNumbersString]
    );
    
    // Add amenities if provided
    if (data.amenities && data.amenities.length > 0) {
      // Filter out null or undefined amenities
      const filteredAmenities = data.amenities.filter(id => id !== null && id !== undefined);
      
      for (const amenityId of filteredAmenities) {
        // Check if amenity exists
        const [amenityExists] = await pool.query(
          `SELECT * FROM amenities WHERE id = ?`,
          [amenityId]
        );
        
        if (amenityExists && (amenityExists as any[]).length > 0) {
          await pool.query(
            `INSERT INTO room_amenities (id, roomId, amenityId) VALUES (UUID(), ?, ?)`,
            [bulkRoomId, amenityId]
          );
        }
      }
    }
    
    return {
      id: bulkRoomId,
      ...data,
      images: JSON.parse(imagesString),
      roomNumbers: data.roomNumbers,
    };
  }
  
  // Update a room
  static async updateRoom(roomId: string, data: RoomUpdateInput) {
    console.log(`[RoomService] Updating room ${roomId} with data:`, data);
    
    try {
      // Verify the room exists
      const [roomExists] = await pool.query(
        `SELECT id, hotelId FROM rooms WHERE id = ?`, 
        [roomId]
      );
      
      if ((roomExists as any[]).length === 0) {
        throw new Error('Room not found');
      }
      
      const hotelId = (roomExists as any[])[0].hotelId;
      
      // Remove fields that don't exist in the database schema
      const {
        roomTypeId,
        amenities,
        basePrice, // Not in database
        isActive,  // Not in database
        ...updateData
      } = data;
      
      // Format room data for update - all fields that the rooms table actually has
      const updateFields: Record<string, any> = {};
      
      // Update only provided fields that exist in the database
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.type !== undefined) updateFields.type = updateData.type;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.capacity !== undefined) updateFields.capacity = updateData.capacity;
      if (updateData.pricePerNight !== undefined) updateFields.pricePerNight = updateData.pricePerNight;
      if (updateData.discountedPrice !== undefined) updateFields.discountedPrice = updateData.discountedPrice;
      if (updateData.status !== undefined) updateFields.status = updateData.status;
      
      // Handle images separately since it's a JSON field
      if (updateData.images) {
        // Make sure images is always an array
        const imagesArray = Array.isArray(updateData.images) ? updateData.images : [];
        updateFields.images = JSON.stringify(imagesArray);
        console.log(`[RoomService] Processing images field: ${imagesArray.length} images, JSON: ${updateFields.images}`);
      }
      
      // Handle roomNumbers separately since it's a JSON field
      if (updateData.roomNumbers) {
        // Make sure roomNumbers is always an array
        const roomNumbersArray = Array.isArray(updateData.roomNumbers) ? updateData.roomNumbers : [];
        updateFields.roomNumbers = JSON.stringify(roomNumbersArray);
      }
      
      // If no fields to update, return early
      if (Object.keys(updateFields).length === 0) {
        console.log(`[RoomService] No valid fields to update`);
        
        // Get current room data instead
        const [currentRoom] = await pool.query(
          `SELECT * FROM rooms WHERE id = ?`,
          [roomId]
        );
        
        if ((currentRoom as any[]).length === 0) {
          throw new Error('Failed to retrieve room data');
        }
        
        const room = (currentRoom as any[])[0];
        
        // Parse JSON fields
        let parsedImages = [];
        try {
          if (room.images) {
            parsedImages = typeof room.images === 'string' 
              ? JSON.parse(room.images) 
              : room.images;
          }
        } catch (e) {
          console.error(`[RoomService] Error parsing images for current room:`, e);
        }
        
        let parsedRoomNumbers = [];
        try {
          if (room.roomNumbers) {
            parsedRoomNumbers = typeof room.roomNumbers === 'string'
              ? JSON.parse(room.roomNumbers)
              : room.roomNumbers;
          }
        } catch (e) {
          console.error(`[RoomService] Error parsing roomNumbers for current room:`, e);
        }
        
        return {
          ...room,
          images: parsedImages,
          roomNumbers: parsedRoomNumbers
        };
      }
      
      // Build the SQL query
      const updateFieldsString = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(updateFields);
      
      // Execute the update
      await pool.query(
        `UPDATE rooms SET ${updateFieldsString}, updatedAt = NOW() WHERE id = ?`,
        [...updateValues, roomId]
      );
      
      // Get the updated room
      const [rows] = await pool.query(
        `SELECT * FROM rooms WHERE id = ?`,
        [roomId]
      );
      
      if ((rows as any[]).length === 0) {
        throw new Error('Failed to retrieve updated room');
      }
      
      const room = (rows as any[])[0];
      
      // Handle amenities update separately if provided
      if (data.amenities && Array.isArray(data.amenities)) {
        // First, remove existing amenities
        await pool.query(
          `DELETE FROM room_amenities WHERE roomId = ?`,
          [roomId]
        );
        
        // Then add new amenities
        for (const amenityId of data.amenities) {
          if (amenityId) {
            await pool.query(
              `INSERT INTO room_amenities (id, roomId, amenityId) VALUES (UUID(), ?, ?)`,
              [roomId, amenityId]
            );
          }
        }
      }

      // Sync room_units when roomNumbers is updated
      if (data.roomNumbers && Array.isArray(data.roomNumbers)) {
        const newNumbers = data.roomNumbers.map(String);

        // Get existing room_units for this room
        const [existingUnits] = await pool.query(
          `SELECT id, roomNumber FROM room_units WHERE roomId = ?`,
          [roomId]
        ) as any[];

        const existingNumbers = (existingUnits as any[]).map((u: any) => String(u.roomNumber));

        // Delete units whose roomNumber was removed
        const toDelete = (existingUnits as any[]).filter(
          (u: any) => !newNumbers.includes(String(u.roomNumber))
        );
        for (const unit of toDelete) {
          await pool.query(`DELETE FROM room_units WHERE id = ?`, [unit.id]);
        }

        // Insert units for newly added room numbers
        const toAdd = newNumbers.filter(n => !existingNumbers.includes(n));
        for (const roomNumber of toAdd) {
          await pool.query(
            `INSERT INTO room_units (id, roomId, roomNumber, status, createdAt, updatedAt)
             VALUES (UUID(), ?, ?, 'available', NOW(), NOW())`,
            [roomId, roomNumber]
          );
        }
      }
      
      // Return formatted data with parsed JSON
      console.log(`[RoomService] Room updated successfully. Processing return data.`);
      
      // Parse images from JSON if it's a string
      let parsedImages = [];
      try {
        if (room.images) {
          parsedImages = typeof room.images === 'string' 
            ? JSON.parse(room.images) 
            : room.images;
            
          console.log(`[RoomService] Successfully parsed images field:`, parsedImages);
        }
      } catch (e) {
        console.error(`[RoomService] Error parsing images:`, e);
      }
      
      // Parse room numbers from JSON if it's a string
      let parsedRoomNumbers = [];
      try {
        if (room.roomNumbers) {
          parsedRoomNumbers = typeof room.roomNumbers === 'string'
            ? JSON.parse(room.roomNumbers)
            : room.roomNumbers;
        }
      } catch (e) {
        console.error(`[RoomService] Error parsing roomNumbers:`, e);
      }
      
      return {
        ...room,
        images: parsedImages,
        roomNumbers: parsedRoomNumbers,
      };
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }
  
  // Delete a room
  static async deleteRoom(roomId: string) {
    // Check if room exists
    const room = await pool.query(
      `SELECT * FROM rooms WHERE id = ?`,
      [roomId]
    );
    
    if (!room || (room as any[]).length === 0) {
      throw new Error('Room not found');
    }
    
    // Delete room and all associated data in a transaction
    await pool.query(
      `DELETE FROM room_amenities WHERE roomId = ?`,
      [roomId]
    );
    
    // Delete bookings through room_units relationship
    await pool.query(
      `DELETE b FROM bookings b
       JOIN room_units ru ON b.roomUnitId = ru.id
       WHERE ru.roomId = ?`,
      [roomId]
    );
    
    // Delete room_units for this room
    await pool.query(
      `DELETE FROM room_units WHERE roomId = ?`,
      [roomId]
    );
    
    await pool.query(
      `DELETE FROM rooms WHERE id = ?`,
      [roomId]
    );
    
    return { success: true };
  }
  
  // Get rooms by room type ID
  static async getRoomsByRoomTypeId(roomTypeId: string) {
    const rooms = await pool.query(
      `SELECT r.*, rt.name as typeName, rt.description as typeDescription, rt.basePrice, rt.capacity as typeCapacity, rt.bedType
       FROM rooms r
       LEFT JOIN room_types rt ON r.roomTypeId = rt.id
       WHERE r.type = ?
       ORDER BY r.name ASC`,
      [roomTypeId]
    );
    
    // Transform data for frontend
    return (rooms as any[]).map(room => ({
      ...room,
      images: room.images ? JSON.parse(room.images as string) : [],
      roomNumbers: room.roomNumbers ? JSON.parse(room.roomNumbers as string) : [],
      amenities: room.amenities ? JSON.parse(room.amenities as string) : [],
    }));
  }
  
  // Check room number availability in a hotel
  static async checkRoomNumbersAvailability(hotelId: string, roomNumbers: string[], excludeRoomId?: string) {
    if (!roomNumbers || roomNumbers.length === 0) {
      return { 
        available: true, 
        duplicates: [] 
      };
    }
    
    const rooms = await pool.query(
      `SELECT id, name, roomNumbers FROM rooms WHERE hotelId = ? AND NOT id = ?`,
      [hotelId, excludeRoomId]
    );
    
    // Get all existing room numbers in the hotel
    const existingRoomNumbers: string[] = [];
    const roomsWithDuplicates: { roomId: string; roomName: string; conflictingNumbers: string[] }[] = [];
    
    (rooms as any[]).forEach((room: any) => {
      if (room.roomNumbers) {
        try {
          const parsedRoomNumbers = JSON.parse(room.roomNumbers as string) as string[];
          
          // Check for conflicts
          const conflictingNumbers = roomNumbers.filter(num => 
            parsedRoomNumbers.includes(num)
          );
          
          if (conflictingNumbers.length > 0) {
            roomsWithDuplicates.push({
              roomId: room.id,
              roomName: room.name,
              conflictingNumbers,
            });
          }
          
          existingRoomNumbers.push(...parsedRoomNumbers);
        } catch (e) {
          console.error(`Error parsing room numbers for room ${room.id}:`, e);
        }
      }
    });
    
    // Get the list of duplicate room numbers
    const duplicates = roomNumbers.filter(num => existingRoomNumbers.includes(num));
    
    return {
      available: duplicates.length === 0,
      duplicates,
      conflictingRooms: roomsWithDuplicates,
    };
  }

  // Get similar rooms (same hotel and/or room type)
  static async getSimilarRooms(roomId: string, hotelId: string, roomTypeId?: string) {
    try {
      let query = `
        SELECT r.*
        FROM rooms r
        WHERE r.id != ? AND r.hotelId = ?
      `;
      
      const params: any[] = [roomId, hotelId];
      
      if (roomTypeId) {
        query += ` AND r.type = ?`;
        params.push(roomTypeId);
        query += ` ORDER BY r.pricePerNight`;
      } else {
        query += ` ORDER BY r.pricePerNight`;
      }
      
      query += ` LIMIT 6`;
      
      const [rows] = await pool.query(query, params);
      
      if (!(rows as any[]).length) {
        return [];
      }
      
      // Format the room data
      const formattedRooms = (rows as any[]).map(room => {
        // Get proper values, using room_types data when available
        const roomName = room.name || room.typeName || 'Unnamed Room';
        const roomDescription = room.description || room.typeDescription || 'No description available';
        const roomPrice = room.pricePerNight || room.basePrice || 0;
        const roomCapacity = room.capacity || room.typeCapacity || 1;
        const bedType = room.bedType || 'Standard';
        
        // Process images if available
        let images = [];
        if (room.images) {
          try {
            images = JSON.parse(room.images);
          } catch (e) {
            console.error(`Error parsing images for room ${room.id}:`, e);
          }
        }
        
        return {
          id: room.id,
          name: roomName,
          description: roomDescription,
          pricePerNight: roomPrice,
          basePrice: room.basePrice,
          capacity: roomCapacity,
          bedType: bedType,
          type: room.type,
          roomTypeId: room.roomTypeId,
          status: room.status,
          roomNumber: room.roomNumber,
          images: images,
          hotelId: room.hotelId,
          size: room.size,
          bedsCount: room.bedsCount,
          bathroomsCount: room.bathroomsCount
        };
      });
      
      return formattedRooms;
    } catch (error) {
      console.error('Error getting similar rooms:', error);
      return [];
    }
  }
}