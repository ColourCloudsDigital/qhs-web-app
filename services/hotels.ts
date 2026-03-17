import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

export interface HotelFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  capacity?: number;
  search?: string;
  vendorId?: string;
}

export interface HotelCreateInput {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  phone: string;
  email: string;
  website?: string;
  images: string[];
  rating?: number;
  vendorId: string;
  amenities?: string[];
  whitelabelConfig?: any;
}

export interface HotelUpdateInput {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  images?: string[];
  rating?: number;
  vendorId?: string;
  amenities?: string[];
  whitelabelConfig?: any;
  isActive?: boolean;
}

interface HotelWhereConditions {
  clauses: string[];
  params: any[];
}

export class HotelService {
  // Get hotels with pagination, filtering and sorting
  static async getHotels({
    page = 1,
    pageSize = 10,
    sortColumn = 'createdAt',
    sortDirection = 'desc',
    filters = {},
    simple = false
  }: {
    page?: number;
    pageSize?: number;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    filters?: HotelFilters;
    simple?: boolean;
  }) {
  
    // If simple is true, just return id and name for dropdowns
    if (simple) {
      const [hotels] = await pool.query(
        `SELECT id, name FROM hotels ORDER BY name ASC`
      ) as [RowDataPacket[], any];
      
      return { hotels };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Build WHERE conditions for MySQL
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Apply vendor filter if provided
    if (filters.vendorId) {
      whereClause += ' AND h.vendorId = ?';
      params.push(filters.vendorId);
    }
    
    // Apply search filter if provided
    if (filters.search) {
      whereClause += ' AND (h.name LIKE ? OR h.city LIKE ? OR h.state LIKE ? OR h.country LIKE ?)';
      const searchParam = `%${filters.search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // Location filter (city, state, or country)
    if (filters.location) {
      whereClause += ' AND (h.city LIKE ? OR h.state LIKE ? OR h.country LIKE ?)';
      const locationParam = `%${filters.location}%`;
      params.push(locationParam, locationParam, locationParam);
    }
    
    // Count total hotels matching filter for pagination
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM hotels h
       ${whereClause}`,
      params
    ) as [RowDataPacket[], any];
    
    const totalHotels = countRows[0].total;
    
    // Prepare the ORDER BY clause
    let orderByClause = '';
    
    // Map frontend sortColumn to database field
    switch (sortColumn) {
      case 'name':
      case 'city':
      case 'state':
      case 'country':
      case 'rating':
      case 'createdAt':
        orderByClause = `ORDER BY h.${sortColumn} ${sortDirection}`;
        break;
      default:
        orderByClause = 'ORDER BY h.createdAt DESC';
    }
    
    // Fetch hotels with pagination and sorting
    const [hotels] = await pool.query(
      `SELECT h.*, u.name as vendorName
       FROM hotels h
       LEFT JOIN vendors v ON h.vendorId = v.id
       LEFT JOIN users u ON v.userId = u.id
       ${whereClause}
       ${orderByClause}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, skip]
    ) as [RowDataPacket[], any];
    
    // Get room counts for each hotel
    const hotelsWithDetails = await Promise.all(
      hotels.map(async (hotel: any) => {
        // Count rooms
        const [roomCountRows] = await pool.query(
          'SELECT COUNT(*) as count FROM rooms WHERE hotelId = ?',
          [hotel.id]
        ) as [RowDataPacket[], any];
        
        const roomCount = roomCountRows[0].count;
        
        // Parse images JSON if it exists
        let images = [];
        try {
          if (hotel.images) {
            images = typeof hotel.images === 'string' 
              ? JSON.parse(hotel.images)
              : hotel.images;
          }
        } catch (error) {
          console.error('Error parsing images JSON:', error);
        }
        
        return {
          ...hotel,
          images,
          isActive: hotel.isActive !== null ? Boolean(hotel.isActive) : true,
          // Parse status field properly
          status: hotel.status || 'ACTIVE',
          vendor: hotel.vendorId ? {
            id: hotel.vendorId,
            name: hotel.vendorName
          } : null,
          roomCount,
          // Ensure rating is a number
          rating: typeof hotel.rating === 'number' ? hotel.rating : 
                 (hotel.rating ? parseFloat(hotel.rating) : 0)
        };
      })
    );
    
    return {
      hotels: hotelsWithDetails,
      total: totalHotels,
      page,
      pageSize,
      totalPages: Math.ceil(totalHotels / pageSize),
    };
  }
  
  // Get a hotel by ID with all related data
  static async getHotelById(hotelId: string) {
    try {
      console.log(`Getting hotel with ID: ${hotelId}`);
      
      // First, get the hotel
      const [hotelResults] = await pool.query(
        `SELECT h.*, v.id as vendorId, u.id as userId, u.name as vendorName, u.email as vendorEmail
         FROM hotels h
         LEFT JOIN vendors v ON h.vendorId = v.id
         LEFT JOIN users u ON v.userId = u.id
         WHERE h.id = ?`,
        [hotelId]
      );
      
      if (!hotelResults || (hotelResults as any[]).length === 0) {
        console.log(`No hotel found with ID: ${hotelId}`);
        return null;
      }
      
      const hotel = (hotelResults as any[])[0];
      console.log(`Found hotel: ${hotel.name} (ID: ${hotel.id})`);
      
      // Parse images if they exist
      let parsedImages = [];
      try {
        if (hotel.images) {
          parsedImages = typeof hotel.images === 'string' 
            ? JSON.parse(hotel.images)
            : hotel.images;
            
          console.log(`Parsed ${parsedImages.length} images`);
        }
      } catch (error) {
        console.error('Error parsing hotel images JSON:', error);
        // Default to empty array on error
        parsedImages = [];
      }
      
      // Get hotel amenities
      const [amenityResults] = await pool.query(
        `SELECT a.*
         FROM hotel_amenities ha
         JOIN amenities a ON ha.amenityId = a.id
         WHERE ha.hotelId = ?`,
        [hotelId]
      );
      
      console.log(`Found ${(amenityResults as any[]).length} hotel amenities`);
      
      // Get rooms for this hotel - removed join with room_types table that doesn't exist
      const [roomResults] = await pool.query(
        `SELECT r.*
         FROM rooms r
         WHERE r.hotelId = ?`,
        [hotelId]
      );
      
      console.log(`Found ${(roomResults as any[]).length} rooms`);
      
      // Get room amenities for all rooms
      const roomIds = (roomResults as any[]).map((r: any) => r.id);
      let roomAmenities: any[] = [];
      
      if (roomIds.length > 0) {
        // Using parameterized queries with array is tricky for IN clauses
        // If there's only one room, we don't need IN
        let roomAmenityQuery = '';
        let roomAmenityParams = [];
        
        if (roomIds.length === 1) {
          roomAmenityQuery = `
            SELECT ra.roomId, a.*
            FROM room_amenities ra
            JOIN amenities a ON ra.amenityId = a.id
            WHERE ra.roomId = ?
          `;
          roomAmenityParams = [roomIds[0]];
        } else {
          // For multiple rooms, use a properly formatted IN clause
          const placeholders = roomIds.map(() => '?').join(',');
          roomAmenityQuery = `
            SELECT ra.roomId, a.*
            FROM room_amenities ra
            JOIN amenities a ON ra.amenityId = a.id
            WHERE ra.roomId IN (${placeholders})
          `;
          roomAmenityParams = roomIds;
        }
        
        const [roomAmenityResults] = await pool.query(
          roomAmenityQuery,
          roomAmenityParams
        );
        
        roomAmenities = roomAmenityResults as any[];
        console.log(`Found ${roomAmenities.length} room amenities`);
      }
      
      // Get booking count
      const [bookingCountResult] = await pool.query(
        `SELECT COUNT(*) as count FROM bookings WHERE hotelId = ?`,
        [hotelId]
      );
      
      const bookingCount = (bookingCountResult as any[])[0]?.count || 0;
      console.log(`Hotel has ${bookingCount} bookings`);
      
      // Format rooms with their amenities
      const formattedRooms = (roomResults as any[]).map((room: any) => {
        // Get amenities for this specific room
        const amenities = roomAmenities
          .filter((a: any) => a.roomId === room.id)
          .map((a: any) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            icon: a.icon,
            category: a.category
          }));
          
        // Parse room numbers if they exist
        let roomNumbers = [];
        try {
          if (room.roomNumbers) {
            roomNumbers = typeof room.roomNumbers === 'string'
              ? JSON.parse(room.roomNumbers)
              : room.roomNumbers;
          } else if (room.roomNumber) {
            roomNumbers = [room.roomNumber];
          }
        } catch (error) {
          console.error(`Error parsing roomNumbers for room ${room.id}:`, error);
          // Default to empty array on error
          roomNumbers = [];
        }
        
        return {
          id: room.id,
          name: room.name,
          description: room.description,
          status: room.status,
          type: room.type,
          capacity: room.capacity,
          pricePerNight: room.pricePerNight,
          roomNumbers: roomNumbers,
          roomNumber: room.roomNumber,
          roomTypeId: room.roomTypeId,
          roomTypeName: room.roomTypeName || '',  // Default value if room_types doesn't exist
          basePrice: room.basePrice ? parseFloat(room.basePrice) : 0,
          amenities: amenities,
          hotelId: room.hotelId
        };
      });
      
      // Format the hotel with all its related data
      const formattedHotel = {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        city: hotel.city,
        state: hotel.state,
        country: hotel.country,
        zipCode: hotel.zipCode,
        phone: hotel.phone,
        email: hotel.email,
        website: hotel.website,
        images: parsedImages,
        rating: parseFloat(hotel.rating) || 0,
        status: hotel.status || 'ACTIVE',
        isActive: hotel.isActive !== null ? Boolean(hotel.isActive) : true,
        createdAt: hotel.createdAt,
        updatedAt: hotel.updatedAt,
        vendor: hotel.vendorId ? {
          id: hotel.vendorId,
          user: {
            id: hotel.userId,
            name: hotel.vendorName,
            email: hotel.vendorEmail
          }
        } : null,
        amenities: (amenityResults as any[]).map((a: any) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          category: a.category
        })),
        rooms: formattedRooms,
        _count: {
          bookings: bookingCount
        }
      };
      
      console.log(`Successfully formatted hotel data for: ${hotel.name}`);
      
      return formattedHotel;
    } catch (error) {
      console.error('Error fetching hotel by ID:', error);
      throw new Error(`Failed to fetch hotel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Create a new hotel
  static async createHotel(data: HotelCreateInput) {
    // Validate required fields
    if (!data.name || !data.city || !data.country || !data.vendorId) {
      throw new Error('Missing required fields');
    }
    
    // Verify vendor exists
    const [vendorResult] = await pool.query(
      'SELECT id FROM vendors WHERE id = ?',
      [data.vendorId]
    );
    
    if (!(vendorResult as any[]).length) {
      throw new Error('Vendor not found');
    }
    
    // Process images array
    const imagesString = data.images ? JSON.stringify(data.images) : '[]';
    
    // Process configs
    const whitelabelConfigString = data.whitelabelConfig ? 
      JSON.stringify(data.whitelabelConfig) : null;
    
    // Generate UUID on the application side
    const hotelId = uuidv4();

    try {
      // Create the hotel first
      await pool.query(
        `INSERT INTO hotels (
          id, name, description, address, city, state, country, zipCode, 
          phone, email, website, images, rating, vendorId,
          whitelabelConfig
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          hotelId,
          data.name,
          data.description || '',
          data.address || '',
          data.city,
          data.state || '',
          data.country,
          data.zipCode || '',
          data.phone || '',
          data.email || '',
          data.website || '',
          imagesString,
          data.rating || 0,
          data.vendorId,
          whitelabelConfigString
        ]
      );
      
      // Add amenities if provided
      if (data.amenities && data.amenities.length > 0) {
        const filteredAmenities = data.amenities.filter(id => id !== null && id !== undefined);
        
        for (const amenityId of filteredAmenities) {
          // Check if amenity exists
          const [amenityExists] = await pool.query(
            'SELECT id FROM amenities WHERE id = ?',
            [amenityId]
          );
          
          if ((amenityExists as any[]).length) {
            await pool.query(
              'INSERT INTO hotel_amenities (id, hotelId, amenityId) VALUES (UUID(), ?, ?)',
              [hotelId, amenityId]
            );
          }
        }
      }
      
      // Return the new hotel with its ID
      return {
        id: hotelId,
        ...data,
        images: data.images || []
      };
    } catch (error) {
      console.error('Error creating hotel:', error);
      throw error;
    }
  }
  
  // Update an existing hotel
  static async updateHotel(hotelId: string, data: HotelUpdateInput) {
    console.log("Updating hotel with data:", {
      hotelId,
      ...data,
      amenities: data.amenities ? `${data.amenities.length} amenities` : undefined
    });
    
    // Check if hotel exists
    const [hotelRows] = await pool.query(
      'SELECT * FROM hotels WHERE id = ?',
      [hotelId]
    );
    
    if (!(hotelRows as any[]).length) {
      throw new Error('Hotel not found');
    }
    
    const hotel = (hotelRows as any[])[0];
    
    // Validate required fields if provided
    if ((data.name === '' || data.city === '' || data.country === '')) {
      throw new Error('Name, city, and country cannot be empty');
    }
    
    // If vendorId is changed, verify vendor exists
    if (data.vendorId && data.vendorId !== hotel.vendorId) {
      const [vendorRows] = await pool.query(
        'SELECT id FROM vendors WHERE id = ?',
        [data.vendorId]
      );
      
      if (!(vendorRows as any[]).length) {
        throw new Error('Vendor not found');
      }
    }
    
    // Process images and configs
    const updateFields = [];
    const updateValues = [];
    
    // Only update provided fields
    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(data.description);
    }
    if (data.address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(data.address);
    }
    if (data.city !== undefined) {
      updateFields.push('city = ?');
      updateValues.push(data.city);
    }
    if (data.state !== undefined) {
      updateFields.push('state = ?');
      updateValues.push(data.state);
    }
    if (data.country !== undefined) {
      updateFields.push('country = ?');
      updateValues.push(data.country);
    }
    if (data.zipCode !== undefined) {
      updateFields.push('zipCode = ?');
      updateValues.push(data.zipCode);
    }
    if (data.phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(data.phone);
    }
    if (data.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(data.email);
    }
    if (data.website !== undefined) {
      updateFields.push('website = ?');
      updateValues.push(data.website);
    }
    if (data.rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(data.rating);
    }
    if (data.vendorId !== undefined) {
      updateFields.push('vendorId = ?');
      updateValues.push(data.vendorId);
    }
    if (data.isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(data.isActive);
    }
    
    // Process images and configs if provided
    if (data.images) {
      updateFields.push('images = ?');
      updateValues.push(JSON.stringify(data.images));
    }
    
    if (data.whitelabelConfig) {
      // Check if the field exists in the database first
      try {
        // Try a simple query to see if the column exists
        await pool.query(
          'SELECT whitelabelConfig FROM hotels LIMIT 1'
        );
        // If it succeeds, add the field to update
        updateFields.push('whitelabelConfig = ?');
        updateValues.push(JSON.stringify(data.whitelabelConfig));
      } catch (err: any) {
        // Column doesn't exist, log a warning
        console.warn('Column whitelabelConfig does not exist in hotels table. Skipping this field.');
        // Don't add this field to the update
      }
    }
    
    // Get connection for transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Only proceed with update if there are fields to update
      if (updateFields.length > 0) {
        // Update the hotel details
        await connection.query(
          `UPDATE hotels 
           SET ${updateFields.join(', ')}, updatedAt = NOW() 
           WHERE id = ?`,
          [...updateValues, hotelId]
        );
      }
      
      // If amenities were provided, handle them separately
      if (data.amenities !== undefined) {
        try {
          // Filter out any null/undefined values
          const filteredAmenities = data.amenities.filter(id => id !== null && id !== undefined);
          
          // Delete all existing amenity connections for this hotel
          await connection.query(
            'DELETE FROM hotel_amenities WHERE hotelId = ?',
            [hotelId]
          );
          
          // Add the new amenities one by one
          for (const amenityId of filteredAmenities) {
            // Verify the amenity exists
            const [amenityRows] = await connection.query(
              'SELECT id FROM amenities WHERE id = ?',
              [amenityId]
            );
            
            if ((amenityRows as any[]).length) {
              // Use UUID() to generate the primary key, same as in createHotel
              await connection.query(
                'INSERT INTO hotel_amenities (id, hotelId, amenityId) VALUES (UUID(), ?, ?)',
                [hotelId, amenityId]
              );
            }
          }
        } catch (error) {
          console.error('Error updating hotel amenities:', error);
          throw error;
        }
      }
      
      await connection.commit();
      
      // Fetch updated hotel with all data
      return await this.getHotelById(hotelId);
    } catch (error) {
      // Rollback on any error
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error during transaction rollback:', rollbackError);
      }
      console.error('Error updating hotel:', error);
      throw error;
    } finally {
      // Fix connection leak by releasing the connection
      connection.release();
    }
  }
  
  // Delete a hotel
  static async deleteHotel(hotelId: string) {
    try {
      // Check if hotel exists
      const [hotelRows] = await pool.query(
        'SELECT * FROM hotels WHERE id = ?',
        [hotelId]
      );
      
      if (!(hotelRows as any[]).length) {
        throw new Error('Hotel not found');
      }
      
      // Use MySQL to delete hotel and related data
      // 1. Delete hotel amenities
      await pool.query(
        'DELETE FROM hotel_amenities WHERE hotelId = ?',
        [hotelId]
      );
      
      // 2. Get all rooms for this hotel
      const [roomRows] = await pool.query(
        'SELECT id FROM rooms WHERE hotelId = ?',
        [hotelId]
      );
      
      // 3. Delete room related data for each room
      for (const room of roomRows as any[]) {
        // Delete room amenities
        await pool.query(
          'DELETE FROM room_amenities WHERE roomId = ?',
          [room.id]
        );
        
        // Delete room bookings through room_units
        await pool.query(
          `DELETE b FROM bookings b
           JOIN room_units ru ON b.roomUnitId = ru.id
           WHERE ru.roomId = ?`,
          [room.id]
        );
      }
      
      // 4. Delete all rooms for this hotel
      await pool.query(
        'DELETE FROM rooms WHERE hotelId = ?',
        [hotelId]
      );
      
      // 5. Delete any remaining hotel bookings
      await pool.query(
        'DELETE FROM bookings WHERE hotelId = ?',
        [hotelId]
      );
      
      // 6. Finally, delete the hotel
      await pool.query(
        'DELETE FROM hotels WHERE id = ?',
        [hotelId]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting hotel:', error);
      throw error;
    }
  }
  
  // Get popular hotels for the frontend
  static async getPopularHotels(limit = 6) {
    try {
      // Get hotels ordered by rating
      const [hotelRows] = await pool.query(
        `SELECT h.*
         FROM hotels h
         ORDER BY h.rating DESC
         LIMIT ?`,
        [limit]
      );
      
      // Process each hotel
      const popularHotels = await Promise.all((hotelRows as any[]).map(async (hotel) => {
        // Get the cheapest room for this hotel
        const [roomRows] = await pool.query(
          `SELECT r.* 
           FROM rooms r
           WHERE r.hotelId = ? AND r.status = 'available'
           ORDER BY r.pricePerNight ASC
           LIMIT 1`,
          [hotel.id]
        );
        
        const cheapestRoom = (roomRows as any[])[0];
        
        // Get amenities for this hotel
        const [amenityRows] = await pool.query(
          `SELECT a.*
           FROM hotel_amenities ha
           JOIN amenities a ON ha.amenityId = a.id
           WHERE ha.hotelId = ?
           LIMIT 5`,
          [hotel.id]
        );
        
        // Count bookings
        const [bookingCountRows] = await pool.query(
          `SELECT COUNT(*) as count FROM bookings WHERE hotelId = ?`,
          [hotel.id]
        );
        
        const bookingCount = (bookingCountRows as any[])[0].count;
        
        // Parse images
        let images = [];
        try {
          if (hotel.images) {
            images = typeof hotel.images === 'string' 
              ? JSON.parse(hotel.images)
              : hotel.images;
          }
        } catch (error) {
          console.error('Error parsing hotel images:', error);
        }
        
        return {
          id: hotel.id,
          name: hotel.name,
          description: hotel.description,
          city: hotel.city,
          state: hotel.state,
          country: hotel.country,
          images: images,
          rating: hotel.rating,
          startingPrice: cheapestRoom?.pricePerNight || null,
          bookingCount: bookingCount,
          amenities: amenityRows || []
        };
      }));
      
      return popularHotels;
    } catch (error) {
      console.error('Error fetching popular hotels:', error);
      return [];
    }
  }
  
  // Get all amenities
  static async getAmenities(category?: string) {
    try {
      let query = 'SELECT * FROM amenities';
      const params = [];
      
      if (category) {
        query += ' WHERE category = ?';
        params.push(category);
      }
      
      query += ' ORDER BY name ASC';
      
      const [rows] = await pool.query(query, params);
      
      return rows;
    } catch (error) {
      console.error('Error fetching amenities:', error);
      return [];
    }
  }
}