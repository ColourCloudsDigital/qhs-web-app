import pool from '@/lib/db';
import { PaginationParams } from '@/lib/utils';

export const roomService = {
  /**
   * Get paginated rooms with optional filters
   */
  async getRooms({
    page = 1,
    limit = 10,
    search = '',
    hotelId,
    status,
    minPrice,
    maxPrice,
    capacity,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: PaginationParams & {
    search?: string;
    hotelId?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    capacity?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const whereConditions: string[] = [];
    const params: any[] = [];

    // Add search filter
    if (search) {
      whereConditions.push(`(rooms.name LIKE ? OR rooms.description LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add hotel filter
    if (hotelId) {
      whereConditions.push(`rooms.hotelId = ?`);
      params.push(hotelId);
    }

    // Add status filter
    if (status) {
      whereConditions.push(`rooms.status = ?`);
      params.push(status);
    }

    // Add price range filters
    if (minPrice !== undefined) {
      whereConditions.push(`rooms.pricePerNight >= ?`);
      params.push(minPrice);
    }

    if (maxPrice !== undefined) {
      whereConditions.push(`rooms.pricePerNight <= ?`);
      params.push(maxPrice);
    }

    // Add capacity filter
    if (capacity !== undefined) {
      whereConditions.push(`rooms.capacity >= ?`);
      params.push(capacity);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build sort order
    const validSortFields = ['createdAt', 'name', 'pricePerNight', 'capacity'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get rooms with count
    const [roomsResult, countResult] = await Promise.all([
      pool.query(`
        SELECT
          rooms.*,
          hotels.id as hotel_id,
          hotels.name as hotel_name,
          hotels.city as hotel_city,
          hotels.state as hotel_state,
          hotels.country as hotel_country
        FROM rooms
        LEFT JOIN hotels ON rooms.hotelId = hotels.id
        ${whereClause}
        ORDER BY rooms.${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]),
      pool.query(`
        SELECT COUNT(*) as total
        FROM rooms
        ${whereClause}
      `, params)
    ]);

    const rooms = (roomsResult as any[])[0];
    const total = (countResult as any[])[0][0].total;

    // Get amenities for each room
    const roomIds = rooms.map((room: any) => room.id);
    let amenitiesMap: { [key: string]: any[] } = {};

    if (roomIds.length > 0) {
      const [amenitiesResult] = await pool.query(`
        SELECT
          room_amenities.roomId,
          amenities.id,
          amenities.name,
          amenities.description,
          amenities.icon
        FROM room_amenities
        JOIN amenities ON room_amenities.amenityId = amenities.id
        WHERE room_amenities.roomId IN (${roomIds.map(() => '?').join(',')})
      `, roomIds);

      const amenities = (amenitiesResult as any[]);

      // Group amenities by roomId
      amenitiesMap = amenities.reduce((acc: { [key: string]: any[] }, amenity: any) => {
        if (!acc[amenity.roomId]) {
          acc[amenity.roomId] = [];
        }
        acc[amenity.roomId].push({
          id: amenity.id,
          name: amenity.name,
          description: amenity.description,
          icon: amenity.icon,
          category: amenity.category,
        });
        return acc;
      }, {});
    }

    // Format the data for the response
    const formattedRooms = rooms.map((room: any) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      description: room.description,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      discountedPrice: room.discountedPrice,
      images: JSON.parse(room.images || '[]'),
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      hotel: {
        id: room.hotel_id,
        name: room.hotel_name,
        city: room.hotel_city,
        state: room.hotel_state,
        country: room.hotel_country,
      },
      amenities: amenitiesMap[room.id] || [],
    }));

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedRooms,
      meta: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  },

  /**
   * Get a single room by ID
   */
  async getRoomById(id: string) {
    // Get room with hotel details
    const [roomResult] = await pool.query(`
      SELECT
        rooms.*,
        hotels.id as hotel_id,
        hotels.name as hotel_name,
        hotels.address as hotel_address,
        hotels.city as hotel_city,
        hotels.state as hotel_state,
        hotels.country as hotel_country,
        hotels.zipCode as hotel_zipCode,
        hotels.images as hotel_images,
        hotels.rating as hotel_rating
      FROM rooms
      JOIN hotels ON rooms.hotelId = hotels.id
      WHERE rooms.id = ?
    `, [id]);

    const roomData = (roomResult as any[])[0];

    if (!roomData) {
      throw new Error('Room not found');
    }

    // Get amenities for this room
    const [amenitiesResult] = await pool.query(`
      SELECT
        amenities.id,
        amenities.name,
        amenities.description,
        amenities.icon
      FROM room_amenities
      JOIN amenities ON room_amenities.amenityId = amenities.id
      WHERE room_amenities.roomId = ?
    `, [id]);

    const amenities = (amenitiesResult as any[]).map((amenity: any) => ({
      id: amenity.id,
      name: amenity.name,
      description: amenity.description,
      icon: amenity.icon,
      category: amenity.category,
    }));

    // Format the data
    return {
      id: roomData.id,
      name: roomData.name,
      type: roomData.type,
      description: roomData.description,
      capacity: roomData.capacity,
      pricePerNight: roomData.pricePerNight,
      discountedPrice: roomData.discountedPrice,
      images: JSON.parse(roomData.images || '[]'),
      status: roomData.status,
      createdAt: roomData.createdAt,
      updatedAt: roomData.updatedAt,
      hotel: {
        id: roomData.hotel_id,
        name: roomData.hotel_name,
        address: roomData.hotel_address,
        city: roomData.hotel_city,
        state: roomData.hotel_state,
        country: roomData.hotel_country,
        zipCode: roomData.hotel_zipCode,
        images: JSON.parse(roomData.hotel_images || '[]'),
        rating: roomData.hotel_rating,
      },
      amenities,
    };
  },

  /**
   * Create a new room
   */
  async createRoom({
    hotelId,
    name,
    type,
    description,
    capacity,
    pricePerNight,
    discountedPrice,
    images,
    status,
    amenityIds,
  }: {
    hotelId: string;
    name: string;
    type: string;
    description: string;
    capacity: number;
    pricePerNight: number;
    discountedPrice?: number;
    images: string[];
    status: string;
    amenityIds: string[];
  }) {
    // Verify that hotel exists
    const [hotelResult] = await pool.query(
      'SELECT id FROM hotels WHERE id = ?',
      [hotelId]
    );

    if ((hotelResult as any[]).length === 0) {
      throw new Error('Hotel not found');
    }

    // Verify that amenities exist and are valid
    if (amenityIds.length > 0) {
      const [amenitiesResult] = await pool.query(
        'SELECT id FROM amenities WHERE id IN (?) AND category = "room"',
        [amenityIds]
      );

      if ((amenitiesResult as any[]).length !== amenityIds.length) {
        throw new Error('One or more amenities are invalid or not categorized as room amenities');
      }
    }

    // Create room with amenities in a transaction
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Create the room
      const [roomResult] = await connection.query(
        `INSERT INTO rooms (hotelId, name, type, description, capacity, pricePerNight, discountedPrice, images, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [hotelId, name, type, description, capacity, pricePerNight, discountedPrice || null, JSON.stringify(images), status]
      );

      const roomId = (roomResult as any).insertId;

      // Create room amenity connections if any
      if (amenityIds.length > 0) {
        const amenityValues = amenityIds.map(amenityId => [roomId, amenityId]);
        await connection.query(
          'INSERT INTO room_amenities (roomId, amenityId) VALUES ?',
          [amenityValues]
        );
      }

      await connection.commit();

      // Fetch the created room
      const [createdRoomResult] = await pool.query(
        'SELECT * FROM rooms WHERE id = ?',
        [roomId]
      );

      const room = (createdRoomResult as any[])[0];

      return {
        ...room,
        images: JSON.parse(room.images || '[]'),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Update an existing room
   */
  async updateRoom(
    id: string,
    {
      name,
      type,
      description,
      capacity,
      pricePerNight,
      discountedPrice,
      images,
      status,
      amenityIds,
    }: {
      name?: string;
      type?: string;
      description?: string;
      capacity?: number;
      pricePerNight?: number;
      discountedPrice?: number | null;
      images?: string[];
      status?: string;
      amenityIds?: string[];
    }
  ) {
    // Verify that room exists
    const [existingRoomResult] = await pool.query(
      'SELECT id FROM rooms WHERE id = ?',
      [id]
    );

    if ((existingRoomResult as any[]).length === 0) {
      throw new Error('Room not found');
    }

    // Verify that amenities exist and are valid (if provided)
    if (amenityIds && amenityIds.length > 0) {
      const [amenitiesResult] = await pool.query(
        'SELECT id FROM amenities WHERE id IN (?) AND category = "room"',
        [amenityIds]
      );

      if ((amenitiesResult as any[]).length !== amenityIds.length) {
        throw new Error('One or more amenities are invalid or not categorized as room amenities');
      }
    }

    // Prepare update data
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (capacity !== undefined) {
      updateFields.push('capacity = ?');
      updateValues.push(capacity);
    }
    if (pricePerNight !== undefined) {
      updateFields.push('pricePerNight = ?');
      updateValues.push(pricePerNight);
    }
    if (discountedPrice !== undefined) {
      updateFields.push('discountedPrice = ?');
      updateValues.push(discountedPrice);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (images !== undefined) {
      updateFields.push('images = ?');
      updateValues.push(JSON.stringify(images));
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id); // for WHERE clause

    // Update room and amenities in a transaction if needed
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update the room if there are fields to update
      if (updateFields.length > 1) { // more than just updatedAt
        const updateQuery = `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = ?`;
        await connection.query(updateQuery, updateValues);
      }

      // Update amenities if provided
      if (amenityIds !== undefined) {
        // Delete existing amenity connections
        await connection.query(
          'DELETE FROM room_amenities WHERE roomId = ?',
          [id]
        );

        // Create new amenity connections
        if (amenityIds.length > 0) {
          const amenityValues = amenityIds.map(amenityId => [id, amenityId]);
          await connection.query(
            'INSERT INTO room_amenities (roomId, amenityId) VALUES ?',
            [amenityValues]
          );
        }
      }

      await connection.commit();

      // Fetch the updated room
      const [updatedRoomResult] = await pool.query(
        'SELECT * FROM rooms WHERE id = ?',
        [id]
      );

      const room = (updatedRoomResult as any[])[0];

      return {
        ...room,
        images: JSON.parse(room.images || '[]'),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Delete a room
   */
  async deleteRoom(id: string) {
    // Verify that room exists
    const [existingRoomResult] = await pool.query(
      'SELECT id FROM rooms WHERE id = ?',
      [id]
    );

    if ((existingRoomResult as any[]).length === 0) {
      throw new Error('Room not found');
    }

    // Delete room (this will cascade delete related amenities)
    await pool.query(
      'DELETE FROM rooms WHERE id = ?',
      [id]
    );

    return { success: true };
  },

  /**
   * Get available rooms for a date range
   */
  async getAvailableRooms({
    hotelId,
    checkInDate,
    checkOutDate,
    guests = 1,
    page = 1,
    limit = 10,
  }: {
    hotelId: string;
    checkInDate: Date;
    checkOutDate: Date;
    guests?: number;
    page?: number;
    limit?: number;
  }) {
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get rooms that are available and can accommodate the guests
    const [roomsResult] = await pool.query(`
      SELECT rooms.*
      FROM rooms
      WHERE rooms.hotelId = ?
        AND rooms.capacity >= ?
        AND rooms.status = 'available'
        AND rooms.id NOT IN (
          SELECT DISTINCT roomId
          FROM bookings
          WHERE (
            (checkInDate >= ? AND checkInDate < ?)
            OR (checkOutDate > ? AND checkOutDate <= ?)
            OR (checkInDate <= ? AND checkOutDate >= ?)
          )
          AND status IN ('CONFIRMED', 'CHECKED_IN')
        )
      LIMIT ? OFFSET ?
    `, [hotelId, guests, checkInDate, checkOutDate, checkInDate, checkOutDate, checkInDate, checkOutDate, limit, offset]);

    const rooms = (roomsResult as any[]);

    // Get amenities for these rooms
    const roomIds = rooms.map((room: any) => room.id);
    let amenitiesMap: { [key: string]: any[] } = {};

    if (roomIds.length > 0) {
      const [amenitiesResult] = await pool.query(`
        SELECT
          room_amenities.roomId,
          amenities.id,
          name,
          description,
          icon,
          category
        FROM room_amenities
        JOIN amenities ON room_amenities.amenityId = amenities.id
        WHERE room_amenities.roomId IN (${roomIds.map(() => '?').join(',')})
      `, roomIds);

      const amenities = (amenitiesResult as any[]);

      // Group amenities by roomId
      amenitiesMap = amenities.reduce((acc: { [key: string]: any[] }, amenity: any) => {
        if (!acc[amenity.roomId]) {
          acc[amenity.roomId] = [];
        }
        acc[amenity.roomId].push({
          id: amenity.id,
          name: amenity.name,
          description: amenity.description,
          icon: amenity.icon,
          category: amenity.category,
        });
        return acc;
      }, {});
    }

    // Format rooms for response
    const formattedRooms = rooms.map((room: any) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      description: room.description,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      discountedPrice: room.discountedPrice,
      images: JSON.parse(room.images || '[]'),
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      amenities: amenitiesMap[room.id] || [],
    }));

    // Get total count for pagination
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM rooms
      WHERE rooms.hotelId = ?
        AND rooms.capacity >= ?
        AND rooms.status = 'available'
        AND rooms.id NOT IN (
          SELECT DISTINCT roomId
          FROM bookings
          WHERE (
            (checkInDate >= ? AND checkInDate < ?)
            OR (checkOutDate > ? AND checkOutDate <= ?)
            OR (checkInDate <= ? AND checkOutDate >= ?)
          )
          AND status IN ('CONFIRMED', 'CHECKED_IN')
        )
    `, [hotelId, guests, checkInDate, checkOutDate, checkInDate, checkOutDate, checkInDate, checkOutDate]);

    const totalRooms = (countResult as any[])[0].total;
    const totalPages = Math.ceil(totalRooms / limit);

    return {
      data: formattedRooms,
      meta: {
        currentPage: page,
        totalPages,
        totalItems: totalRooms,
        itemsPerPage: limit,
      },
    };
  },
};