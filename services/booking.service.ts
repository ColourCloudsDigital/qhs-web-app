import pool from '@/lib/db';

export const bookingService = {
  /**
   * Get all bookings for a vendor with pagination, filtering, and sorting
   */
  async getVendorBookings({
    vendorId,
    page = 1,
    limit = 10,
    status,
    search,
    checkInDate,
    checkOutDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    hotelId,
  }: {
    vendorId: string;
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    checkInDate?: Date;
    checkOutDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    hotelId?: string;
  }) {
    console.log('Fetching bookings for vendor:', vendorId);
    
    // Start building the query - using LEFT JOIN to include bookings without user accounts (guest bookings)
    let query = `
      SELECT 
        b.id, b.hotelId, b.roomId, b.customerId, b.checkInDate, b.checkOutDate, 
        b.numberOfGuests, b.totalAmount, b.status, b.paymentStatus, b.specialRequests, 
        b.createdAt, b.updatedAt,
        h.name as hotelName,
        r.name as roomName, r.type as roomType,
        c.firstName as customerFirstName, c.lastName as customerLastName, c.phone as customerPhone,
        u.name as customerName, u.email as customerEmail
      FROM bookings b
      JOIN hotels h ON b.hotelId = h.id
      JOIN rooms r ON b.roomId = r.id
      JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      WHERE h.vendorId = ?
    `;
    
    // Parameters for the query
    const queryParams: any[] = [vendorId];
    
    // Add filters
    if (status) {
      query += ' AND b.status = ?';
      queryParams.push(status);
    }
    
    if (hotelId) {
      query += ' AND b.hotelId = ?';
      queryParams.push(hotelId);
    }
    
    if (checkInDate) {
      query += ' AND b.checkInDate >= ?';
      queryParams.push(checkInDate.toISOString().split('T')[0]);
    }
    
    if (checkOutDate) {
      query += ' AND b.checkOutDate <= ?';
      queryParams.push(checkOutDate.toISOString().split('T')[0]);
    }
    
    // Add search functionality (including firstName and lastName from customers table)
    if (search) {
      query += ` AND (
        COALESCE(u.name, '') LIKE ? OR 
        COALESCE(u.email, '') LIKE ? OR 
        COALESCE(c.firstName, '') LIKE ? OR 
        COALESCE(c.lastName, '') LIKE ? OR 
        COALESCE(c.phone, '') LIKE ? OR 
        h.name LIKE ? OR 
        r.name LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // Add count query for pagination
    const countQuery = query.replace(/SELECT [\s\S]*?FROM/i, 'SELECT COUNT(*) as count FROM');
    
    // Add sorting
    const validSortColumns = ['createdAt', 'checkInDate', 'checkOutDate', 'status', 'paymentStatus', 'totalAmount'];
    const actualSortBy = validSortColumns.includes(sortBy) ? `b.${sortBy}` : 'b.createdAt';
    const actualSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${actualSortBy} ${actualSortOrder}`;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    try {
      // Execute count query for pagination
      const [countResults] = await pool.query(countQuery, queryParams.slice(0, -2)); // Remove LIMIT and OFFSET params
      const totalItems = (countResults as any[])[0].count;
      const totalPages = Math.ceil(totalItems / limit);
      
      console.log(`Found ${totalItems} bookings for vendor ${vendorId}`);
      
      // Execute main query
      const [results] = await pool.query(query, queryParams);
      const bookings = (results as any[]).map(row => {
        // Use customer name from user if available, otherwise use firstName + lastName from customers table
        const customerName = row.customerName || 
          [row.customerFirstName, row.customerLastName].filter(Boolean).join(' ') || 
          'Guest';
        
        return {
          id: row.id,
          hotel: {
            id: row.hotelId,
            name: row.hotelName
          },
          room: {
            id: row.roomId,
            name: row.roomName,
            type: row.roomType
          },
          customer: {
            id: row.customerId,
            name: customerName,
            phone: row.customerPhone,
            email: row.customerEmail || 'No email provided'
          },
          checkInDate: row.checkInDate,
          checkOutDate: row.checkOutDate,
          numberOfGuests: row.numberOfGuests,
          totalAmount: parseFloat(row.totalAmount),
          status: row.status,
          paymentStatus: row.paymentStatus,
          specialRequests: row.specialRequests,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        };
      });
      
      return {
        data: bookings,
        meta: {
          totalItems,
          totalPages,
          currentPage: page,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('Error fetching vendor bookings:', error);
      throw error;
    }
  },

  /**
   * Get booking details by ID
   */
  async getBookingById(bookingId: string) {
    try {
      console.log('Fetching booking details for:', bookingId);
      
      const query = `
        SELECT 
          b.id, b.hotelId, b.roomId, b.customerId, b.checkInDate, b.checkOutDate, 
          b.numberOfGuests, b.totalAmount, b.status, b.paymentStatus, b.specialRequests, 
          b.createdAt, b.updatedAt,
          h.name as hotelName, h.address as hotelAddress, h.city as hotelCity, 
          h.state as hotelState, h.country as hotelCountry, h.phone as hotelPhone,
          r.name as roomName, r.type as roomType, r.pricePerNight, r.discountedPrice, r.images as roomImages,
          c.firstName as customerFirstName, c.lastName as customerLastName, 
          c.phone as customerPhone, c.address as customerAddress,
          u.name as customerName, u.email as customerEmail
        FROM bookings b
        JOIN hotels h ON b.hotelId = h.id
        JOIN rooms r ON b.roomId = r.id
        JOIN customers c ON b.customerId = c.id
        LEFT JOIN users u ON c.userId = u.id
        WHERE b.id = ?
      `;
      
      const [results] = await pool.query(query, [bookingId]);
      const bookings = results as any[];
      
      if (bookings.length === 0) {
        console.log('No booking found with ID:', bookingId);
        return null;
      }
      
      const booking = bookings[0];
      
      // Use customer name from user if available, otherwise use firstName + lastName from customers table
      const customerName = booking.customerName || 
        [booking.customerFirstName, booking.customerLastName].filter(Boolean).join(' ') || 
        'Guest';
      
      // Parse room images if they exist
      let roomImages = [];
      try {
        if (booking.roomImages) {
          roomImages = JSON.parse(booking.roomImages);
        }
      } catch (e) {
        console.error('Error parsing room images:', e);
      }
      
      return {
        id: booking.id,
        hotel: {
          id: booking.hotelId,
          name: booking.hotelName,
          address: booking.hotelAddress,
          city: booking.hotelCity,
          state: booking.hotelState,
          country: booking.hotelCountry,
          phone: booking.hotelPhone
        },
        room: {
          id: booking.roomId,
          name: booking.roomName,
          type: booking.roomType,
          pricePerNight: parseFloat(booking.pricePerNight),
          discountedPrice: booking.discountedPrice ? parseFloat(booking.discountedPrice) : null,
          images: roomImages
        },
        customer: {
          id: booking.customerId,
          name: customerName,
          email: booking.customerEmail,
          phone: booking.customerPhone,
          address: booking.customerAddress,
          firstName: booking.customerFirstName,
          lastName: booking.customerLastName
        },
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        numberOfGuests: booking.numberOfGuests,
        totalAmount: parseFloat(booking.totalAmount),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        specialRequests: booking.specialRequests,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      };
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: string) {
    try {
      const query = 'UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?';
      const [result] = await pool.query(query, [status, bookingId]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(bookingId: string, paymentStatus: string) {
    try {
      const query = 'UPDATE bookings SET paymentStatus = ?, updatedAt = NOW() WHERE id = ?';
      const [result] = await pool.query(query, [paymentStatus, bookingId]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  /**
   * Check in a guest
   */
  async checkInGuest(bookingId: string) {
    try {
      // First update the booking status
      const bookingQuery = 'UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?';
      const [bookingResult] = await pool.query(bookingQuery, ['CHECKED_IN', bookingId]);
      
      return (bookingResult as any).affectedRows > 0;
    } catch (error) {
      console.error('Error checking in guest:', error);
      throw error;
    }
  },

  /**
   * Check out a guest
   */
  async checkOutGuest(bookingId: string) {
    try {
      // Update the booking status
      const bookingQuery = 'UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?';
      const [bookingResult] = await pool.query(bookingQuery, ['CHECKED_OUT', bookingId]);
      
      return (bookingResult as any).affectedRows > 0;
    } catch (error) {
      console.error('Error checking out guest:', error);
      throw error;
    }
  }
}; 