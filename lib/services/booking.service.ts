import pool from '@/lib/db';
import { BookingStatus, PaymentStatus } from '@/lib/types/enums';
import { availabilityService } from './availability.service';
import { emailService } from './email.service';
import { PaginationParams } from '@/lib/utils';

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
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            vendor: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // Get hotel settings for payment
    const hotelPaymentSettings = await prisma.hotelPaymentSetting.findUnique({
      where: { hotelId },
      select: {
        allowPayAtHotel: true,
        requirePrePayment: true,
        taxRate: true,
        commissionRate: true,
      },
    });

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

    // Get customer details for email
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

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
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          hotelId,
          roomId,
          customerId,
          checkInDate,
          checkOutDate,
          numberOfGuests,
          totalAmount: totalPrice,
          status: initialBookingStatus,
          paymentStatus: initialPaymentStatus,
          specialRequests,
        },
      });

      // If payment is at hotel, we don't create a payment record yet
      if (!isPayAtHotel) {
        // Create payment record with zero amount, will be updated after payment
        await tx.payment.create({
          data: {
            bookingId: newBooking.id,
            customerId,
            amount: 0, // Will be updated after payment
            currency: 'NGN',
            method: paymentMethod,
            status: PaymentStatus.PENDING,
            adminCommission: 0, // Will be updated
            vendorAmount: 0, // Will be updated
            taxAmount: 0, // Will be updated
          },
        });
      }

      return newBooking;
    });

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
        
        // Get room details
        const [roomResults] = await pool.query(
          `SELECT * FROM rooms WHERE id = ?`,
          [roomId]
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
    try {
      // Use LEFT JOIN for users to support guest bookings
      const [bookingResults] = await pool.query(
        `SELECT bookings.*, 
                hotels.id as hotelId, 
                hotels.name as hotelName, 
                hotels.address as hotelAddress, 
                hotels.city as hotelCity,
                hotels.state as hotelState,
                hotels.country as hotelCountry,
                hotels.images as hotelImages,
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
                customers.email as customerEmail,
                users.name as userName,
                users.email as userEmail,
                users.phone as userPhone
         FROM bookings
         JOIN hotels ON bookings.hotelId = hotels.id
         JOIN rooms ON bookings.roomId = rooms.id
         JOIN customers ON bookings.customerId = customers.id
         LEFT JOIN users ON customers.userId = users.id
         WHERE bookings.id = ?`,
        [id]
      );
      if ((bookingResults as any[]).length === 0) {
        throw new Error('Booking not found');
      }
      const bookingData = (bookingResults as any[])[0];
      // Use user fields if present, otherwise fallback to customer fields
      const customerName = bookingData.userName || [bookingData.customerFirstName, bookingData.customerLastName].filter(Boolean).join(' ') || 'Guest';
      const customerEmail = bookingData.userEmail || bookingData.customerEmail || '';
      const customerPhone = bookingData.userPhone || bookingData.customerPhone || '';
      // Format the data
      const formattedBooking = {
        id: bookingData.id,
        hotelId: bookingData.hotelId,
        roomId: bookingData.roomId,
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
        hotel: {
          id: bookingData.hotelId,
          name: bookingData.hotelName,
          address: bookingData.hotelAddress,
          city: bookingData.hotelCity,
          state: bookingData.hotelState,
          country: bookingData.hotelCountry,
          images: tryParseJSON(bookingData.hotelImages, [])
        },
        room: {
          id: bookingData.roomId,
          name: bookingData.roomName,
          type: bookingData.roomType,
          capacity: bookingData.roomCapacity,
          pricePerNight: bookingData.roomPricePerNight,
          discountedPrice: bookingData.roomDiscountedPrice,
          images: tryParseJSON(bookingData.roomImages, [])
        },
        customer: {
          id: bookingData.customerId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        }
      };
      return formattedBooking;
    } catch (error) {
      console.error('Error fetching booking with pool:', error);
      
      // If pool method fails, try using Prisma as a fallback
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          customer: includeCustomer
            ? {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              }
            : false,
          hotel: includeHotel
            ? {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  state: true,
                  country: true,
                  phone: true,
                  email: true,
                  images: true,
                },
              }
            : false,
          room: includeRoom
            ? {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  capacity: true,
                  pricePerNight: true,
                  discountedPrice: true,
                  images: true,
                },
              }
            : false,
          payments: true,
          keycards: true,
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Format the data
      const formattedBooking = {
        ...booking,
        wifiCredentials: booking.wifiCredentials
          ? JSON.parse(booking.wifiCredentials as string)
          : null,
        hotel: booking.hotel
          ? {
              ...booking.hotel,
              images: JSON.parse(booking.hotel.images as string),
            }
          : null,
        room: booking.room
          ? {
              ...booking.room,
              images: JSON.parse(booking.room.images as string),
            }
          : null,
      };

      return formattedBooking;
    }
  },

  /**
   * Get bookings for a customer with pagination
   */
  async getCustomerBookings(customerId: string, { page = 1, limit = 10 }: PaginationParams) {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Get bookings with count
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: {
          customerId,
        },
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              country: true,
              images: true,
            },
          },
          room: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          payments: {
            select: {
              id: true,
              status: true,
              method: true,
              amount: true,
              transactionId: true,
            },
          },
        },
      }),
      prisma.booking.count({
        where: {
          customerId,
        },
      }),
    ]);

    // Format the data
    const formattedBookings = bookings.map((booking) => ({
      ...booking,
      hotel: {
        ...booking.hotel,
        images: JSON.parse(booking.hotel.images as string),
      },
      payments: booking.payments,
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

    // Build filters
    const where: any = {
      hotelId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          customer: {
            user: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          customer: {
            user: {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          id: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (checkInDate) {
      where.checkInDate = {
        ...where.checkInDate,
        gte: checkInDate,
      };
    }

    if (checkOutDate) {
      where.checkOutDate = {
        ...where.checkOutDate,
        lte: checkOutDate,
      };
    }

    // Get bookings with count
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          room: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          payments: {
            select: {
              id: true,
              status: true,
              method: true,
              amount: true,
              transactionId: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data: bookings,
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
    // Verify that booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        hotel: {
          select: {
            name: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Send notification email based on status change
    if (status === BookingStatus.CONFIRMED) {
      try {
        // Get booking details with customer and hotel information
        const booking = await this.getBookingById(id, true, true, true);
        
        if (booking && booking.customer && booking.hotel) {
          // Send booking confirmation email
          await emailService.sendBookingConfirmation({
            to: booking.customer.user.email,
            guestName: booking.customer.user.name,
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
              name: booking.hotel.name,
              address: booking.hotel.address,
              city: booking.hotel.city,
              state: booking.hotel.state,
              country: booking.hotel.country,
              phone: booking.hotel.phone,
              email: booking.hotel.email,
              currency: 'NGN',
              primaryColor: '#1e3a8a' // Default primary color
            },
            vendorId: booking.hotel.vendorId // Pass vendor ID for vendor-specific templates
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
    // Verify that booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        payments: true,
        hotel: {
          select: {
            name: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

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
    const hoursTillCheckIn = (booking.checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isRefundEligible = hoursTillCheckIn >= 24; // Refund if cancellation is at least 24 hours before check-in

    // Update booking and handle payment in a transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const cancelled = await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          specialRequests: booking.specialRequests
            ? `${booking.specialRequests}\n\nCANCELLATION: ${reason} (by ${cancelledBy})`
            : `CANCELLATION: ${reason} (by ${cancelledBy})`,
        },
      });

      // Handle payment if there's any
      if (booking.payments.length > 0 && booking.paymentStatus === PaymentStatus.PAID) {
        // If refund is eligible, update payment status
        if (isRefundEligible) {
          await tx.payment.updateMany({
            where: { bookingId: id },
            data: {
              status: PaymentStatus.REFUNDED,
            },
          });

          // Update booking payment status
          await tx.booking.update({
            where: { id },
            data: {
              paymentStatus: PaymentStatus.REFUNDED,
            },
          });
        }
      }

      return cancelled;
    });

    // Send cancellation email
    try {
      // Implement cancellation email logic here
      // This could use emailService.sendCancellationEmail
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      // We don't want to fail the cancellation if email fails
    }

    return {
      ...updatedBooking,
      isRefundEligible,
    };
  },
};

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