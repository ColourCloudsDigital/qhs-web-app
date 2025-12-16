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

    // Build filter conditions
    const where: any = {};

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add hotel filter
    if (hotelId) {
      where.hotelId = hotelId;
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add price range filters
    if (minPrice !== undefined) {
      where.pricePerNight = { ...where.pricePerNight, gte: minPrice };
    }

    if (maxPrice !== undefined) {
      where.pricePerNight = { ...where.pricePerNight, lte: maxPrice };
    }

    // Add capacity filter
    if (capacity !== undefined) {
      where.capacity = { gte: capacity };
    }

    // Get rooms with count
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              country: true,
            },
          },
          amenities: {
            include: {
              amenity: true,
            },
          },
        },
      }),
      prisma.room.count({ where }),
    ]);

    // Format the data for the response
    const formattedRooms = rooms.map((room) => ({
      ...room,
      images: JSON.parse(room.images as string),
      // Format amenities
      amenities: room.amenities.map((ra) => ({
        id: ra.amenity.id,
        name: ra.amenity.name,
        description: ra.amenity.description,
        icon: ra.amenity.icon,
        category: ra.amenity.category,
      })),
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
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            country: true,
            zipCode: true,
            images: true,
            rating: true,
          },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // Format the data
    return {
      ...room,
      images: JSON.parse(room.images as string),
      hotel: {
        ...room.hotel,
        images: JSON.parse(room.hotel.images as string),
      },
      amenities: room.amenities.map((ra) => ({
        id: ra.amenity.id,
        name: ra.amenity.name,
        description: ra.amenity.description,
        icon: ra.amenity.icon,
        category: ra.amenity.category,
      })),
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
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, vendorId: true },
    });

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    // Verify that amenities exist and are valid
    if (amenityIds.length > 0) {
      const amenities = await prisma.amenity.findMany({
        where: {
          id: { in: amenityIds },
          category: 'room',
        },
        select: { id: true },
      });

      if (amenities.length !== amenityIds.length) {
        throw new Error('One or more amenities are invalid or not categorized as room amenities');
      }
    }

    // Create room with amenities in a transaction
    const room = await prisma.$transaction(async (tx) => {
      // Create the room
      const newRoom = await tx.room.create({
        data: {
          hotelId,
          name,
          type,
          description,
          capacity,
          pricePerNight,
          discountedPrice,
          images: JSON.stringify(images),
          status,
        },
      });

      // Create room amenity connections if any
      if (amenityIds.length > 0) {
        await Promise.all(
          amenityIds.map((amenityId) =>
            tx.roomAmenity.create({
              data: {
                roomId: newRoom.id,
                amenityId,
              },
            })
          )
        );
      }

      return newRoom;
    });

    return {
      ...room,
      images: JSON.parse(room.images as string),
    };
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
    const existingRoom = await prisma.room.findUnique({
      where: { id },
      select: { id: true, hotelId: true, images: true },
    });

    if (!existingRoom) {
      throw new Error('Room not found');
    }

    // Verify that amenities exist and are valid (if provided)
    if (amenityIds && amenityIds.length > 0) {
      const amenities = await prisma.amenity.findMany({
        where: {
          id: { in: amenityIds },
          category: 'room',
        },
        select: { id: true },
      });

      if (amenities.length !== amenityIds.length) {
        throw new Error('One or more amenities are invalid or not categorized as room amenities');
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (pricePerNight !== undefined) updateData.pricePerNight = pricePerNight;
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice;
    if (status !== undefined) updateData.status = status;
    if (images !== undefined) updateData.images = JSON.stringify(images);

    // Update room and amenities in a transaction if needed
    const room = await prisma.$transaction(async (tx) => {
      // Update the room
      const updatedRoom = await tx.room.update({
        where: { id },
        data: updateData,
      });

      // Update amenities if provided
      if (amenityIds) {
        // Delete existing amenity connections
        await tx.roomAmenity.deleteMany({
          where: { roomId: id },
        });

        // Create new amenity connections
        if (amenityIds.length > 0) {
          await Promise.all(
            amenityIds.map((amenityId) =>
              tx.roomAmenity.create({
                data: {
                  roomId: id,
                  amenityId,
                },
              })
            )
          );
        }
      }

      return updatedRoom;
    });

    return {
      ...room,
      images: JSON.parse(room.images as string),
    };
  },

  /**
   * Delete a room
   */
  async deleteRoom(id: string) {
    // Verify that room exists
    const room = await prisma.room.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // Delete room (this will cascade delete related amenities)
    await prisma.room.delete({
      where: { id },
    });

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

    // Get all rooms in the hotel that can accommodate the guests
    const rooms = await prisma.room.findMany({
      where: {
        hotelId,
        capacity: { gte: guests },
        status: 'available',
      },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        bookings: {
          where: {
            OR: [
              {
                // Bookings that start during the requested period
                checkInDate: {
                  gte: checkInDate,
                  lt: checkOutDate,
                },
              },
              {
                // Bookings that end during the requested period
                checkOutDate: {
                  gt: checkInDate,
                  lte: checkOutDate,
                },
              },
              {
                // Bookings that completely encapsulate the requested period
                AND: [
                  {
                    checkInDate: {
                      lte: checkInDate,
                    },
                  },
                  {
                    checkOutDate: {
                      gte: checkOutDate,
                    },
                  },
                ],
              },
            ],
            status: {
              in: ['CONFIRMED', 'CHECKED_IN'],
            },
          },
        },
      },
    });

    // Filter out rooms that have bookings in the requested period
    const availableRooms = rooms.filter((room) => room.bookings.length === 0);

    // Format rooms for response
    const formattedRooms = availableRooms.map((room) => ({
      ...room,
      images: JSON.parse(room.images as string),
      bookings: undefined, // Remove bookings from response
      amenities: room.amenities.map((ra) => ({
        id: ra.amenity.id,
        name: ra.amenity.name,
        description: ra.amenity.description,
        icon: ra.amenity.icon,
        category: ra.amenity.category,
      })),
    }));

    // Apply pagination
    const paginatedRooms = formattedRooms.slice(offset, offset + limit);
    const totalRooms = formattedRooms.length;
    const totalPages = Math.ceil(totalRooms / limit);

    return {
      data: paginatedRooms,
      meta: {
        currentPage: page,
        totalPages,
        totalItems: totalRooms,
        itemsPerPage: limit,
      },
    };
  },
};