import pool from '@/lib/db';
import { PaginationParams, generateUUID } from '@/lib/utils';
import { moduleAccessService } from './module-access.service';
import { ModuleType } from '@/lib/types/enums';

export interface WiFiCredential {
  id: string;
  hotelId: string;
  bookingId?: string | null;
  roomId?: string | null;
  username: string;
  password: string;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WiFiConfig {
  networkName: string;
  isEnabled: boolean;
  bandwidthLimit?: number;
  usernameFormat?: string;
  passwordFormat?: string;
  termsAndConditions?: string;
  landingPageUrl?: string;
  autoDeactivate?: boolean;
}

export const wifiService = {
  /**
   * Get hotel WiFi configuration
   */
  async getWiFiConfig(hotelId: string): Promise<WiFiConfig | null> {
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { wifiConfig: true, vendorId: true },
    });

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // Parse and return the WiFi configuration
    return hotel.wifiConfig ? JSON.parse(hotel.wifiConfig as string) as WiFiConfig : null;
  },

  /**
   * Update hotel WiFi configuration
   */
  async updateWiFiConfig(hotelId: string, config: Partial<WiFiConfig>): Promise<WiFiConfig> {
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { wifiConfig: true, vendorId: true },
    });

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // Get existing config or create default
    const existingConfig = hotel.wifiConfig 
      ? JSON.parse(hotel.wifiConfig as string) as WiFiConfig 
      : {
          networkName: '',
          isEnabled: false,
        };

    // Merge existing config with updates
    const updatedConfig = {
      ...existingConfig,
      ...config,
    };

    // Update hotel with new WiFi config
    await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        wifiConfig: JSON.stringify(updatedConfig),
      },
    });

    return updatedConfig;
  },

  /**
   * Get paginated WiFi credentials
   */
  async getCredentials(
    hotelId: string,
    params: PaginationParams & {
      search?: string;
      isActive?: boolean;
      bookingId?: string;
      roomId?: string;
    }
  ) {
    const { page = 1, limit = 10, search, isActive, bookingId, roomId } = params;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build filter conditions
    const where: any = { hotelId };

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { 
          booking: {
            customer: {
              user: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          }
        },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    // Get credentials with count
    const [credentials, total] = await Promise.all([
      prisma.wiFiCredential.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          booking: {
            select: {
              id: true,
              checkInDate: true,
              checkOutDate: true,
              customer: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
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
        },
      }),
      prisma.wiFiCredential.count({ where }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data: credentials,
      meta: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  },

  /**
   * Get a WiFi credential by ID
   */
  async getCredentialById(id: string) {
    const credential = await prisma.wiFiCredential.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            checkInDate: true,
            checkOutDate: true,
            customer: {
              select: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
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
      },
    });

    if (!credential) {
      throw new Error('WiFi credential not found');
    }

    return credential;
  },

  /**
   * Generate a username for a WiFi credential
   */
  async generateUsername(hotelId: string, bookingId?: string, options?: {
    guestName?: string;
    roomNumber?: string;
    format?: string;
  }): Promise<string> {
    // Get hotel WiFi config to check for custom username format
    const wifiConfig = await this.getWiFiConfig(hotelId);
    const format = options?.format || wifiConfig?.usernameFormat || 'guest-{random}';
    
    let username = format;
    
    // If booking ID provided, get guest name
    let guestName = options?.guestName || '';
    let roomNumber = options?.roomNumber || '';
    
    if (bookingId && !guestName) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          room: {
            select: {
              name: true,
            },
          },
        },
      });
      
      if (booking) {
        guestName = booking.customer.user.name;
        roomNumber = booking.room.name.replace(/\D/g, ''); // Extract numbers from room name
      }
    }
    
    // Replace placeholders in the format
    if (guestName) {
      const initials = guestName
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toLowerCase();
        
      const firstName = guestName.split(' ')[0].toLowerCase();
      
      username = username
        .replace('{name}', guestName.toLowerCase().replace(/\s/g, ''))
        .replace('{firstname}', firstName)
        .replace('{initials}', initials);
    }
    
    if (roomNumber) {
      username = username.replace('{room}', roomNumber);
    }
    
    // Generate random part if needed
    if (username.includes('{random}')) {
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      username = username.replace('{random}', randomPart);
    }
    
    // Add timestamp if needed
    if (username.includes('{timestamp}')) {
      const timestamp = Date.now().toString().substring(7);
      username = username.replace('{timestamp}', timestamp);
    }
    
    // Check uniqueness and append number if needed
    const existingCredential = await prisma.wiFiCredential.findFirst({
      where: {
        hotelId,
        username,
      },
    });
    
    if (existingCredential) {
      // Append a random number to make unique
      const uniqueSuffix = Math.floor(Math.random() * 100);
      username = `${username}-${uniqueSuffix}`;
    }
    
    return username;
  },

  /**
   * Generate a password for a WiFi credential
   */
  async generatePassword(hotelId: string, options?: {
    length?: number;
    format?: string;
    roomNumber?: string;
  }): Promise<string> {
    // Get hotel WiFi config to check for custom password format
    const wifiConfig = await this.getWiFiConfig(hotelId);
    const format = options?.format || wifiConfig?.passwordFormat;
    
    // Use custom format if provided
    if (format) {
      let password = format;
      
      // Replace room placeholder if provided
      if (options?.roomNumber) {
        password = password.replace('{room}', options.roomNumber);
      }
      
      // Replace random placeholders
      if (password.includes('{random}')) {
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        password = password.replace('{random}', randomPart);
      }
      
      // Replace timestamp placeholder
      if (password.includes('{timestamp}')) {
        const timestamp = Date.now().toString().substring(7);
        password = password.replace('{timestamp}', timestamp);
      }
      
      return password;
    }
    
    // Otherwise, generate a secure random password
    const length = options?.length || 8;
    const charset = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  },

  /**
   * Create a new WiFi credential
   */
  async createCredential({
    hotelId,
    bookingId,
    roomId,
    username,
    password,
    validFrom,
    validTo,
    isActive = true,
  }: {
    hotelId: string;
    bookingId?: string;
    roomId?: string;
    username?: string;
    password?: string;
    validFrom: Date;
    validTo: Date;
    isActive?: boolean;
  }) {
    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, vendorId: true },
    });

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // Get booking if bookingId is provided
    let booking = null;
    if (bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          room: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Auto-set roomId from booking if not provided
      if (!roomId && booking.room) {
        roomId = booking.room.id;
      }
    }

    // If room ID is provided but no booking, verify room exists
    if (roomId && !booking) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        throw new Error('Room not found');
      }
    }

    // Generate username and password if not provided
    const generatedUsername = username || await this.generateUsername(
      hotelId, 
      bookingId,
      {
        guestName: booking?.customer.user.name,
        roomNumber: booking?.room.name.replace(/\D/g, ''),
      }
    );

    const generatedPassword = password || await this.generatePassword(
      hotelId,
      {
        roomNumber: booking?.room.name.replace(/\D/g, ''),
      }
    );

    // Create the WiFi credential
    const credential = await prisma.wiFiCredential.create({
      data: {
        hotelId,
        bookingId,
        roomId,
        username: generatedUsername,
        password: generatedPassword,
        validFrom,
        validTo,
        isActive,
      },
    });

    // If this is for a booking, update the booking's WiFi credentials
    if (bookingId) {
      // Get existing credentials if any
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { wifiCredentials: true },
      });

      // Parse existing credentials or initialize empty array
      const existingCredentials = booking?.wifiCredentials 
        ? JSON.parse(booking.wifiCredentials as string) 
        : [];

      // Add new credential to array
      const updatedCredentials = [
        ...existingCredentials,
        {
          id: credential.id,
          username: credential.username,
          password: credential.password,
          validFrom: credential.validFrom,
          validTo: credential.validTo,
          isActive: credential.isActive,
        },
      ];

      // Update booking with new credentials array
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          wifiCredentials: JSON.stringify(updatedCredentials),
        },
      });
    }

    return credential;
  },

  /**
   * Create bulk WiFi credentials
   */
  async createBulkCredentials({
    hotelId,
    quantity,
    validFrom,
    validTo,
    isActive = true,
    prefix = 'guest',
  }: {
    hotelId: string;
    quantity: number;
    validFrom: Date;
    validTo: Date;
    isActive?: boolean;
    prefix?: string;
  }) {
    // Limit maximum quantity
    const maxQuantity = 100;
    if (quantity > maxQuantity) {
      throw new Error(`Cannot create more than ${maxQuantity} credentials at once`);
    }

    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, vendorId: true },
    });

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // Check module limit
    const moduleLimits = await moduleAccessService.getModuleLimits(
      hotel.vendorId,
      ModuleType.WIFI
    );

    // If there's a limit on connections, check if we're exceeding it
    if (moduleLimits && moduleLimits.connections) {
      const currentCount = await prisma.wiFiCredential.count({
        where: { hotelId },
      });

      if (currentCount + quantity > moduleLimits.connections) {
        throw new Error(`Creating ${quantity} credentials would exceed your plan's limit of ${moduleLimits.connections} connections`);
      }
    }

    // Generate credentials in a transaction
    const credentials = await prisma.$transaction(async (tx) => {
      const createdCredentials = [];

      for (let i = 0; i < quantity; i++) {
        const username = `${prefix}-${Date.now().toString().substring(7)}-${i + 1}`;
        const password = await this.generatePassword(hotelId);

        const credential = await tx.wiFiCredential.create({
          data: {
            hotelId,
            username,
            password,
            validFrom,
            validTo,
            isActive,
          },
        });

        createdCredentials.push(credential);
      }

      return createdCredentials;
    });

    return credentials;
  },

  /**
   * Update an existing WiFi credential
   */
  async updateCredential(
    id: string,
    data: {
      username?: string;
      password?: string;
      validFrom?: Date;
      validTo?: Date;
      isActive?: boolean;
    }
  ) {
    // Check if credential exists
    const existingCredential = await prisma.wiFiCredential.findUnique({
      where: { id },
      include: {
        hotel: {
          select: {
            vendorId: true,
          },
        },
      },
    });

    if (!existingCredential) {
      throw new Error('WiFi credential not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      existingCredential.hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // Update the credential
    const updatedCredential = await prisma.wiFiCredential.update({
      where: { id },
      data,
    });

    // If credential is linked to a booking, update the booking's WiFi credentials
    if (updatedCredential.bookingId) {
      // Get the booking
      const booking = await prisma.booking.findUnique({
        where: { id: updatedCredential.bookingId },
        select: { wifiCredentials: true },
      });

      if (booking && booking.wifiCredentials) {
        // Parse existing credentials
        const existingCredentials = JSON.parse(booking.wifiCredentials as string);

        // Update the credential in the array
        const updatedCredentials = existingCredentials.map((cred: any) =>
          cred.id === id
            ? {
                ...cred,
                username: updatedCredential.username,
                password: updatedCredential.password,
                validFrom: updatedCredential.validFrom,
                validTo: updatedCredential.validTo,
                isActive: updatedCredential.isActive,
              }
            : cred
        );

        // Update booking with updated credentials array
        await prisma.booking.update({
          where: { id: updatedCredential.bookingId },
          data: {
            wifiCredentials: JSON.stringify(updatedCredentials),
          },
        });
      }
    }

    return updatedCredential;
  },

  /**
   * Generate a new password for an existing credential
   */
  async regeneratePassword(id: string) {
    // Check if credential exists
    const credential = await prisma.wiFiCredential.findUnique({
      where: { id },
      include: {
        hotel: {
          select: {
            id: true,
            vendorId: true,
          },
        },
      },
    });

    if (!credential) {
      throw new Error('WiFi credential not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      credential.hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // Generate a new password
    const newPassword = await this.generatePassword(credential.hotel.id);

    // Update the credential
    const updatedCredential = await this.updateCredential(id, {
      password: newPassword,
    });

    return updatedCredential;
  },

  /**
   * Toggle the active state of a credential
   */
  async toggleCredentialStatus(id: string) {
    // Check if credential exists
    const credential = await prisma.wiFiCredential.findUnique({
      where: { id },
      include: {
        hotel: {
          select: {
            vendorId: true,
          },
        },
      },
    });

    if (!credential) {
      throw new Error('WiFi credential not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      credential.hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // Toggle the active state
    const updatedCredential = await this.updateCredential(id, {
      isActive: !credential.isActive,
    });

    return updatedCredential;
  },

  /**
   * Delete a WiFi credential
   */
  async deleteCredential(id: string) {
    // Check if credential exists
    const credential = await prisma.wiFiCredential.findUnique({
      where: { id },
      include: {
        hotel: {
          select: {
            vendorId: true,
          },
        },
      },
    });

    if (!credential) {
      throw new Error('WiFi credential not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      credential.hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // If credential is linked to a booking, update the booking's WiFi credentials
    if (credential.bookingId) {
      // Get the booking
      const booking = await prisma.booking.findUnique({
        where: { id: credential.bookingId },
        select: { wifiCredentials: true },
      });

      if (booking && booking.wifiCredentials) {
        // Parse existing credentials
        const existingCredentials = JSON.parse(booking.wifiCredentials as string);

        // Remove the credential from the array
        const updatedCredentials = existingCredentials.filter(
          (cred: any) => cred.id !== id
        );

        // Update booking with updated credentials array
        await prisma.booking.update({
          where: { id: credential.bookingId },
          data: {
            wifiCredentials: JSON.stringify(updatedCredentials),
          },
        });
      }
    }

    // Delete the credential
    await prisma.wiFiCredential.delete({
      where: { id },
    });

    return { success: true };
  },

  /**
   * Delete all inactive credentials for a hotel
   */
  async deleteInactiveCredentials(hotelId: string) {
    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, vendorId: true },
    });

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // Delete inactive credentials
    const { count } = await prisma.wiFiCredential.deleteMany({
      where: {
        hotelId,
        isActive: false,
      },
    });

    return { success: true, count };
  },

  /**
   * Delete expired credentials for a hotel
   */
  async deleteExpiredCredentials(hotelId: string) {
    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, vendorId: true },
    });

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // Delete expired credentials
    const { count } = await prisma.wiFiCredential.deleteMany({
      where: {
        hotelId,
        validTo: {
          lt: new Date(),
        },
      },
    });

    return { success: true, count };
  },

  /**
   * Generate WiFi credentials for a booking
   */
  async generateCredentialsForBooking(bookingId: string) {
    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hotel: {
          select: {
            id: true,
            vendorId: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check module access
    const hasAccess = await moduleAccessService.hasModuleAccess(
      booking.hotel.vendorId,
      ModuleType.WIFI
    );

    if (!hasAccess) {
      throw new Error('Access to WiFi module not allowed with current subscription');
    }

    // Create a new credential
    const credential = await this.createCredential({
      hotelId: booking.hotel.id,
      bookingId: booking.id,
      roomId: booking.room.id,
      validFrom: booking.checkInDate,
      validTo: booking.checkOutDate,
      isActive: true,
    });

    return credential;
  },

  /**
   * Deactivate credentials for a booking
   */
  async deactivateBookingCredentials(bookingId: string) {
    // Get credentials for the booking
    const credentials = await prisma.wiFiCredential.findMany({
      where: {
        bookingId,
      },
    });

    // Update all credentials to inactive
    await Promise.all(
      credentials.map(async (credential) => {
        await this.updateCredential(credential.id, {
          isActive: false,
        });
      })
    );

    return { success: true, count: credentials.length };
  },
};

export default wifiService;