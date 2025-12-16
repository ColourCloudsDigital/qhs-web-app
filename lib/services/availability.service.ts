import pool from '@/lib/db';

export const availabilityService = {
  /**
   * Check if a room is available for a specific date range
   */
  async checkRoomAvailability({
    roomId,
    checkInDate,
    checkOutDate,
  }: {
    roomId: string;
    checkInDate: Date;
    checkOutDate: Date;
  }): Promise<boolean> {
    try {
      // Validate dates
      if (checkInDate >= checkOutDate) {
        throw new Error('Check-in date must be before check-out date');
      }

      // First, check if room exists and is available for booking
      const [roomResults] = await pool.query(
        'SELECT * FROM rooms WHERE id = ? AND status = ?',
        [roomId, 'available']
      );

      const rooms = roomResults as any[];
      if (rooms.length === 0) {
        return false;
      }

      // Check room units for availability
      const [roomUnits] = await pool.query(
        'SELECT * FROM room_units WHERE roomId = ? AND status = ?', 
        [roomId, 'available']
      );

      if ((roomUnits as any[]).length === 0) {
        return false; // No available room units for this room type
      }

      // Check for conflicting bookings
      const [bookings] = await pool.query(
        `SELECT * FROM bookings 
         WHERE roomId = ? 
         AND (
           (checkInDate >= ? AND checkInDate < ?) OR
           (checkOutDate > ? AND checkOutDate <= ?) OR
           (checkInDate <= ? AND checkOutDate >= ?)
         )
         AND status IN ('CONFIRMED', 'PENDING', 'CHECKED_IN')`,
        [
          roomId,
          checkInDate.toISOString().split('T')[0],
          checkOutDate.toISOString().split('T')[0],
          checkInDate.toISOString().split('T')[0],
          checkOutDate.toISOString().split('T')[0],
          checkInDate.toISOString().split('T')[0],
          checkOutDate.toISOString().split('T')[0],
        ]
      );

      const conflictingBookings = bookings as any[];
      
      // If there are as many bookings as there are room units, then no units are available
      return conflictingBookings.length < (roomUnits as any[]).length;
    } catch (error) {
      console.error('Error checking room availability:', error);
      throw error;
    }
  },

  /**
   * Get availability for all rooms in a hotel for a given date range
   */
  async getHotelAvailability({
    hotelId,
    checkInDate,
    checkOutDate,
  }: {
    hotelId: string;
    checkInDate: Date;
    checkOutDate: Date;
  }) {
    try {
      // Validate dates
      if (checkInDate >= checkOutDate) {
        throw new Error('Check-in date must be before check-out date');
      }

      // Get all rooms in the hotel
      const [roomResults] = await pool.query(
        'SELECT * FROM rooms WHERE hotelId = ? AND status = ?',
        [hotelId, 'available']
      );

      const rooms = roomResults as any[];
      const availability = [];

      // Check availability for each room
      for (const room of rooms) {
        // Get room units
        const [roomUnits] = await pool.query(
          'SELECT * FROM room_units WHERE roomId = ? AND status = ?',
          [room.id, 'available']
        );
        
        // Get conflicting bookings
        const [bookings] = await pool.query(
          `SELECT * FROM bookings 
           WHERE roomId = ? 
           AND (
             (checkInDate >= ? AND checkInDate < ?) OR
             (checkOutDate > ? AND checkOutDate <= ?) OR
             (checkInDate <= ? AND checkOutDate >= ?)
           )
           AND status IN ('CONFIRMED', 'PENDING', 'CHECKED_IN')`,
          [
            room.id,
            checkInDate.toISOString().split('T')[0],
            checkOutDate.toISOString().split('T')[0],
            checkInDate.toISOString().split('T')[0],
            checkOutDate.toISOString().split('T')[0],
            checkInDate.toISOString().split('T')[0],
            checkOutDate.toISOString().split('T')[0],
          ]
        );

        const conflictingBookings = bookings as any[];
        const roomUnitsList = roomUnits as any[];
        
        // Room is available if there are fewer bookings than room units
        const isAvailable = roomUnitsList.length > 0 && conflictingBookings.length < roomUnitsList.length;
        
        // Parse images string to JSON if it exists
        let roomImages = [];
        if (room.images) {
          try {
            roomImages = typeof room.images === 'string' ? JSON.parse(room.images) : room.images;
          } catch (e) {
            console.error('Error parsing room images:', e);
          }
        }
        
        availability.push({
          roomId: room.id,
          name: room.name,
          type: room.type,
          capacity: room.capacity,
          pricePerNight: room.pricePerNight,
          discountedPrice: room.discountedPrice,
          isAvailable,
          availableUnits: Math.max(0, roomUnitsList.length - conflictingBookings.length),
          images: roomImages
        });
      }

      return {
        hotelId,
        checkInDate,
        checkOutDate,
        rooms: availability,
        availableRoomCount: availability.filter((room) => room.isAvailable).length,
        totalRoomCount: availability.length,
      };
    } catch (error) {
      console.error('Error getting hotel availability:', error);
      throw error;
    }
  },

  /**
   * Calculate total price for a booking
   */
  async calculateBookingPrice({
    roomId,
    checkInDate,
    checkOutDate,
  }: {
    roomId: string;
    checkInDate: Date;
    checkOutDate: Date;
  }) {
    try {
      // Validate dates
      if (checkInDate >= checkOutDate) {
        throw new Error('Check-in date must be before check-out date');
      }

      // Get room details
      const [roomResults] = await pool.query(
        'SELECT pricePerNight, discountedPrice FROM rooms WHERE id = ?',
        [roomId]
      );

      const rooms = roomResults as any[];
      if (rooms.length === 0) {
        throw new Error('Room not found');
      }

      const room = rooms[0];

      // Calculate number of nights
      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Use discounted price if available, otherwise use regular price
      const pricePerNight = room.discountedPrice !== null ? room.discountedPrice : room.pricePerNight;

      // Calculate total price
      const totalPrice = pricePerNight * nights;

      return {
        roomId,
        checkInDate,
        checkOutDate,
        nights,
        pricePerNight,
        totalPrice,
      };
    } catch (error) {
      console.error('Error calculating booking price:', error);
      throw error;
    }
  }
};