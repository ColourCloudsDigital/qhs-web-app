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
    roomUnitId,
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
    roomUnitId?: string;
  }) {
    console.log('Fetching bookings for vendor:', vendorId);
    
    // Start building the query - using LEFT JOIN to include bookings without user accounts (guest bookings)
    let query = `
      SELECT 
        b.id, b.hotelId, b.roomUnitId, b.customerId, b.checkInDate, b.checkOutDate, 
        b.numberOfGuests, b.totalAmount, b.status, b.paymentStatus, b.specialRequests, 
        b.createdAt, b.updatedAt,
        h.name as hotelName,
        r.name as roomName, r.type as roomType,
        ru.roomNumber,
        c.firstName as customerFirstName, c.lastName as customerLastName, c.phone as customerPhone,
        u.name as customerName, u.email as customerEmail,
        COALESCE(SUM(p.amount), 0) as amountPaid
      FROM bookings b
      JOIN hotels h ON b.hotelId = h.id
      JOIN room_units ru ON b.roomUnitId = ru.id
      JOIN rooms r ON ru.roomId = r.id
      JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN payments p ON p.bookingId = b.id AND p.status = 'COMPLETED'
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

    if (roomUnitId) {
      query += ' AND b.roomUnitId = ?';
      queryParams.push(roomUnitId);
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
    
    // Add GROUP BY for the SUM aggregate
    query += ` GROUP BY b.id, b.hotelId, b.roomUnitId, b.customerId, b.checkInDate, b.checkOutDate,
      b.numberOfGuests, b.totalAmount, b.status, b.paymentStatus, b.specialRequests,
      b.createdAt, b.updatedAt, h.name, r.name, r.type, ru.roomNumber,
      c.firstName, c.lastName, c.phone, u.name, u.email`;

    // Count query — COUNT(DISTINCT b.id) with same joins/filters but no aggregation
    const countQuery = query
      .replace(/SELECT\s[\s\S]*?FROM\s+bookings\s+b/i,
        'SELECT COUNT(DISTINCT b.id) as count FROM bookings b')
      .replace(/GROUP BY[\s\S]*/i, '');

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
            id: row.roomUnitId,
            name: row.roomName,
            type: row.roomType,
            roomNumber: row.roomNumber
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
          amountPaid: parseFloat(row.amountPaid) || 0,
          balance: Math.max(0, parseFloat(row.totalAmount) - (parseFloat(row.amountPaid) || 0)),
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
          b.id, b.hotelId, b.roomUnitId, b.customerId, b.checkInDate, b.checkOutDate, 
          b.numberOfGuests, b.totalAmount, b.status, b.paymentStatus, b.specialRequests, 
          b.createdAt, b.updatedAt,
          h.name as hotelName, h.address as hotelAddress, h.city as hotelCity, 
          h.state as hotelState, h.country as hotelCountry, h.phone as hotelPhone,
          r.name as roomName, r.type as roomType, r.pricePerNight, r.discountedPrice, r.images as roomImages,
          ru.roomNumber,
          c.firstName as customerFirstName, c.lastName as customerLastName, 
          c.phone as customerPhone, c.address as customerAddress,
          u.name as customerName, u.email as customerEmail,
          COALESCE(SUM(p.amount), 0) as amountPaid
        FROM bookings b
        JOIN hotels h ON b.hotelId = h.id
        JOIN room_units ru ON b.roomUnitId = ru.id
        JOIN rooms r ON ru.roomId = r.id
        JOIN customers c ON b.customerId = c.id
        LEFT JOIN users u ON c.userId = u.id
        LEFT JOIN payments p ON p.bookingId = b.id AND p.status = 'COMPLETED'
        WHERE b.id = ?
        GROUP BY b.id
      `;
      
      const [results] = await pool.query(query, [bookingId]);
      const bookings = results as any[];
      
      if (bookings.length === 0) {
        console.log('No booking found with ID:', bookingId);
        return null;
      }
      
      const booking = bookings[0];

      // Fetch all payment records for this booking
      const [paymentRows] = await pool.query(
        `SELECT id, amount, status, paymentMethod, transactionId, createdAt
         FROM payments WHERE bookingId = ? ORDER BY createdAt ASC`,
        [bookingId]
      );
      
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
          id: booking.roomUnitId,
          name: booking.roomName,
          type: booking.roomType,
          roomNumber: booking.roomNumber,
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
        amountPaid: parseFloat(booking.amountPaid) || 0,
        balance: Math.max(0, parseFloat(booking.totalAmount) - (parseFloat(booking.amountPaid) || 0)),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        specialRequests: booking.specialRequests,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        payments: (paymentRows as any[]).map(p => ({
          id: p.id,
          amount: parseFloat(p.amount),
          status: p.status,
          paymentMethod: p.paymentMethod,
          transactionId: p.transactionId,
          createdAt: p.createdAt,
        })),
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
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        'UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?',
        [status, bookingId]
      );

      if ((result as any).affectedRows > 0) {
        // Sync room unit status based on booking status
        if (status === 'CHECKED_OUT' || status === 'CANCELLED') {
          await connection.query(
            `UPDATE room_units SET status = 'available', currentBookingId = NULL
             WHERE currentBookingId = ?`,
            [bookingId]
          );
        } else if (status === 'CHECKED_IN') {
          await connection.query(
            `UPDATE room_units SET status = 'occupied', currentBookingId = ?
             WHERE currentBookingId = ?`,
            [bookingId, bookingId]
          );
        } else if (status === 'CONFIRMED') {
          // Ensure room unit is marked reserved when booking is confirmed
          await connection.query(
            `UPDATE room_units SET status = 'reserved', currentBookingId = ?
             WHERE currentBookingId = ?`,
            [bookingId, bookingId]
          );
        }
      }

      await connection.commit();
      return (result as any).affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error updating booking status:', error);
      throw error;
    } finally {
      connection.release();
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
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [bookingResult] = await connection.query(
        'UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?',
        ['CHECKED_IN', bookingId]
      );

      if ((bookingResult as any).affectedRows > 0) {
        await connection.query(
          `UPDATE room_units SET status = 'occupied', currentBookingId = ?
           WHERE currentBookingId = ?`,
          [bookingId, bookingId]
        );
      }

      await connection.commit();
      return (bookingResult as any).affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error checking in guest:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Check out a guest
   */
  async checkOutGuest(bookingId: string) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [bookingResult] = await connection.query(
        'UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?',
        ['CHECKED_OUT', bookingId]
      );

      if ((bookingResult as any).affectedRows > 0) {
        await connection.query(
          `UPDATE room_units SET status = 'available', currentBookingId = NULL
           WHERE currentBookingId = ?`,
          [bookingId]
        );
      }

      await connection.commit();
      return (bookingResult as any).affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error checking out guest:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}; 