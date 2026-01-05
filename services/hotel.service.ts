import pool from '@/lib/db';

// Define our own Amenity interface
interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HotelFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  capacity?: number;
}

export async function getHotels(filters?: HotelFilters, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  let whereClauses: string[] = ["h.isActive = TRUE"];
  let joinClauses: string[] = [];
  let params: (string | number | string[])[] = [];

  // Build WHERE clauses and params based on filters
  if (filters) {
    if (filters.location) {
      whereClauses.push('(h.city LIKE ? OR h.state LIKE ? OR h.country LIKE ?)');
      const locationParam = `%${filters.location}%`;
      params.push(locationParam, locationParam, locationParam);
    }

    if (filters.minPrice || filters.maxPrice) {
      joinClauses.push('LEFT JOIN rooms r_price ON r_price.hotelId = h.id'); // Use alias for clarity
      let roomPriceConditions: string[] = [];
      if (filters.minPrice) {
        roomPriceConditions.push('r_price.pricePerNight >= ?');
        params.push(filters.minPrice);
      }
      if (filters.maxPrice) {
        roomPriceConditions.push('r_price.pricePerNight <= ?');
        params.push(filters.maxPrice);
      }
       // Need GROUP BY h.id later if we join rooms this way for filtering
       // It might be better to use a subquery or EXISTS clause
       // Using EXISTS for potentially better performance:
       let priceSubqueryConditions: string[] = [];
       if (filters.minPrice) priceSubqueryConditions.push('r_sub.pricePerNight >= ?');
       if (filters.maxPrice) priceSubqueryConditions.push('r_sub.pricePerNight <= ?');
       whereClauses.push(`EXISTS (SELECT 1 FROM rooms r_sub WHERE r_sub.hotelId = h.id AND ${priceSubqueryConditions.join(' AND ')})`);
       if (filters.minPrice) params.push(filters.minPrice);
       if (filters.maxPrice) params.push(filters.maxPrice);
       joinClauses = joinClauses.filter(j => !j.startsWith('LEFT JOIN rooms r_price')); // Remove the direct join if using EXISTS

    }

    if (filters.amenities && filters.amenities.length > 0) {
        // Use EXISTS for amenities
        whereClauses.push(`EXISTS (
            SELECT 1
            FROM hotel_amenities ha
            JOIN amenities a ON ha.amenityId = a.id
            WHERE ha.hotelId = h.id AND a.name IN (?)
        )`);
        params.push(filters.amenities);
    }

    if (filters.capacity) {
       // Use EXISTS for capacity
       whereClauses.push(`EXISTS (
           SELECT 1
           FROM rooms r_cap
           WHERE r_cap.hotelId = h.id AND r_cap.capacity >= ?
       )`);
       params.push(filters.capacity);
    }
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const joinString = joinClauses.join(' '); // No joins needed currently with EXISTS approach

  // Base query for hotels
  const hotelsQuery = `
    SELECT
      h.id, h.name, h.description, h.address, h.city, h.state, h.country,
      h.images, h.rating, h.createdAt
      -- Add other necessary fields
    FROM hotels h
    ${joinString}
    ${whereString}
    ORDER BY h.createdAt DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  // Count query
  const countQuery = `
    SELECT COUNT(DISTINCT h.id) as totalCount
    FROM hotels h
    ${joinString}
    ${whereString}
  `;
  // Remove LIMIT/OFFSET params for count
  const countParams = params.slice(0, -2);


  try {
    // Execute queries
    const [hotelRows]: [any[], any] = await pool.query(hotelsQuery, params);
    const [countRows]: [any[], any] = await pool.query(countQuery, countParams);

    const totalCount = countRows[0].totalCount;

     // Fetch related data (cheapest room, amenities, room count) separately for simplicity
     const hotelIds = hotelRows.map((h: any) => h.id);
     let cheapestRoomsData: any = {};
     let amenitiesData: any = {};
     let roomCountsData: any = {};

     if (hotelIds.length > 0) {
        // Temporarily remove price queries since the column doesn't exist
        // Just get room counts for now
        const roomCountQuery = `
            SELECT hotelId, COUNT(*) as roomCount
            FROM rooms
            WHERE hotelId IN (?)
            GROUP BY hotelId
        `;
        const [roomCounts]: [any[], any] = await pool.query(roomCountQuery, [hotelIds]);
        roomCountsData = roomCounts.reduce((acc, count) => {
            acc[count.hotelId] = count.roomCount;
            return acc;
        }, {});

        // Get amenities for each hotel
        const amenitiesQuery = `
          SELECT ha.hotelId, a.id, a.name, a.description, a.icon, a.type
          FROM hotel_amenities ha
          JOIN amenities a ON ha.amenityId = a.id
          WHERE ha.hotelId IN (?)
        `;
        const [amenities]: [any[], any] = await pool.query(amenitiesQuery, [hotelIds]);
        amenitiesData = amenities.reduce((acc, amenity) => {
            if (!acc[amenity.hotelId]) {
                acc[amenity.hotelId] = [];
            }
            acc[amenity.hotelId].push({
                id: amenity.id,
                name: amenity.name,
                description: amenity.description,
                icon: amenity.icon,
                type: amenity.type
            });
            return acc;
        }, {});
     }

    // Transform hotel data
    const transformedHotels = hotelRows.map((hotel: any) => {
      const amenities = amenitiesData[hotel.id] || [];
      const roomCount = roomCountsData[hotel.id] || 0;

      // Assuming 'images' is stored as a JSON string in MySQL
      let parsedImages = [];
      try {
        parsedImages = hotel.images ? JSON.parse(hotel.images) : [];
      } catch (e) {
        console.error(`Failed to parse images for hotel ${hotel.id}:`, hotel.images);
        // Keep images as potentially null or an empty array on error
      }

      return {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        city: hotel.city,
        state: hotel.state,
        country: hotel.country,
        images: parsedImages, // Use parsed images
        rating: hotel.rating ? parseFloat(hotel.rating) : null,
        startingPrice: null, // Set to null until we know the correct price column
        totalRooms: roomCount,
        amenities: amenities,
        createdAt: hotel.createdAt,
      };
    });

    return {
      hotels: transformedHotels,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching hotels:', error);
    // Provide more detailed error reporting
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    // Re-throw with a helpful message that indicates the specific issue
    throw new Error(`Failed to fetch hotels: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getHotelById(id: string): Promise<any> {
  try {
    // Ensure id is a valid format
    const normalizedId = id?.trim();
    
    if (!normalizedId) {
      throw new Error('Hotel ID is required');
    }
    
    // Query to retrieve the hotel
    const [hotelResults] = await pool.query(
      `SELECT * FROM hotels WHERE id = ?`,
      [normalizedId]
    );
    
    const hotelData = (hotelResults as any[])[0];
    
    if (!hotelData) {
      return null;
    }
    
    // Parse JSON fields from the database
    let parsedImages = [];
    try {
      parsedImages = hotelData.images ? JSON.parse(hotelData.images) : [];
    } catch (e) {
      console.error(`Failed to parse images for hotel ${hotelData.id}:`, hotelData.images);
      parsedImages = [];
    }
    
    // Parse whitelabelConfig if it exists
    let parsedWhitelabelConfig = null;
    try {
      parsedWhitelabelConfig = hotelData.whitelabelConfig ? JSON.parse(hotelData.whitelabelConfig) : null;
    } catch (e) {
      console.error(`Failed to parse whitelabelConfig for hotel ${hotelData.id}:`, hotelData.whitelabelConfig);
    }
    
    // Create a hotel object with formatted data
    const hotel = {
      ...hotelData,
      images: parsedImages,
      whitelabelConfig: parsedWhitelabelConfig,
      amenities: [],
      rooms: []
    };
    
    // Get rooms for this hotel
    const [roomResults] = await pool.query(
      `SELECT 
         r.*,
         (SELECT GROUP_CONCAT(ra.amenityId) FROM room_amenities ra WHERE ra.roomId = r.id) as amenityIds,
         (SELECT COUNT(*) FROM room_units ru WHERE ru.roomId = r.id) as totalUnits,
         (SELECT COUNT(*) FROM room_units ru WHERE ru.roomId = r.id AND ru.status = 'available') as availableUnits
       FROM rooms r
       WHERE r.hotelId = ?`,
      [hotel.id]
    );
    
    // Format room data
    let rooms: any[] = [];
    
    if (roomResults && (roomResults as any[]).length > 0) {
      rooms = (roomResults as any[]).map((room: any) => {
        // Parse JSON fields
        let parsedRoomImages = [];
        let parsedRoomNumbers = [];
        let amenities = [];
        
        try {
          if (room.images) {
            parsedRoomImages = JSON.parse(room.images);
          }
        } catch (e) {
          parsedRoomImages = [];
        }
        
        try {
          if (room.roomNumbers) {
            parsedRoomNumbers = JSON.parse(room.roomNumbers);
          }
        } catch (e) {
          parsedRoomNumbers = [];
        }
        
        try {
          if (room.amenityIds) {
            amenities = room.amenityIds.split(',').map((id: string) => parseInt(id));
          }
        } catch (e) {
          amenities = [];
        }
        
        return {
          ...room,
          images: parsedRoomImages,
          roomNumbers: parsedRoomNumbers,
          amenities
        };
      });
    }
    
    // Get amenities for this hotel
    const [amenityResults] = await pool.query(
      `SELECT ha.*, a.name, a.icon, a.type
      FROM hotel_amenities ha
      JOIN amenities a ON ha.amenityId = a.id
      WHERE ha.hotelId = ?`,
      [hotel.id]
    );
    
    const hotelAmenities = amenityResults as any[];
    
    // Assemble the complete hotel object
    return {
      ...hotel,
      rooms,
      amenities: hotelAmenities.map((amenity) => ({
        ...amenity,
        category: amenity.type // Map 'type' to 'category' for backwards compatibility
      })),
    };
    
  } catch (error) {
    console.error('Error fetching hotel by ID:', error);
    throw error;
  }
}

export async function getPopularHotels(limit = 6) {
  // Fetch hotels ordered by rating
  const hotelsQuery = `
    SELECT
      h.id, h.name, h.description, h.city, h.state, h.country,
      h.images, h.rating
      -- Add other fields as needed
    FROM hotels h
    WHERE h.isActive = TRUE
    ORDER BY h.rating DESC, h.createdAt DESC -- Added createdAt as secondary sort
    LIMIT ?
  `;

  try {
    const [hotels]: [any[], any] = await pool.query(hotelsQuery, [limit]);

    const hotelIds = hotels.map((h: any) => h.id);
    let amenitiesData: any = {};
    let bookingCountsData: any = {};

    if (hotelIds.length > 0) {
      // Fetch top 5 amenities for each hotel (limit per hotel is tricky in pure SQL, often done in code)
      const amenitiesQuery = `
          SELECT ha.hotelId, a.id, a.name, a.description, a.icon, a.type
          FROM hotel_amenities ha
          JOIN amenities a ON ha.amenityId = a.id
          WHERE ha.hotelId IN (?)
          ORDER BY ha.hotelId, a.name -- Consistent ordering helps
      `;
      const [allAmenities]: [any[], any] = await pool.query(amenitiesQuery, [hotelIds]);
      amenitiesData = allAmenities.reduce((acc: any, amenity: any) => {
          if (!acc[amenity.hotelId]) {
              acc[amenity.hotelId] = [];
          }
          // Apply limit in code
          if (acc[amenity.hotelId].length < 5) {
            acc[amenity.hotelId].push({
                id: amenity.id,
                name: amenity.name,
                description: amenity.description,
                icon: amenity.icon,
                type: amenity.type
            });
          }
          return acc;
      }, {});

      // Fetch booking counts for each hotel
      const bookingCountQuery = `
          SELECT hotelId, COUNT(*) as bookingCount
          FROM bookings
          WHERE hotelId IN (?)
          GROUP BY hotelId
      `;
      const [bookingCounts]: [any[], any] = await pool.query(bookingCountQuery, [hotelIds]);
      bookingCountsData = bookingCounts.reduce((acc: any, count: any) => {
          acc[count.hotelId] = count.bookingCount;
          return acc;
      }, {});
    }

    // Transform results
    return hotels.map((hotel: any) => {
      const amenities = amenitiesData[hotel.id] || [];
      const bookingCount = bookingCountsData[hotel.id] || 0;

      let parsedImages = [];
      try {
        parsedImages = hotel.images ? JSON.parse(hotel.images) : [];
      } catch(e) {
        console.error(`Failed to parse images for popular hotel ${hotel.id}:`, hotel.images);
      }

      return {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        city: hotel.city,
        state: hotel.state,
        country: hotel.country,
        images: parsedImages,
        rating: hotel.rating ? parseFloat(hotel.rating) : null,
        startingPrice: null, // Set to null until we know the correct price column
        bookingCount: bookingCount,
        amenities: amenities, // Already limited to 5 in the reduce step
      };
    });

  } catch (error) {
    console.error('Error fetching popular hotels:', error);
    throw new Error('Failed to fetch popular hotels');
  }
}

export async function getAmenities() {
  const query = `
    SELECT id, name, description, icon, type, createdAt, updatedAt
    FROM amenities
    ORDER BY name ASC
  `;

  try {
    const [amenities]: [any[], any] = await pool.query(query);
    return amenities.map((amenity: any) => ({
      ...amenity,
      category: amenity.type // Map 'type' to 'category' for backwards compatibility
    }));
  } catch (error) {
    console.error('Error fetching amenities:', error);
    throw new Error('Failed to fetch amenities');
  }
}