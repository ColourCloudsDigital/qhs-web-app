import pool from '@/lib/db';
import { BookingStatus, PaymentStatus } from '@/lib/types/enums';
import { availabilityService } from './availability.service';
import { emailService } from './email.service';
import { customerNotificationService } from './customer-notification.service';
import { PaginationParams } from '@/lib/utils';

// Helper function to safely parse JSON
function tryParseJSON(jsonString: any, defaultValue: any = null) {
  if (!jsonString) return defaultValue;

  try {
    if (typeof jsonString === 'string') {
      return JSON.parse(jsonString);
    }
    return jsonString;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return defaultValue;
  }
}

export const bookingService = {
  /**
   * Create a new booking
   */
  async createBooking({
    hotelId,
    roomId,
    customerId,
    checkInDate,
    checkOutDate,
    numberOfGuests,
    specialRequests,
    paymentMethod,
  }: {
    hotelId: string;
    roomId: string;
    customerId: string;
    checkInDate: Date;
    checkOutDate: Date;
    numberOfGuests: number;
    specialRequests?: string;
    paymentMethod: string;
  }) {
    // Check if room is available for the requested dates
    const isAvailable = await availabilityService.checkRoomAvailability({
      roomId,
      checkInDate,
      checkOutDate,
    });

    if (!isAvailable) {
      throw new Error('Room is not available for the selected dates');
    }

    // Get room details to calculate price
    const [roomResult] = await pool.query(`
      SELECT
        rooms.*,
        hotels.id as hotel_id,
        hotels.name as hotel_name,
        vendors.id as vendor_id
      FROM rooms
      JOIN hotels ON rooms.hotelId = hotels.id
      LEFT JOIN vendors ON hotels.vendorId = vendors.id
      WHERE rooms.id = ?
    `, [roomId]);

    const room = (roomResult as any[])[0];

    if (!room) {
      throw new Error('Room not found');
    }

    // Find available room unit for this room using the availability service
    const selectedRoomUnit = await availabilityService.selectBestRoomUnit({
      roomId,
      checkInDate,
      checkOutDate,
    });

    // Get hotel settings for payment
    const [paymentSettingsResult] = await pool.query(`
      SELECT
        allowPayAtHotel,
        requirePrePayment,
        taxRate,
        commissionRate
      FROM hotel_payment_settings
      WHERE hotelId = ?
    `, [hotelId]);

    const hotelPaymentSettings = (paymentSettingsResult as any[])[0];

    if (!hotelPaymentSettings) {
      throw new Error('Hotel payment settings not found');
    }

    // Check if payment method is allowed
    const isPayAtHotel = paymentMethod === 'PAY_AT_HOTEL';
    if (isPayAtHotel && !hotelPaymentSettings.allowPayAtHotel) {
      throw new Error('Pay at hotel is not allowed for this hotel');
    }

    if (isPayAtHotel && hotelPaymentSettings.requirePrePayment) {
      throw new Error('This hotel requires pre-payment');
    }

    // Calculate price
    const { totalPrice, nights } = await availabilityService.calculateBookingPrice({
      roomId,
      checkInDate,
      checkOutDate,
    });

    // Get customer details for email (already done above in the email section, so we can reuse the customer data)
    const [customerResults] = await pool.query(
      `SELECT * FROM customers
       LEFT JOIN users ON customers.userId = users.id
       WHERE customers.id = ?`,
      [customerId]
    );

    const customer = (customerResults as any[])[0];

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Determine initial booking and payment status
    const initialBookingStatus = isPayAtHotel
      ? BookingStatus.PENDING
      : BookingStatus.CONFIRMED;

    const initialPaymentStatus = isPayAtHotel
      ? PaymentStatus.PENDING
      : PaymentStatus.PENDING; // Will be updated after payment

    // Create booking in a transaction
    const connection = await pool.getConnection();
    let booking: any = null;

    try {
      await connection.beginTransaction();

      // Create booking using roomUnitId instead of roomId
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings (
          hotelId, roomUnitId, customerId, checkInDate, checkOutDate,
          numberOfGuests, totalAmount, status, paymentStatus, specialRequests,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          hotelId,
          selectedRoomUnit.id, // Use room unit ID instead of room ID
          customerId,
          checkInDate,
          checkOutDate,
          numberOfGuests,
          totalPrice,
          initialBookingStatus,
          initialPaymentStatus,
          specialRequests || null,
        ]
      );

      const bookingId = (bookingResult as any).insertId;

      // If payment is at hotel, we don't create a payment record yet
      if (!isPayAtHotel) {
        // Create payment record with zero amount, will be updated after payment
        await connection.query(
          `INSERT INTO payments (
            bookingId, customerId, amount, currency, paymentMethod, status,
            adminCommission, vendorAmount, taxAmount, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            bookingId,
            customerId,
            0, // Will be updated after payment
            'NGN',
            paymentMethod,
            PaymentStatus.PENDING,
            0, // Will be updated
            0, // Will be updated
            0, // Will be updated
          ]
        );
      }

      await connection.commit();

      // Fetch the created booking
      const [createdBookingResult] = await pool.query(
        'SELECT * FROM bookings WHERE id = ?',
        [bookingId]
      );

      booking = (createdBookingResult as any[])[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    // Send confirmation email if booking is confirmed
    if (booking.status === BookingStatus.CONFIRMED) {
      try {
        // Get customer details
        const [customerResults] = await pool.query(
          `SELECT * FROM customers 
           LEFT JOIN users ON customers.userId = users.id
           WHERE customers.id = ?`,
          [customerId]
        );
        
        const customer = (customerResults as any[])[0];
        
        // Get hotel details
        const [hotelResults] = await pool.query(
          `SELECT hotels.*, vendors.id as vendorId 
           FROM hotels 
           LEFT JOIN vendors ON hotels.vendorId = vendors.id
           WHERE hotels.id = ?`,
          [hotelId]
        );
        
        const hotel = (hotelResults as any[])[0];
        
        // Get room details using room unit
        const [roomResults] = await pool.query(
          `SELECT r.* FROM rooms r 
           JOIN room_units ru ON r.id = ru.roomId 
           WHERE ru.id = ?`,
          [selectedRoomUnit.id]
        );
        
        const room = (roomResults as any[])[0];
        
        if (customer && hotel && room) {
          // Send booking confirmation email
          await emailService.sendBookingConfirmation({
            to: customer.email,
            guestName: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
            bookingDetails: {
              id: booking.id,
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate,
              numberOfGuests: booking.numberOfGuests,
              totalAmount: booking.totalAmount,
              paymentStatus: booking.paymentStatus,
              roomType: room.type
            },
            hotelDetails: {
              name: hotel.name,
              address: hotel.address,
              city: hotel.city,
              state: hotel.state,
              country: hotel.country,
              phone: hotel.phone,
              email: hotel.email,
              currency: 'NGN',
              primaryColor: '#1e3a8a' // Default primary color
            },
            vendorId: hotel.vendorId // Pass vendor ID for vendor-specific templates
          });
        }
      } catch (error) {
        console.error('Failed to send booking confirmation email:', error);
        // Don't throw - booking should succeed even if email fails
      }
    }

    return {
      bookingId: booking.id,
      paymentRequired: !isPayAtHotel,
      totalAmount: totalPrice,
      nights,
    };
  },

  /**
   * Get a booking by ID
   */
  async getBookingById(id: string, includeCustomer = false, includeHotel = false, includeRoom = false) {
    // Get booking with all related data using room_units table
    const [bookingResults] = await pool.query(
            `SELECT bookings.*,
            hotels.id as hotelId,
            hotels.name as hotelName,
            hotels.address as hotelAddress,
            hotels.city as hotelCity,
            hotels.state as hotelState,
            hotels.country as hotelCountry,
            hotels.phone as hotelPhone,
            hotels.email as hotelEmail,
            hotels.images as hotelImages,
            hotels.vendorId as hotelVendorId,
            room_units.id as roomUnitId,
            room_units.roomNumber as roomNumber,
            rooms.id as roomId,
            rooms.name as roomName,
            rooms.type as roomType,
            rooms.capacity as roomCapacity,
            rooms.pricePerNight as roomPricePerNight,
            rooms.discountedPrice as roomDiscountedPrice,
            rooms.images as roomImages,
            customers.id as customerId,
            customers.firstName as customerFirstName,
            customers.lastName as customerLastName,
            customers.phone as customerPhone,
            users.name as userName,
            users.email as userEmail
      FROM bookings
      LEFT JOIN hotels ON bookings.hotelId = hotels.id
      LEFT JOIN room_units ON bookings.roomUnitId = room_units.id
      LEFT JOIN rooms ON room_units.roomId = rooms.id
      LEFT JOIN customers ON bookings.customerId = customers.id
      LEFT JOIN users ON customers.userId = users.id
      WHERE bookings.id = ?`,
      [id]
    );

    if ((bookingResults as any[]).length === 0) {
      throw new Error('Booking not found');
    }

    const bookingData = (bookingResults as any[])[0];

    // Get payments for this booking
    const [paymentsResult] = await pool.query(
      `SELECT
        id, bookingId, amount, currency, paymentMethod, status,
        transactionId,
        createdAt, updatedAt
       FROM payments
       WHERE bookingId = ?`,
      [id]
    );

    const payments = (paymentsResult as any[]);

    // Use user fields if present, otherwise fallback to customer fields
    const customerName = bookingData.userName || [bookingData.customerFirstName, bookingData.customerLastName].filter(Boolean).join(' ') || 'Guest';
    const customerEmail = bookingData.userEmail || bookingData.customerEmail || '';
    const customerPhone = bookingData.userPhone || bookingData.customerPhone || '';

    // Format the data
    const formattedBooking = {
      id: bookingData.id,
      hotelId: bookingData.hotelId,
      roomUnitId: bookingData.roomUnitId,
      roomId: bookingData.roomId, // Keep roomId for backward compatibility
      customerId: bookingData.customerId,
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      numberOfGuests: bookingData.numberOfGuests,
      totalAmount: bookingData.totalAmount,
      status: bookingData.status,
      paymentStatus: bookingData.paymentStatus,
      specialRequests: bookingData.specialRequests || '',
      createdAt: bookingData.createdAt,
      updatedAt: bookingData.updatedAt,
      payments: payments,
      hotel: includeHotel && bookingData.hotelId ? {
        id: bookingData.hotelId,
        name: bookingData.hotelName,
        address: bookingData.hotelAddress,
        city: bookingData.hotelCity,
        state: bookingData.hotelState,
        country: bookingData.hotelCountry,
        phone: bookingData.hotelPhone,
        email: bookingData.hotelEmail,
        images: tryParseJSON(bookingData.hotelImages, []),
        vendorId: bookingData.hotelVendorId
      } : null,
      room: includeRoom && bookingData.roomId ? {
        id: bookingData.roomId,
        name: bookingData.roomName,
        type: bookingData.roomType,
        capacity: bookingData.roomCapacity,
        pricePerNight: bookingData.roomPricePerNight,
        discountedPrice: bookingData.roomDiscountedPrice,
        images: tryParseJSON(bookingData.roomImages, []),
        roomUnit: {
          id: bookingData.roomUnitId,
          roomNumber: bookingData.roomNumber
        }
      } : null,
      customer: includeCustomer && bookingData.customerId ? {
        id: bookingData.customerId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        user: bookingData.userName ? {
          name: bookingData.userName,
          email: bookingData.userEmail,
        } : undefined
      } : null
    };

    return formattedBooking;
  },

  /**
   * Get bookings for a customer with pagination and optional status filter
   */
  async getCustomerBookings(
    customerId: string,
    { page = 1, limit = 10, status }: PaginationParams & { status?: BookingStatus }
  ) {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const whereConditions: string[] = ['bookings.customerId = ?'];
    const params: any[] = [customerId];

    if (status) {
      whereConditions.push('bookings.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get bookings with count
    const [bookingsResult, countResult] = await Promise.all([
      pool.query(`
        SELECT
          bookings.*,
          hotels.id as hotel_id,
          hotels.name as hotel_name,
          hotels.city as hotel_city,
          hotels.state as hotel_state,
          hotels.country as hotel_country,
          hotels.images as hotel_images,
          room_units.id as room_unit_id,
          room_units.roomNumber as room_number,
          rooms.id as room_id,
          rooms.name as room_name,
          rooms.type as room_type
        FROM bookings
        LEFT JOIN hotels ON bookings.hotelId = hotels.id
        LEFT JOIN room_units ON bookings.roomUnitId = room_units.id
        LEFT JOIN rooms ON room_units.roomId = rooms.id
        WHERE ${whereClause}
        ORDER BY bookings.createdAt DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]),
      pool.query(`
        SELECT COUNT(*) as total
        FROM bookings
        WHERE ${whereClause}
      `, params)
    ]);

    const bookingsData = (bookingsResult as any[])[0];
    const total = (countResult as any[])[0][0].total;

    // Get payments for these bookings
    const bookingIds = bookingsData.map((booking: any) => booking.id);
    let paymentsMap: { [key: string]: any[] } = {};

    if (bookingIds.length > 0) {
      const [paymentsResult] = await pool.query(`
        SELECT
          bookingId,
          id,
          status,
          paymentMethod,
          amount,
          transactionId
        FROM payments
        WHERE bookingId IN (${bookingIds.map(() => '?').join(',')})
      `, bookingIds);

      const payments = (paymentsResult as any[]);

      // Group payments by bookingId
      paymentsMap = payments.reduce((acc: { [key: string]: any[] }, payment: any) => {
        if (!acc[payment.bookingId]) {
          acc[payment.bookingId] = [];
        }
        acc[payment.bookingId].push({
          id: payment.id,
          status: payment.status,
          method: payment.paymentMethod,
          amount: payment.amount,
          transactionId: payment.transactionId,
        });
        return acc;
      }, {});
    }

    // Format the data
    const formattedBookings = bookingsData.map((booking: any) => ({
      id: booking.id,
      hotelId: booking.hotelId,
      roomUnitId: booking.roomUnitId,
      roomId: booking.room_id, // Keep roomId for backward compatibility
      customerId: booking.customerId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      numberOfGuests: booking.numberOfGuests,
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      hotel: {
        id: booking.hotel_id,
        name: booking.hotel_name,
        city: booking.hotel_city,
        state: booking.hotel_state,
        country: booking.hotel_country,
        images: JSON.parse(booking.hotel_images || '[]'),
      },
      room: {
        id: booking.room_id,
        name: booking.room_name,
        type: booking.room_type,
        roomUnit: {
          id: booking.room_unit_id,
          roomNumber: booking.room_number
        }
      },
      payments: paymentsMap[booking.id] || [],
    }));

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedBookings,
      meta: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  },

  /**
   * Get bookings for a hotel with pagination
   */
  async getHotelBookings(
    hotelId: string,
    {
      page = 1,
      limit = 10,
      status,
      search,
      checkInDate,
      checkOutDate,
    }: PaginationParams & {
      status?: BookingStatus;
      search?: string;
      checkInDate?: Date;
      checkOutDate?: Date;
    }
  ) {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const whereConditions: string[] = ['bookings.hotelId = ?'];
    const params: any[] = [hotelId];

    if (status) {
      whereConditions.push('bookings.status = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push(`(
        users.name LIKE ?
        OR users.email LIKE ?
        OR bookings.id LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (checkInDate) {
      whereConditions.push('bookings.checkInDate >= ?');
      params.push(checkInDate);
    }

    if (checkOutDate) {
      whereConditions.push('bookings.checkOutDate <= ?');
      params.push(checkOutDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get bookings with count using the correct schema
    const [bookingsResult, countResult] = await Promise.all([
      pool.query(`
        SELECT
          bookings.*,
          customers.id as customer_id,
          customers.firstName as customer_firstName,
          customers.lastName as customer_lastName,
          customers.phone as customer_phone,
          customers.email as customer_email,
          users.name as user_name,
          users.email as user_email,
          room_units.id as room_unit_id,
          room_units.roomNumber as room_number,
          rooms.id as room_id,
          rooms.name as room_name,
          rooms.type as room_type
        FROM bookings
        LEFT JOIN customers ON bookings.customerId = customers.id
        LEFT JOIN users ON customers.userId = users.id
        LEFT JOIN room_units ON bookings.roomUnitId = room_units.id
        LEFT JOIN rooms ON room_units.roomId = rooms.id
        WHERE ${whereClause}
        ORDER BY bookings.createdAt DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]),
      pool.query(`
        SELECT COUNT(*) as total
        FROM bookings
        LEFT JOIN customers ON bookings.customerId = customers.id
        LEFT JOIN users ON customers.userId = users.id
        LEFT JOIN room_units ON bookings.roomUnitId = room_units.id
        WHERE ${whereClause}
      `, params)
    ]);

    const bookingsData = (bookingsResult as any[])[0];
    const total = (countResult as any[])[0][0].total;

    // Get payments for these bookings
    const bookingIds = bookingsData.map((booking: any) => booking.id);
    let paymentsMap: { [key: string]: any[] } = {};

    if (bookingIds.length > 0) {
      const [paymentsResult] = await pool.query(`
        SELECT
          bookingId,
          id,
          status,
          paymentMethod,
          amount,
          transactionId
        FROM payments
        WHERE bookingId IN (${bookingIds.map(() => '?').join(',')})
      `, bookingIds);

      const payments = (paymentsResult as any[]);

      // Group payments by bookingId
      paymentsMap = payments.reduce((acc: { [key: string]: any[] }, payment: any) => {
        if (!acc[payment.bookingId]) {
          acc[payment.bookingId] = [];
        }
        acc[payment.bookingId].push({
          id: payment.id,
          status: payment.status,
          method: payment.paymentMethod,
          amount: payment.amount,
          transactionId: payment.transactionId,
        });
        return acc;
      }, {});
    }

    // Format the data to match the original structure
    const formattedBookings = bookingsData.map((booking: any) => ({
      id: booking.id,
      hotelId: booking.hotelId,
      roomUnitId: booking.roomUnitId,
      roomId: booking.room_id, // Keep roomId for backward compatibility
      customerId: booking.customerId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      numberOfGuests: booking.numberOfGuests,
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      customer: {
        id: booking.customer_id,
        firstName: booking.customer_firstName,
        lastName: booking.customer_lastName,
        phone: booking.customer_phone,
        email: booking.customer_email,
        user: {
          name: booking.user_name || `${booking.customer_firstName || ''} ${booking.customer_lastName || ''}`.trim(),
          email: booking.user_email || booking.customer_email,
        },
      },
      room: {
        id: booking.room_id,
        name: booking.room_name,
        type: booking.room_type,
        roomUnit: {
          id: booking.room_unit_id,
          roomNumber: booking.room_number
        }
      },
      payments: paymentsMap[booking.id] || [],
    }));

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedBookings,
      meta: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(id: string, status: BookingStatus, staffId?: string) {
    // Verify that booking exists and get related data
    const booking = await this.getBookingById(id, true, true, true);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Update booking status
    await pool.query(
      'UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?',
      [status, id]
    );

    // Get updated booking
    const updatedBooking = await this.getBookingById(id, false, false, false);

    // Send notification based on status change
    if (booking.customer && booking.hotel && booking.room) {
      try {
        // Get customer userId for notification
        const [customerRows] = await pool.query(
          'SELECT userId FROM customers WHERE id = ?',
          [booking.customerId]
        );
        
        const customer = (customerRows as any[])[0];
        
        if (customer && customer.userId) {
          let notificationType: 'created' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out' | 'modified' = 'modified';
          
          switch (status) {
            case BookingStatus.CONFIRMED:
              notificationType = 'confirmed';
              break;
            case BookingStatus.CANCELLED:
              notificationType = 'cancelled';
              break;
            case BookingStatus.CHECKED_IN:
              notificationType = 'checked_in';
              break;
            case BookingStatus.CHECKED_OUT:
              notificationType = 'checked_out';
              break;
            default:
              notificationType = 'modified';
          }

          await customerNotificationService.sendBookingNotification(notificationType, {
            bookingId: booking.id,
            customerId: booking.customerId,
            userId: customer.userId,
            hotelName: booking.hotel?.name || 'Hotel',
            roomName: booking.room?.name || 'Room',
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            totalAmount: booking.totalAmount,
            status: status
          });
        }
      } catch (notificationError) {
        console.error('Failed to send booking status notification:', notificationError);
        // Don't fail the status update if notification fails
      }
    }

    // Send notification email based on status change
    if (status === BookingStatus.CONFIRMED) {
      try {
        if (booking.customer && booking.hotel) {
          // Send booking confirmation email
          await emailService.sendBookingConfirmation({
            to: booking.customer?.email || '',
            guestName: booking.customer.name || 'Guest',
            bookingDetails: {
              id: booking.id,
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate,
              numberOfGuests: booking.numberOfGuests,
              totalAmount: booking.totalAmount,
              paymentStatus: booking.paymentStatus,
              roomType: booking.room?.type || 'Standard Room'
            },
            hotelDetails: {
              name: booking.hotel?.name || 'Hotel',
              address: booking.hotel?.address || '',
              city: booking.hotel?.city || '',
              state: booking.hotel?.state || '',
              country: booking.hotel?.country || '',
              phone: booking.hotel?.phone || '',
              email: booking.hotel?.email || '',
              currency: 'NGN',
              primaryColor: '#1e3a8a' // Default primary color
            },
            vendorId: booking.hotel.vendorId || '' // Pass vendor ID for vendor-specific templates
          });
        }
      } catch (error) {
        console.error('Failed to send booking status update email:', error);
        // Don't throw - status update should succeed even if email fails
      }
    }

    return updatedBooking;
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(id: string, reason: string, cancelledBy: 'CUSTOMER' | 'VENDOR' | 'ADMIN') {
    // Verify that booking exists and get related data
    const booking = await this.getBookingById(id, true, true, true);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if booking can be cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.CHECKED_IN || booking.status === BookingStatus.CHECKED_OUT) {
      throw new Error('Cannot cancel a booking that has already checked in or checked out');
    }

    // Calculate if refund is applicable
    // This is a simplified example - actual refund policy would depend on business rules
    const now = new Date();
    const hoursTillCheckIn = (new Date(booking.checkInDate).getTime() - now.getTime()) / (1000 * 60 * 60);
    const isRefundEligible = hoursTillCheckIn >= 24; // Refund if cancellation is at least 24 hours before check-in

    // Update booking and handle payment in a transaction
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update booking special requests with cancellation info
      const currentSpecialRequests = booking.specialRequests || '';
      const cancellationNote = `CANCELLATION: ${reason} (by ${cancelledBy})`;
      const updatedSpecialRequests = currentSpecialRequests
        ? `${currentSpecialRequests}\n\n${cancellationNote}`
        : cancellationNote;

      // Update booking status
      await connection.query(
        'UPDATE bookings SET status = ?, specialRequests = ?, updatedAt = NOW() WHERE id = ?',
        [BookingStatus.CANCELLED, updatedSpecialRequests, id]
      );

      // Handle payment if there's any completed payment
      if (booking.payments && booking.payments.length > 0 && booking.paymentStatus === PaymentStatus.COMPLETED) {
        // If refund is eligible, update payment status
        if (isRefundEligible) {
          await connection.query(
            'UPDATE payments SET status = ? WHERE bookingId = ?',
            [PaymentStatus.REFUNDED, id]
          );

          // Update booking payment status
          await connection.query(
            'UPDATE bookings SET paymentStatus = ? WHERE id = ?',
            [PaymentStatus.REFUNDED, id]
          );
        }
      }

      // Release room units back to available status
      // Clear currentBookingId and set status back to 'available'
      await connection.query(
        'UPDATE room_units SET status = ?, currentBookingId = NULL WHERE currentBookingId = ?',
        ['available', id]
      );

      await connection.commit();

      // Send cancellation notification
      if (booking.customer && booking.hotel && booking.room) {
        try {
          // Get customer userId for notification
          const [customerRows] = await pool.query(
            'SELECT userId FROM customers WHERE id = ?',
            [booking.customerId]
          );
          
          const customer = (customerRows as any[])[0];
          
          if (customer && customer.userId) {
            await customerNotificationService.sendBookingNotification('cancelled', {
              bookingId: booking.id,
              customerId: booking.customerId,
              userId: customer.userId,
              hotelName: booking.hotel?.name || 'Hotel',
              roomName: booking.room?.name || 'Room',
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate,
              totalAmount: booking.totalAmount,
              status: BookingStatus.CANCELLED
            });

            // If refund is eligible, also send payment refund notification
            if (isRefundEligible && booking.payments && booking.payments.length > 0) {
              await customerNotificationService.sendPaymentNotification('refunded', {
                paymentId: booking.payments[0].id,
                bookingId: booking.id,
                customerId: booking.customerId,
                userId: customer.userId,
                amount: booking.totalAmount,
                status: 'REFUNDED',
                hotelName: booking.hotel?.name || 'Hotel',
                paymentMethod: booking.payments[0].method || 'Unknown'
              });
            }
          }
        } catch (notificationError) {
          console.error('Failed to send cancellation notification:', notificationError);
          // Don't fail the cancellation if notification fails
        }
      }

      // Get updated booking
      const updatedBooking = await this.getBookingById(id, false, false, false);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    // Send cancellation email
    try {
      // Implement cancellation email logic here
      // This could use emailService.sendCancellationEmail
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      // We don't want to fail the cancellation if email fails
    }

    return {
      ...booking,
      status: BookingStatus.CANCELLED,
      specialRequests: booking.specialRequests,
      isRefundEligible,
    };
  },
};
