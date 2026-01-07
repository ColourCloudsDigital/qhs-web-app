import pool from '@/lib/db';

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

  let whereClauses: string[] = ['h.isActive = TRUE'];
  let params: (string | number | string[])[] = [];

  
  if (filters?.location) {
    whereClauses.push('(h.city LIKE ? OR h.state LIKE ? OR h.country LIKE ?)');
    const locationParam = `%${filters.location}%`;
    params.push(locationParam, locationParam, locationParam);
  }

  if (filters?.amenities?.length) {
    whereClauses.push(`
      EXISTS (
        SELECT 1
        FROM hotel_amenities ha
        JOIN amenities a ON ha.amenityId = a.id
        WHERE ha.hotelId = h.id
        AND a.name IN (?)
      )
    `);
    params.push(filters.amenities);
  }

  if (filters?.capacity) {
    whereClauses.push(`
      EXISTS (
        SELECT 1
        FROM rooms r_cap
        JOIN room_units ru_cap ON ru_cap.roomId = r_cap.id
        WHERE r_cap.hotelId = h.id
        AND r_cap.status = 'available'
        AND ru_cap.status = 'available'
        AND r_cap.capacity >= ?
      )
    `);
    params.push(filters.capacity);
  }

  const whereString = `WHERE ${whereClauses.join(' AND ')}`;

  const hotelsQuery = `
    SELECT
      h.id,
      h.name,
      h.description,
      h.address,
      h.city,
      h.state,
      h.country,
      h.images,
      h.rating,
      h.createdAt,

      COALESCE(rs.room_count, 0) AS room_count,
      COALESCE(rs.total_capacity, 0) AS total_capacity,
      COALESCE(rs.hasAvailableRooms, 0) AS hasAvailableRooms

    FROM hotels h

    LEFT JOIN (
      SELECT
        r.hotelId,

        COUNT(DISTINCT r.id) AS room_count,

        SUM(
          CASE 
            WHEN ru.status = 'available' THEN 1
            ELSE 0
          END
        ) AS total_capacity,

        CASE
          WHEN SUM(
            CASE 
              WHEN ru.status = 'available' THEN 1
              ELSE 0
            END
          ) > 0 THEN 1 ELSE 0
        END AS hasAvailableRooms

      FROM rooms r
      JOIN room_units ru ON ru.roomId = r.id
      WHERE r.status = 'available'
      GROUP BY r.hotelId
    ) rs ON rs.hotelId = h.id

    ${whereString}
    ORDER BY h.createdAt DESC
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

 
  const countQuery = `
    SELECT COUNT(DISTINCT h.id) AS totalCount
    FROM hotels h
    ${whereString}
  `;
  const countParams = params.slice(0, -2);

  try {
    const [hotelRows]: [any[], any] = await pool.query(hotelsQuery, params);
    const [countRows]: [any[], any] = await pool.query(countQuery, countParams);

    const totalCount = countRows[0]?.totalCount || 0;
    const hotelIds = hotelRows.map(h => h.id);

    let amenitiesData: Record<string, Amenity[]> = {};

    if (hotelIds.length) {
      const [amenities]: [any[], any] = await pool.query(
        `
          SELECT ha.hotelId, a.id, a.name, a.description, a.icon, a.type
          FROM hotel_amenities ha
          JOIN amenities a ON ha.amenityId = a.id
          WHERE ha.hotelId IN (?)
        `,
        [hotelIds]
      );

      amenitiesData = amenities.reduce((acc: any, amenity: any) => {
        acc[amenity.hotelId] ??= [];
        acc[amenity.hotelId].push({
          id: amenity.id,
          name: amenity.name,
          description: amenity.description,
          icon: amenity.icon,
          type: amenity.type,
        });
        return acc;
      }, {});
    }

    const hotels = hotelRows.map((hotel: any) => {
      let images: string[] = [];

      try {
        images = hotel.images ? JSON.parse(hotel.images) : [];
      } catch {
        images = [];
      }

      return {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        city: hotel.city,
        state: hotel.state,
        country: hotel.country,
        images,
        rating: hotel.rating ? Number(hotel.rating) : null,

        room_count: hotel.room_count,
        total_capacity: hotel.total_capacity,
        hasAvailableRooms: Boolean(hotel.hasAvailableRooms),

        amenities: amenitiesData[hotel.id] || [],
        createdAt: hotel.createdAt,
      };
    });

    return {
      hotels,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching hotels:', error);
    throw new Error(
      `Failed to fetch hotels: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function getHotelById(id: string): Promise<any> {
  try {
    // Normalize ID - handle both string and number IDs
    const normalizedId = !isNaN(Number(id)) ? Number(id).toString() : id;

    // Query to retrieve the hotel
    const [hotelResults]: [any[], any] = await pool.query(
      `SELECT * FROM hotels WHERE id = ? AND isActive = 1`,
      [normalizedId]
    );

    if (hotelResults.length === 0) {
      return null;
    }

    const hotel = hotelResults[0];

    // Parse images
    let images: string[] = [];
    try {
      images = hotel.images ? JSON.parse(hotel.images) : [];
    } catch {
      images = [];
    }

    // Fetch rooms with availability info
    const [roomResults]: [any[], any] = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.type,
        r.capacity,
        r.pricePerNight,
        r.status,
        COUNT(ru.id) as totalUnits,
        COUNT(CASE WHEN ru.status = 'available' THEN 1 END) as availableUnits
      FROM rooms r
      LEFT JOIN room_units ru ON r.id = ru.roomId
      WHERE r.hotelId = ? AND r.status = 'available'
      GROUP BY r.id, r.name, r.type, r.capacity, r.pricePerNight, r.status
      ORDER BY r.name
    `, [hotel.id]);

    // Fetch amenities for each room
    const roomsWithAmenities = await Promise.all(
      roomResults.map(async (room: any) => {
        try {
          const [amenityRows]: [any[], any] = await pool.query(
            `SELECT
              a.id,
              a.name,
              a.description,
              a.icon
            FROM room_amenities ra
            JOIN amenities a ON ra.amenityId = a.id
            WHERE ra.roomId = ?`,
            [room.id]
          );

          return {
            id: room.id,
            name: room.name,
            type: room.type,
            capacity: room.capacity,
            pricePerNight: room.pricePerNight,
            discountedPrice: null, // Can be calculated if needed
            availableUnits: room.availableUnits,
            totalUnits: room.totalUnits,
            status: room.status,
            amenities: amenityRows || []
          };
        } catch (amenityError) {
          console.warn('Failed to load amenities for room:', room.id, amenityError);
          return {
            id: room.id,
            name: room.name,
            type: room.type,
            capacity: room.capacity,
            pricePerNight: room.pricePerNight,
            discountedPrice: null,
            availableUnits: room.availableUnits,
            totalUnits: room.totalUnits,
            status: room.status,
            amenities: []
          };
        }
      })
    );

    // Fetch hotel amenities
    const [hotelAmenityRows]: [any[], any] = await pool.query(
      `SELECT
        a.id,
        a.name,
        a.description,
        a.icon,
        a.type
      FROM hotel_amenities ha
      JOIN amenities a ON ha.amenityId = a.id
      WHERE ha.hotelId = ?`,
      [hotel.id]
    );

    // Calculate room summary
    const roomCount = roomsWithAmenities.length;
    const totalCapacity = roomsWithAmenities.reduce((sum, room) => sum + room.capacity, 0);
    const availableRoomCount = roomsWithAmenities.filter(room => room.availableUnits > 0).length;

    return {
      id: hotel.id,
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      state: hotel.state,
      country: hotel.country,
      images,
      rating: hotel.rating ? Number(hotel.rating) : null,
      room_count: availableRoomCount,
      total_capacity: totalCapacity,
      rooms: roomsWithAmenities,
      amenities: hotelAmenityRows || [],
      createdAt: hotel.createdAt
    };

  } catch (error) {
    console.error('Error fetching hotel by ID:', error);
    throw new Error(
      `Failed to fetch hotel: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
